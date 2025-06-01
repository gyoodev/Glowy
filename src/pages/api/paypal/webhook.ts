import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin'; // Import centralized adminDb
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'; // Use AdminTimestamp for server-side
import { buffer } from 'micro'; // Required for reading the raw body
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

// Removed local Firebase Admin initialization

// Stripe requires the raw body to verify the webhook signature.
// Configure Next.js to disable body parsing for this route.
export const config = {
  api: {
    bodyParser: false,
  },
};

// This is a simplified version. A real implementation should
// verify the webhook signature with PayPal's API.
// See PayPal documentation for verifying webhooks:
// https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature
const verifyWebhookSignature = async (req: NextApiRequest, rawBody: Buffer): Promise<boolean> => {
  // In a real application, you would:
  // 1. Get the PayPal-Cert-Url, PayPal-Transmission-Id, PayPal-Transmission-Sig, PayPal-Transmission-Time from request headers.
  // 2. Retrieve your webhook ID.
  // 3. Use the PayPal SDK or make a direct API call to verify the signature.
  // For demonstration purposes, we'll skip the actual verification.
  console.warn('Skipping PayPal webhook signature verification. Implement this in production!');
  return true; // Assume verified for this example
};

const updatePromotionInFirestore = async (paymentDetails: { packageId: string; businessId: string; paymentMethod: 'paypal'; transactionId: string }) => {
  if (!paymentDetails?.businessId || !paymentDetails?.packageId) {
    console.error("Missing required payment details for Firestore update in webhook.");
    return;
  }

  // In a real application, you should fetch the promotion package details
  // securely from your backend or a trusted source, not rely on hardcoded values.
  // For this example, we'll use the simplified package structure.
  const promotionPackages = [
    { id: '7days', name: '7 Дни Промоция', durationDays: 7, price: 10, description: 'Вашият салон на челни позиции за 1 седмица.' },
    { id: '30days', name: '30 Дни Промоция', durationDays: 30, price: 35, description: 'Максимална видимост за цял месец.' },
    { id: '90days', name: '90 Дни Промоция', durationDays: 90, price: 90, description: 'Най-изгодният пакет за дългосрочен ефект.' },
  ];

  const selectedPackage = promotionPackages.find(p => p.id === paymentDetails.packageId);

  if (!selectedPackage) {
    console.error("Could not find package details for Firestore update in webhook.");
    return;
  }

  const purchasedAt = new Date(); // Use server time in a real webhook
  const expiresAt = addDays(purchasedAt, selectedPackage.durationDays);

  const newPromotion: Promotion = {
    isActive: true,
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,
    purchasedAt: AdminTimestamp.fromDate(purchasedAt), // Use AdminTimestamp
    expiresAt: expiresAt.toISOString(),
    paymentMethod: paymentDetails.paymentMethod,
    transactionId: paymentDetails.transactionId, // Store transaction ID
  };

  try {
    const salonRef = adminDb.collection('salons').doc(paymentDetails.businessId); // Use adminDb
    await salonRef.update({ promotion: newPromotion });
    console.log(`Salon promotion updated successfully for business ${paymentDetails.businessId} after PayPal payment.`);
  } catch (err) {
    console.error(`Error updating salon promotion for business ${paymentDetails.businessId} after PayPal payment:`, err);
    throw err; // Re-throw to indicate failure to the webhook sender
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }

  const rawBody = await buffer(req);
  const signatureVerified = await verifyWebhookSignature(req, rawBody);

  if (!signatureVerified) {
    console.error('PayPal webhook signature verification failed.');
    res.status(400).json({ received: true, message: 'Signature verification failed' });
    return;
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch (err: any) {
    console.error('Error parsing PayPal webhook event:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
      const order = event.resource;
      console.log(`PayPal order approved: ${order.id}`);

      // Retrieve custom attributes passed during order creation
      const customAttributes = order.purchase_units?.[0]?.payments?.captures?.[0]?.custom || order.purchase_units?.[0]?.custom_id; // Adjust based on how you pass custom data

      if (!customAttributes) {
        console.error('Missing custom attributes in PayPal webhook event.');
        res.status(400).json({ received: true, message: 'Missing custom attributes' });
        return;
      }

      let businessId: string | undefined;
      let packageId: string | undefined;

      try {
         // Assuming customAttributes is a string like "businessId:abc,packageId:7days"
         // You might need to adjust parsing based on how you send custom data
         const attributes = customAttributes.split(',').reduce((acc: any, part: string) => {
            const [key, value] = part.split(':');
            if (key && value) {
                acc[key.trim()] = value.trim();
            }
            return acc;
         }, {});
         businessId = attributes.businessId;
         packageId = attributes.packageId;

         if (!businessId || !packageId) {
            throw new Error("Parsed custom attributes are missing businessId or packageId");
         }

      } catch (parseError) {
         console.error('Error parsing custom attributes from PayPal webhook:', parseError);
         res.status(400).json({ received: true, message: 'Invalid custom attributes format' });
         return;
      }


      const transactionId = order.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (!transactionId) {
        console.error('Missing transaction ID in PayPal webhook event.');
        res.status(400).json({ received: true, message: 'Missing transaction ID' });
        return;
      }


      try {
        await updatePromotionInFirestore({
          businessId: businessId,
          packageId: packageId,
          paymentMethod: 'paypal',
          transactionId: transactionId,
        });
        // Return a 200 to acknowledge receipt and successful processing
        res.status(200).json({ received: true, message: 'Promotion updated successfully' });
      } catch (firestoreError) {
        console.error('Error updating Firestore from PayPal webhook:', firestoreError);
        // Return a 500 to indicate that the event was not successfully processed
        res.status(500).json({ received: true, message: 'Failed to update promotion in Firestore' });
      }
      break;

    // Handle other event types if needed, e.g., payment disputes, refunds
    // case 'PAYMENT.CAPTURE.DENIED':
    //   console.error('Payment capture denied:', event.resource);
    //   // Handle denied payment
    //   break;
    // case 'PAYMENT.REFUNDED':
    //    console.log('Payment refunded:', event.resource);
    //    // Handle refund
    //    break;

    default:
      // Ignore other event types
      console.log(`Unhandled event type ${event.event_type}`);
      res.status(200).json({ received: true, message: `Unhandled event type ${event.event_type}` });
      break;
  }
}
