
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { initializeApp, getApps, cert, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp, FieldValue } from 'firebase-admin/firestore'; // Added FieldValue
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

const clientId = process.env.PAYPAL_CLIENT_ID;

interface CaptureOrderPayload {
  orderID: string;
  // Add any other required properties
}

interface CaptureOrderResponse {
  status: string;
  id: string;
}
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for capture API.");
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


export async function captureOrder(data: CaptureOrderPayload): Promise<CaptureOrderResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/paypal/capture-order`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to capture order: ${response.statusText}`);
    }

    const order: CaptureOrderResponse = await response.json();
    return order;
  } catch (error) {
    console.error("Error in captureOrder:", error);
    throw error;
  }
}

/*
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
  request.requestBody({});

  try {
    const capture = await client.execute(request);
    const captureResult = capture.result;

    if (captureResult.status === 'COMPLETED') {
      const getOrderRequest = new paypal.orders.OrdersGetRequest(orderID);
      const orderDetailsResponse = await client.execute(getOrderRequest);
      const orderDetails = orderDetailsResponse.result;

      const purchaseUnit = orderDetails.purchase_units && orderDetails.purchase_units[0];
      const packageId = purchaseUnit?.custom_id;
      const businessId = purchaseUnit?.reference_id; // This is the salonId
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
        purchasedAt: AdminTimestamp.fromDate(now).toDate().toISOString(),
        expiresAt: expiryDate.toISOString(),
        paymentMethod: 'paypal',
        transactionId: transactionId,
      };

      const salonRef = adminFirestore.collection('salons').doc(businessId);
      await salonRef.update({ promotion: newPromotion });

      // Notify admins about the new payment
      const adminUsersQuery = adminFirestore.collection('users').where('role', '==', 'admin');
      const adminUsersSnapshot = await adminUsersQuery.get();
      
      if (!adminUsersSnapshot.empty) {
        const salonDoc = await salonRef.get();
        const salonName = salonDoc.exists ? salonDoc.data()?.name : 'Неизвестен салон';
        const notificationMessage = `Ново плащане за промоция '${chosenPackage.name}' (${chosenPackage.price} EUR) за салон '${salonName}' (ID: ${businessId}).`;
        
        const adminNotificationsPromises = adminUsersSnapshot.docs.map(adminDoc => {
          return adminFirestore.collection('notifications').add({
            userId: adminDoc.id,
            message: notificationMessage,
            link: `/admin/business`, // Or a more specific link to payments/salons
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            type: 'new_payment_admin',
            relatedEntityId: businessId, // salonId
          });
        });
        await Promise.all(adminNotificationsPromises);
        console.log(`Sent new payment notifications to ${adminUsersSnapshot.size} admin(s).`);
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
*/
