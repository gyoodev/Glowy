
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { buffer } from 'micro';
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

export const config = {
  api: {
    bodyParser: false,
  },
};

const verifyWebhookSignature = async (req: NextApiRequest, rawBody: Buffer): Promise<boolean> => {
  console.warn('Skipping PayPal webhook signature verification. Implement this in production!');
  return true; 
};

const updatePromotionInFirestore = async (paymentDetails: { packageId: string; businessId: string; paymentMethod: 'paypal'; transactionId: string }) => {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized on the server.');
  }

  if (!paymentDetails?.businessId || !paymentDetails?.packageId) {
    console.error("Missing required payment details for Firestore update in webhook.");
    return;
  }

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

  const purchasedAt = new Date();
  const expiresAt = addDays(purchasedAt, selectedPackage.durationDays);

  const newPromotion: Promotion = {
    isActive: true,
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,
    purchasedAt: AdminTimestamp.fromDate(purchasedAt),
    expiresAt: expiresAt.toISOString(),
    paymentMethod: paymentDetails.paymentMethod,
    transactionId: paymentDetails.transactionId,
  };

  try {
    const salonRef = adminDb.collection('salons').doc(paymentDetails.businessId);
    await salonRef.update({ promotion: newPromotion });
    console.log(`Salon promotion updated successfully for business ${paymentDetails.businessId} after PayPal payment.`);
  } catch (err) {
    console.error(`Error updating salon promotion for business ${paymentDetails.businessId} after PayPal payment:`, err);
    throw err;
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
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('Error parsing PayPal webhook event:', errorMessage);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  switch (event.event_type) {
    case 'CHECKOUT.ORDER.APPROVED':
      const order = event.resource;
      console.log(`PayPal order approved: ${order.id}`);

      const customAttributesString = order.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id || order.purchase_units?.[0]?.custom_id;

      if (!customAttributesString) {
        console.error('Missing custom attributes (custom_id) in PayPal webhook event.');
        res.status(400).json({ received: true, message: 'Missing custom_id in purchase unit' });
        return;
      }
      
      let businessId: string | undefined;
      let packageId: string | undefined;

      try {
         // Assuming custom_id is a string like "businessId:abc,packageId:7days"
         // or just packageId if businessId is in reference_id
         if (customAttributesString.includes(',')) { // More complex custom_id
            const attributes = customAttributesString.split(',').reduce((acc: any, part: string) => {
                const [key, value] = part.split(':');
                if (key && value) {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});
            businessId = attributes.businessId || order.purchase_units?.[0]?.reference_id;
            packageId = attributes.packageId;
         } else { // Simpler custom_id might just be the packageId
            packageId = customAttributesString;
            businessId = order.purchase_units?.[0]?.reference_id;
         }


         if (!businessId || !packageId) {
            console.error('Could not determine businessId or packageId from webhook. custom_id:', customAttributesString, 'reference_id:', order.purchase_units?.[0]?.reference_id);
            throw new Error("Parsed custom attributes are missing businessId or packageId");
         }

      } catch (parseError: unknown) {
         const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
         console.error('Error parsing custom attributes from PayPal webhook:', errorMessage);
         res.status(400).json({ received: true, message: `Invalid custom attributes format: ${errorMessage}` });
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
        res.status(200).json({ received: true, message: 'Promotion updated successfully' });
      } catch (firestoreError) {
        console.error('Error updating Firestore from PayPal webhook:', firestoreError);
        res.status(500).json({ received: true, message: 'Failed to update promotion in Firestore' });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.event_type}`);
      res.status(200).json({ received: true, message: `Unhandled event type ${event.event_type}` });
      break;
  }
}
