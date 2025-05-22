// This file will handle the creation of Revolut payment orders.
// It should receive the promotion package details from the frontend.
// Use the Revolut API keys to create a new payment order.
// Include the package price, currency, and a description.
// Return the order details to the frontend.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import RevolutClient from 'revolut-sdk';

// TODO: Add your Revolut API key securely (e.g., using environment variables).
const revolutApiKey = 'YOUR_REVOLUT_API_KEY';

// TODO: Configure Revolut SDK with your API key and environment (sandbox or live).
const revolut = new RevolutClient({ apiKey: revolutApiKey, environment: 'sandbox' }); // Or 'live'


export default async (request: VercelRequest, response: VercelResponse) => {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  const { packageId, amount, currency, description, salonId } = request.body;

  if (!packageId || !amount || !currency || !description || !salonId) {
    return response.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // TODO: You might want to add validation here to ensure the packageId and amount are valid
    // based on your defined promotion packages on the server-side.

    const order = await revolut.payments.createOrder({
      amount: amount, // Amount in minor units (e.g., cents)
      currency: currency,
      description: description,
      // You can add more metadata here, e.g., salonId, packageId
      merchant_order_ext_ref: `${salonId}-${packageId}-${Date.now()}`,
    });

    return response.status(200).json({ orderId: order.id, publicId: order.public_id });

  } catch (error: any) {
    console.error('Error creating Revolut order:', error);
    // TODO: Provide a more generic error message to the frontend
    return response.status(500).json({ message: 'Failed to create Revolut order', error: error.message });
  }
};