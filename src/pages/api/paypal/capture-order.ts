
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { initializeApp, getApps, cert, type App as AdminApp } from 'firebase-admin/app';
// FieldValue is a special type from firebase-admin
import { getFirestore as getAdminFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for capture API.");
  // Consider throwing an error here or handling it appropriately
  // For now, operations will fail if these are not set.
}

const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

let adminApp: AdminApp;
if (!getApps().length) {
  const serviceAccountEnv = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  if (!serviceAccountEnv) {
    console.warn("FIREBASE_ADMIN_SDK_CONFIG environment variable is not set. Initializing Firebase Admin with default credentials (may only work in Firebase environment). PayPal capture API might not update Firestore if default creds don't work.");
    adminApp = initializeApp();
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
       adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
       console.error("Error parsing FIREBASE_ADMIN_SDK_CONFIG:", e);
       if (!getApps().length) {
          adminApp = initializeApp();
          console.warn("Initialized Firebase Admin with default credentials after failed FIREBASE_ADMIN_SDK_CONFIG parse.");
        } else {
          adminApp = getApps()[0];
        }
    }
  }
} else {
  adminApp = getApps()[0];
}
const adminFirestore = getAdminFirestore(adminApp);


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
    return res.status(500).json({ success: false, message: 'PayPal API credentials not configured on the server for capture.' });
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ success: false, message: 'Missing orderID.' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  // Use 'as any' to bypass strict type checking for the requestBody.
  // For a standard capture, an empty object is often sufficient for the PayPal API.
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
        packageName: chosenPackage.name, // TODO: This is a temporary fix. The type of 'purchasedAt' in Promotion should be properly typed
        // Cast to any to bypass type check for FieldValue.serverTimestamp()
        purchasedAt: FieldValue.serverTimestamp() as any, // Use serverTimestamp for Firestore
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'paypal',
        transactionId: transactionId,
      };

      const salonRef = adminFirestore.collection('salons').doc(businessId);
      await salonRef.update({ promotion: newPromotion });

      const adminUsersQuery = adminFirestore.collection('users').where('role', '==', 'admin');
      const adminUsersSnapshot = await adminUsersQuery.get();
      
      if (!adminUsersSnapshot.empty) {
        const salonDoc = await salonRef.get();
        const salonName = salonDoc.exists ? salonDoc.data()?.name : 'Неизвестен салон';
        const notificationMessage = 'Ново плащане за промоция \'' + chosenPackage.name + '\' (' + chosenPackage.price + ' EUR) за салон \'' + salonName + '\' (ID: ' + businessId + ').';
        
        const adminNotificationsPromises = adminUsersSnapshot.docs.map(adminDoc => {
          return adminFirestore.collection('notifications').add({
            userId: adminDoc.id,
            message: notificationMessage,
            link: '/admin/business',
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            type: 'new_payment_admin',
            relatedEntityId: businessId,
          });
        });
        await Promise.all(adminNotificationsPromises);
        console.log('Sent new payment notifications to ' + adminUsersSnapshot.size + ' admin(s).');
      } else {
        console.warn("No admin users found to send new payment notification.");
      }

      console.log('Successfully captured PayPal order ' + orderID + ' for business ' + businessId + ' and package ' + packageId + '. Firestore updated.');
      res.status(200).json({ success: true, message: 'Плащането е успешно и промоцията е активирана!', details: captureResult });
    } else {
      console.error('PayPal capture status not COMPLETED for order ' + orderID + ': ' + captureResult.status, captureResult);
      res.status(400).json({ success: false, message: 'PayPal плащането не е завършено: ' + captureResult.status, details: captureResult });
    }
  } catch (error: any) {
    console.error('PayPal Capture Order Error for orderID ' + orderID + ':', error);
    let errorMessage = 'Failed to capture PayPal order.';
     if (error.isAxiosError && error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        if(error.response.data.details && error.response.data.details.length > 0){
            const detailsString = error.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
            errorMessage += ' Details: ' + detailsString;
        }
        console.error('PayPal Capture Error Details:', error.response.data);
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
}
