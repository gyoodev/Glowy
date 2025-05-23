
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

// Ensure your PayPal Client ID and Secret are set in environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set in environment variables.");
  // Optionally, you could throw an error here to prevent the app from starting without critical config
}

// Environment setup
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
      reference_id: businessId, // Use businessId as a reference
      description: description, // Description of the purchase
      custom_id: packageId, // Use packageId as a custom identifier
      amount: {
        currency_code: currency,
        value: Number(amount).toFixed(2), // Ensure amount is a string with 2 decimal places
      },
    }],
    // application_context: { // Optional: Add application context if needed
    //   return_url: 'YOUR_RETURN_URL', // URL to redirect to after payment approval
    //   cancel_url: 'YOUR_CANCEL_URL', // URL to redirect to if payment is cancelled
    // }
  });

  try {
    const order = await client.execute(request);
    // Send back the order ID to the client
    res.status(201).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    let errorMessage = 'Failed to create PayPal order.';
    // Check if the error is from PayPal and has a more specific message
    if (error.isAxiosError && error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
        console.error('PayPal Error Details:', error.response.data);
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
}
