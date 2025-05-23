
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

// Replace with your actual PayPal credentials from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// This check is important for server-side execution.
if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set in environment variables for create-order API. Ensure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set.");
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
    return res.status(405).end('Method ' + req.method + ' Not Allowed'); // Corrected line
  }

  if (!clientId || !clientSecret) {
    console.error("PayPal API credentials not configured on the server for create-order handler.");
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
      custom_id: packageId, // Used to pass packageId
      reference_id: businessId, // Used to pass businessId
      description: description,
      amount: {
        currency_code: currency,
        value: Number(amount).toFixed(2), // Ensure amount is a string with 2 decimal places
      },
    }],
    application_context: {
      shipping_preference: 'NO_SHIPPING'
    }
  });

  try {
    const order = await client.execute(request);
    res.status(201).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    let errorMessage = 'Failed to create PayPal order.';
    let errorDetails = null;

    if (error.statusCode && error.message) {
        try {
            const parsedMessage = JSON.parse(error.message);
            if (parsedMessage.name) errorMessage = parsedMessage.name + ': ' + (parsedMessage.message || 'Unknown PayPal Error');
            if (parsedMessage.details) errorDetails = parsedMessage.details;
        } catch (e) {
            errorMessage = error.message;
        }
    } else if (error.isAxiosError && error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        if(error.response.data.details && error.response.data.details.length > 0){
            errorMessage += ' Details: ' + error.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
        }
        console.error('PayPal SDK v2 Error Details:', error.response.data);
    } else if (error.message) {
        errorMessage = error.message;
    }

    console.error('Formatted PayPal Error:', errorMessage, 'Details:', errorDetails);
    res.status(error.statusCode || 500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
