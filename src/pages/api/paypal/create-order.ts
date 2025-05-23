
import type { NextApiRequest, NextApiResponse } from 'next';
import { PayPalHttpClient, OrdersCreateRequest } from '@paypal/paypal-js';

// Replace with your actual PayPal credentials from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// TODO: IMPORTANT - For production, ensure process.env.NODE_ENV is used to switch
// between SandboxEnvironment and ProductionEnvironment.
// For now, it's hardcoded to Production. This needs to be configurable.
// const environment = process.env.NODE_ENV === 'production'
//   ? new PayPalHttpClient.ProductionEnvironment(clientId!, clientSecret!)
//   : new PayPalHttpClient.SandboxEnvironment(clientId!, clientSecret!);

// Using ProductionEnvironment as per current code. Ensure this is intended.
// Ensure clientId and clientSecret are actually set in your environment.
if (!clientId || !clientSecret) {
  console.error("PayPal Client ID or Client Secret is not set in environment variables.");
  // In a real app, you might throw an error or handle this more gracefully
}

const environment = new PayPalHttpClient.ProductionEnvironment(clientId!, clientSecret!);
const client = new PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!clientId || !clientSecret) {
     return res.status(500).json({ message: 'PayPal API credentials not configured on the server.' });
  }

  const { packageId, businessId, amount, currency, description } = req.body;

  if (!packageId || !businessId || !amount || !currency || !description) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const request = new OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: businessId, // Use businessId as a reference
      amount: {
        currency_code: currency,
        value: Number(amount).toFixed(2), // Ensure amount is a string with 2 decimal places
      },
      description: description,
      custom_id: packageId, // Use packageId as a custom identifier
    }]
  });

  try {
    const order = await client.execute(request);
    res.status(201).json({ orderID: order.result.id });
  } catch (error: any) {
    console.error('PayPal Create Order Error:', error);
    // Log more details if available
    if (error.isAxiosError && error.response) {
      console.error('PayPal Error Details:', error.response.data);
    }
    res.status(500).json({ message: error.message || 'Failed to create PayPal order' });
  }
}
