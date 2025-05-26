
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for create-order API.");
  // In a real application, you might want to handle this more gracefully
}

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
  }

  if (!clientId || !clientSecret) {
     return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server for order creation.' });
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
      custom_id: packageId, // Pass packageId in custom_id
      reference_id: businessId, // Pass businessId in reference_id
      description: description, // Optional description
    }],
    // Add application_context if needed for things like return_url, cancel_url
    // application_context: {
    //   return_url: 'YOUR_RETURN_URL',
    //   cancel_url: 'YOUR_CANCEL_URL',
    // }
  });

  try {
    const order = await client.execute(request);
    res.status(200).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', JSON.stringify(error, null, 2)); // Log the entire error object
     let errorMessage = 'Failed to create PayPal order.';
     // Attempt to extract more specific error from PayPal API response
     if (error.statusCode && error.message) {
         errorMessage = `PayPal Error (${error.statusCode}): ${error.message}`;
     } else if (error.message) {
        errorMessage = error.message;
     }

    res.status(500).json({ success: false, message: errorMessage });
 }
}
