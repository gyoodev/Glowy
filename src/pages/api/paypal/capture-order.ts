
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for capture API.");
}

const environment = new paypal.core.LiveEnvironment(clientId!, clientSecret!);
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

  if (!clientId || !clientSecret) {
    console.error("PayPal API credentials not configured on the server for capture-order.");
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server.' });
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ success: false, message: 'Missing orderID.' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({} as any);

  try {
    const capture = await client.execute(request);
    const captureResult = capture.result;

    if (captureResult.status === 'COMPLETED') {
      const getOrderRequest = new paypal.orders.OrdersGetRequest(orderID);
      const orderDetailsResponse = await client.execute(getOrderRequest);
      const orderDetails = orderDetailsResponse.result;

      const purchaseUnit = orderDetails.purchase_units && orderDetails.purchase_units[0];
      const packageId = purchaseUnit?.custom_id;
      const businessId = purchaseUnit?.reference_id;
      const transactionId = captureResult.id;

      if (!businessId || !packageId) {
        console.error('Could not extract businessId (' + businessId + ') or packageId (' + packageId + ') from PayPal order details.', orderDetails);
        return res.status(500).json({ success: false, message: 'Failed to extract required details from PayPal order.' });
      }

      const chosenPackage = promotionPackages.find(p => p.id === packageId);
      if (!chosenPackage) {
        console.error('Invalid packageId "' + packageId + '" received from PayPal order.');
        return res.status(500).json({ success: false, message: 'Invalid promotion package ID.' });
      }

      const now = new Date();
      const expiryDate = addDays(now, chosenPackage.durationDays);
      const newPromotion: Promotion = {
        isActive: true,
        packageId: chosenPackage.id,
        packageName: chosenPackage.name,
        purchasedAt: FieldValue.serverTimestamp() as any,
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'paypal',
        transactionId: transactionId,
      };

      const salonRef = adminDb.collection('salons').doc(businessId);
      await salonRef.update({ promotion: newPromotion });

      const adminUsersQuery = adminDb.collection('users').where('role', '==', 'admin');
      const adminUsersSnapshot = await adminUsersQuery.get();
      if (!adminUsersSnapshot.empty) {
        const salonDoc = await salonRef.get();
        const salonName = salonDoc.exists ? salonDoc.data()?.name : 'Неизвестен салон';
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

      console.log('Successfully captured PayPal order ' + orderID + ' for business ' + businessId + ' and package ' + packageId + '. Firestore updated.');
      res.status(200).json({ success: true, message: 'Плащането е успешно и промоцията е активирана!', details: captureResult });
    } else {
      console.error('PayPal capture status not COMPLETED for order ' + orderID + ': ' + captureResult.status, captureResult);
      res.status(400).json({ success: false, message: 'PayPal плащането не е завършено: ' + captureResult.status, details: captureResult });
    }
  } catch (e: unknown) {
    let errorMessage = 'Failed to capture PayPal order.';
    let errorDetails = null;
    
    if (e instanceof Error) {
        errorMessage = e.message;
        // Check for PayPal specific error structure
        const paypalError = e as any;
        if (paypalError.isAxiosError && paypalError.response && paypalError.response.data) {
            errorMessage = paypalError.response.data.message || errorMessage;
            errorDetails = paypalError.response.data.details;
            if (paypalError.response.data.details && paypalError.response.data.details.length > 0) {
                const detailsString = paypalError.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
                errorMessage += ' Details: ' + detailsString;
            }
            console.error('PayPal Capture Error Details:', paypalError.response.data);
        } else {
           console.error('PayPal Capture Order Error for orderID ' + orderID + ':', e.message, e.stack);
        }
    } else {
        console.error('PayPal Capture Order Error (unknown type) for orderID ' + orderID + ':', e);
    }
    res.status(500).json({ success: false, message: errorMessage, details: errorDetails });
  }
}
