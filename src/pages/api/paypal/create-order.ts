import type { NextApiRequest, NextApiResponse } from 'next';
import { PayPalHttpClient, OrdersCreateRequest } from '@paypal/paypal-js';

// Replace with your actual PayPal credentials from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

// Create a PayPal client
const environment = new PayPalHttpClient.ProductionEnvironment(clientId!, clientSecret!); // Or SandboxEnvironment for testing
const client = new PayPalHttpClient(environment);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
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
        value: amount.toFixed(2), // Ensure amount is a string with 2 decimal places
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
    res.status(500).json({ message: error.message || 'Failed to create PayPal order' });
  }
}