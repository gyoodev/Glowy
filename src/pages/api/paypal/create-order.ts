
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// This check is important for server-side execution.
if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set in environment variables for create-order API.");
  // In a real app, you might throw an error here to prevent the module from loading
  // or handle it in a way that subsequent calls will fail gracefully.
}

// Determine PayPal environment based on NODE_ENV
// Ensure clientId and clientSecret are not undefined before using them
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    // Using standard string concatenation
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server.' });
  }

  const { packageId, businessId, amount, currency, description } = req.body;

  if (!packageId || !businessId || !amount || !currency || !description) {
    return res.status(400).json({ success: false, message: 'Missing required fields for PayPal order creation.' });
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      custom_id: packageId, // Store packageId here
      reference_id: businessId, // Store businessId here
      description: description,
      amount: {
        currency_code: currency,
        value: Number(amount).toFixed(2), // Ensure amount is a string with 2 decimal places
      },
    }],
    application_context: {
      shipping_preference: 'NO_SHIPPING' // Important for digital goods/services
    }
  });

  try {
    const order = await client.execute(request);
    res.status(201).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    let errorMessage = 'Failed to create PayPal order.';

    // More robust error message extraction from PayPal SDK
    if (error.statusCode && error.message) { // PayPal SDK v1 error structure (older SDK versions)
      errorMessage = error.message; // The message might be a JSON string
      try {
        // Attempt to parse if message is JSON stringified error details
        const errorDetailsParsed = JSON.parse(error.message);
        if (errorDetailsParsed.details && errorDetailsParsed.details.length > 0) {
          errorMessage = errorDetailsParsed.details.map((d: any) => d.issue + (d.description ? (' (' + d.description + ')') : '')).join(', ');
        } else if (errorDetailsParsed.message) {
          errorMessage = errorDetailsParsed.message;
        }
      } catch (e) {
        // If parsing fails, use the original error.message
      }
      console.error('PayPal Error Details (SDK v1 style or similar):', error.message);
    } else if (error.isAxiosError && error.response && error.response.data) { // Paypal SDK v2 uses different error structure
        errorMessage = error.response.data.message || errorMessage;
        if(error.response.data.details && error.response.data.details.length > 0){
            errorMessage += ' Details: ' + error.response.data.details.map((d:any) => d.issue + (d.description ? (' (' + d.description + ')') : '') ).join(', ');
        }
        console.error('PayPal Create Error Details (Axios style):', error.response.data);
    } else if (error.message) { // Fallback for other error types
      errorMessage = error.message;
    }
    res.status(error.statusCode || 500).json({ success: false, message: errorMessage, details: error.data?.details || error.details || null });
  }
}
