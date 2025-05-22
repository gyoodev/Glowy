// This file will handle Revolut webhook events.
// It will receive notifications from Revolut about payment status updates.
// Verify the webhook signature for security.
// Process the events to update your database (e.g., mark a salon's promotion as active).

// TODO: Add your Revolut webhook secret securely.
const revolutWebhookSecret = 'YOUR_REVOLUT_WEBHOOK_SECRET';

// TODO: Implement the serverless function or API endpoint logic here to handle webhook events.

import type { VercelRequest, VercelResponse } from '@vercel/node';

// You'll need to configure your Revolut webhook endpoint to point to this file's URL.
// The exact implementation will depend on how you deploy your serverless functions/API routes.

export default async (req: VercelRequest, res: VercelResponse) => {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore: getAdminFirestore } = await import('firebase-admin/firestore');

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // TODO: Implement webhook signature verification here for security.
  // Revolut's documentation will provide details on how to verify the signature.
  // If verification fails, return a 401 Unauthorized response.

  const event = req.body;

  // Initialize Firebase Admin if not already initialized
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\\n'),
      }),
    });
  }
  const adminFirestore = getAdminFirestore();

  try {
    switch (event.type) {
      case 'order_completed':
        const order = event.data.order;
        // Example: Extract order reference or metadata containing salon ID and promotion details
        const salonId = order.metadata?.salonId;
        const packageId = order.metadata?.packageId; // You might pass this in the order creation

        if (salonId && packageId) {
          // TODO: Retrieve package details (duration, name) based on packageId from your data
          const durationDays = 7; // Example: Replace with actual lookup
          const packageName = '7 Days Promotion'; // Example: Replace with actual lookup

          const purchasedAt = new Date();
          const expiresAt = new Date(purchasedAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

          const newPromotion = {
            isActive: true,
            packageId: packageId,
            packageName: packageName,
            purchasedAt: purchasedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            paymentMethod: 'revolut', // Track the payment method
          };

          const salonRef = adminFirestore.collection('salons').doc(salonId);
          await salonRef.update({ promotion: newPromotion });

          console.log(`Promotion activated for salon ${salonId} via Revolut order ${order.id}`);
        } else {
          console.warn('Received order_completed webhook but missing salonId or packageId in metadata.', order);
        }
        break;
      // Handle other relevant Revolut events as needed (e.g., order_failed, refund_created)
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling Revolut webhook event:', error);
    // Return a 500 status code for errors
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};