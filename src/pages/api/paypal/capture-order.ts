
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const paypalMode = process.env.PAYPAL_ENVIRONMENT || 'sandbox'; // Default to 'sandbox'

if (!clientId || !clientSecret) {
  console.error("FATAL SERVER ERROR: PayPal Client ID or Client Secret is not configured in environment variables (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET). PayPal API calls will fail.");
}

// Conditional environment setup
let environment;
if (paypalMode === 'live') {
  environment = new paypal.core.LiveEnvironment(clientId!, clientSecret!);
} else {
  environment = new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
}
console.log(`PayPal API configured for ${paypalMode.toUpperCase()} environment (capture-order).`);

const client = new paypal.core.PayPalHttpClient(environment);

const promotionPackages = [
  { id: '7days', name: 'Сребърен план', durationDays: 7, price: 5 },
  { id: '30days', name: 'Златен план', durationDays: 30, price: 15 },
  { id: '90days', name: 'Диамантен план', durationDays: 90, price: 35 },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method ' + req.method + ' Not Allowed');
  }

  if (!adminDb) {
    return res.status(503).json({ success: false, message: 'Firebase Admin SDK not initialized on the server. Check server logs for details.' });
  }

  if (!clientId || !clientSecret) {
    console.error("PayPal API credentials not configured on the server for capture-order. Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server. Please contact support or check server logs.' });
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ success: false, message: 'Missing orderID.' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({} as any); // PayPal SDK might require an empty body for capture

  try {
    const capture = await client.execute(request);
    const captureResult = capture.result;

    if (captureResult.status === 'COMPLETED') {
      // To get custom_id and reference_id, we might need to fetch the order details again
      // as capture response might not directly contain them in a straightforward way for all scenarios.
      const getOrderRequest = new paypal.orders.OrdersGetRequest(orderID);
      const orderDetailsResponse = await client.execute(getOrderRequest);
      const orderDetails = orderDetailsResponse.result;

      const purchaseUnit = orderDetails.purchase_units && orderDetails.purchase_units[0];
      const packageId = purchaseUnit?.custom_id; // Assuming custom_id holds packageId
      const businessId = purchaseUnit?.reference_id; // Assuming reference_id holds businessId
      const transactionId = captureResult.id; // Capture ID is the transaction ID

      if (!businessId || !packageId) {
        console.error('Could not extract businessId (' + businessId + ') or packageId (' + packageId + ') from PayPal order details after capture.', orderDetails);
        return res.status(500).json({ success: false, message: 'Failed to extract required details from PayPal order after capture.' });
      }

      const chosenPackage = promotionPackages.find(p => p.id === packageId);
      if (!chosenPackage) {
        console.error('Invalid packageId "' + packageId + '" received from PayPal order details after capture.');
        return res.status(500).json({ success: false, message: 'Invalid promotion package ID after capture.' });
      }

      const now = new Date();
      const expiryDate = addDays(now, chosenPackage.durationDays);
      const newPromotion: Promotion = {
        isActive: true,
        packageId: chosenPackage.id,
        packageName: chosenPackage.name,
        purchasedAt: FieldValue.serverTimestamp() as any, // For Firebase Admin SDK
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'paypal',
        transactionId: transactionId,
      };

      const salonRef = adminDb.collection('salons').doc(businessId);
      await salonRef.update({ promotion: newPromotion });

      // Fetch salon name for emails and notifications
      const salonDoc = await salonRef.get();
      const salonName = salonDoc.exists ? salonDoc.data()?.name : 'Неизвестен салон';

      // Send email notification to admin
      try {
        const adminEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email/new-payment-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            packageName: chosenPackage.name,
            price: chosenPackage.price,
            salonName: salonName, // Use the fetched salonName
            businessId: businessId,
            transactionId: transactionId,
          }),
        });

        if (!adminEmailResponse.ok) {
          console.error('Failed to send admin email notification for new payment:', await adminEmailResponse.text());
        } else {
          console.log('Admin email notification sent for new payment.');
        }
      } catch (emailError) {
        console.error('Error sending admin email notification for new payment:', emailError);
      }
      // Notify admins
      const adminUsersQuery = adminDb.collection('users').where('role', '==', 'admin');
      const adminUsersSnapshot = await adminUsersQuery.get();
      if (!adminUsersSnapshot.empty) {
        const notificationMessage = 'Ново плащане за промоция \'' + chosenPackage.name + '\' (' + chosenPackage.price + ' EUR) за салон \'' + salonName + '\' (ID: ' + businessId + ').';
        const adminNotificationsPromises = adminUsersSnapshot.docs.map(adminDoc => {
          return adminDb.collection('notifications').add({
            userId: adminDoc.id,
            message: notificationMessage,
            link: '/admin/payments',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            type: 'new_payment_admin',
            relatedEntityId: businessId,
          });
        });
        await Promise.all(adminNotificationsPromises);
      }

      console.log(`Successfully captured PayPal order ${orderID} for business ${businessId} and package ${packageId} in ${paypalMode.toUpperCase()} environment. Firestore updated.`);
      res.status(200).json({ success: true, message: 'Плащането е успешно и промоцията е активирана!', details: captureResult });
    } else {
      console.error(`PayPal capture status not COMPLETED for order ${orderID}: ${captureResult.status}`, captureResult);
      res.status(400).json({ success: false, message: 'PayPal плащането не е завършено: ' + captureResult.status, details: captureResult });
    }
  } catch (e: unknown) {
    let errorMessage = 'Failed to capture PayPal order.';
    let errorDetails = null;
    
    if (e instanceof Error) {
        errorMessage = e.message;
        const paypalError = e as any; // Cast to any for potential PayPal-specific properties
        if (paypalError.statusCode && paypalError.message && typeof paypalError.message === 'string') {
            try {
                const parsedMessage = JSON.parse(paypalError.message);
                errorMessage = parsedMessage.message || errorMessage;
                 if (parsedMessage.name === 'AUTHENTICATION_FAILURE' || parsedMessage.name === 'INVALID_RESOURCE_ID' || (parsedMessage.details && parsedMessage.details.some((d: any) => d.issue === 'INVALID_CLIENT'))) {
                   errorMessage = `PayPal Authentication Failed during capture: ${parsedMessage.message}. Please verify your PayPal API Client ID and Secret, and ensure they match the configured environment (${paypalMode.toUpperCase()}).`;
                }
                errorDetails = parsedMessage.details || errorDetails;
                console.error('Detailed PayPal Capture Order Error:', JSON.stringify(parsedMessage, null, 2));
            } catch (jsonError) {
                console.error(`PayPal Capture Order Error (Status ${paypalError.statusCode}) for orderID ${orderID}: ${e.message}`);
            }
        } else {
           console.error(`PayPal Capture Order Error for orderID ${orderID}:`, e.message, e.stack);
        }
    } else {
        console.error(`PayPal Capture Order Error (unknown type) for orderID ${orderID}:`, e);
    }
    res.status(500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
