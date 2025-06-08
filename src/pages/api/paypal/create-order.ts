
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalMode = process.env.PAYPAL_ENVIRONMENT || 'sandbox'; // Default to 'sandbox'

if (!clientId || !clientSecret) {
  console.error("FATAL SERVER ERROR: PayPal Client ID or Client Secret is not configured in environment variables (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET). PayPal API calls will fail.");
}

// Conditional environment setup
let environment;
if (paypalMode === 'live') {
  environment = new paypal.core.LiveEnvironment(clientId!, clientSecret!);
} else {
  environment = new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
}
console.log(`PayPal API configured for ${paypalMode.toUpperCase()} environment.`);

const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
  }

  if (!clientId || !clientSecret) {
    // This check is repeated here to ensure it's caught before trying to use the client if somehow missed above.
    console.error("PayPal API credentials not configured on the server for create-order. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server. Please contact support or check server logs.' });
  }

  const { amount, currency, packageId, businessId, description } = req.body;

  if (!amount || !currency || !packageId || !businessId) {
      return res.status(400).json({ success: false, message: 'Missing required fields (amount, currency, packageId, businessId).' });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount,
      },
      custom_id: packageId, // Used to identify the package later
      reference_id: businessId, // Used to identify the business
      description: description || ('Promotion: ' + packageId + ' for business ' + businessId),
    }],
  });

  try {
    const order = await client.execute(request);
    console.log(`PayPal order ${order.result.id} created successfully for ${paypalMode} environment.`);
    res.status(200).json({ success: true, orderID: order.result.id });
  } catch (e: unknown) {
    let errorMessage = 'Failed to create PayPal order.';
    let errorDetails = null;

    if (e instanceof Error) {
        errorMessage = e.message;
        const paypalError = e as any; // Cast to any to access potential PayPal-specific error details
        if (paypalError.statusCode && paypalError.message && typeof paypalError.message === 'string') {
             // PayPal SDK errors often have statusCode and a JSON message
            try {
                const parsedMessage = JSON.parse(paypalError.message);
                errorMessage = parsedMessage.message || errorMessage;
                if (parsedMessage.name === 'AUTHENTICATION_FAILURE' || parsedMessage.name === 'INVALID_RESOURCE_ID' || (parsedMessage.details && parsedMessage.details.some((d: any) => d.issue === 'INVALID_CLIENT'))) {
                   errorMessage = `PayPal Authentication Failed: ${parsedMessage.message}. Please verify your PayPal API Client ID and Secret, and ensure they match the configured environment (${paypalMode.toUpperCase()}).`;
                }
                errorDetails = parsedMessage.details || errorDetails;
                console.error('Detailed PayPal Create Order Error:', JSON.stringify(parsedMessage, null, 2));
            } catch (jsonError) {
                // If message is not JSON, use the original error message
                console.error(`PayPal Create Order Error (Status ${paypalError.statusCode}): ${e.message}`);
            }
        } else {
           console.error('PayPal Create Order Error:', e.message, e.stack);
        }
    } else {
        console.error('PayPal Create Order Error (unknown type):', e);
    }
    res.status(500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
