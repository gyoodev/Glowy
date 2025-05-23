
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set in environment variables.");
}

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(\`Method \${req.method} Not Allowed\`);
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
      custom_id: packageId, // Storing packageId here
      reference_id: businessId, // Storing businessId here
      description: description,
      amount: {
        currency_code: currency,
        value: Number(amount).toFixed(2),
      },
    }],
  });

  try {
    const order = await client.execute(request);
    res.status(201).json({ success: true, orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    let errorMessage = 'Failed to create PayPal order.';
    if (error.isAxiosError && error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
      console.error('PayPal Error Details:', error.response.data.details);
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage, details: error.isAxiosError ? error.response?.data?.details : null });
  }
}
