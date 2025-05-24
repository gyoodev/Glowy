
import type { NextApiRequest, NextApiResponse } from 'next';
import paypal from '@paypal/checkout-server-sdk';
import { initializeApp, getApps, cert, type App as AdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import type { Promotion } from '@/types';
import { addDays } from 'date-fns';

// Ensure your PayPal Client ID and Secret are set in environment variables
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("FATAL ERROR: PayPal Client ID or Client Secret is not set for capture API.");
  // In a real production scenario, you might want to prevent the app from starting or handle this more gracefully.
}

// Determine PayPal environment based on NODE_ENV
// Ensure clientId and clientSecret are not undefined before using them
const environment = process.env.NODE_ENV === 'production'
  ? new paypal.core.LiveEnvironment(clientId!, clientSecret!)
  : new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
const client = new paypal.core.PayPalHttpClient(environment);

// Initialize Firebase Admin
let adminApp: AdminApp;
if (!getApps().length) {
  const serviceAccountEnv = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  if (!serviceAccountEnv) {
    console.error("FATAL ERROR: FIREBASE_ADMIN_SDK_CONFIG environment variable is not set. PayPal capture API might not update Firestore.");
    // This will cause issues if not set. Consider throwing an error for production if Firestore updates are critical.
     // Fallback initialization for environments like Firebase Functions where default creds might work
    adminApp = initializeApp();
    console.log("Initialized Firebase Admin with default credentials (likely in Firebase environment) due to missing FIREBASE_ADMIN_SDK_CONFIG.");
  } else {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
       adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
       console.error("Error parsing FIREBASE_ADMIN_SDK_CONFIG:", e);
        if (!getApps().length) { // Check again in case of race condition or other init path
          adminApp = initializeApp();
          console.log("Initialized Firebase Admin with default credentials after failed FIREBASE_ADMIN_SDK_CONFIG parse.");
        } else {
          adminApp = getApps()[0]; // Get already initialized app
        }
    }
  }
} else {
  adminApp = getApps()[0];
}
const adminFirestore = getAdminFirestore(adminApp);

// Temporary promotion package definitions - ensure this matches what's used on the client
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
   if (!process.env.FIREBASE_ADMIN_SDK_CONFIG && adminApp.name !== '[DEFAULT]') { // Check if adminApp was initialized properly
    console.error("Firebase Admin SDK not properly initialized in capture-order API. Firestore updates will fail.");
    // return res.status(500).json({ success: false, message: 'Server configuration error (Firebase Admin).' });
    // Allow to proceed but Firestore update will likely fail. This is better than returning 500 if payment itself was ok.
  }

  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ success: false, message: 'Missing orderID.' });
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({}); // Empty body for capture

  try {
    const capture = await client.execute(request);
    const captureResult = capture.result;

    if (captureResult.status === 'COMPLETED') {
      const getOrderRequest = new paypal.orders.OrdersGetRequest(orderID);
      const orderDetailsResponse = await client.execute(getOrderRequest);
      const orderDetails = orderDetailsResponse.result;

      const purchaseUnit = orderDetails.purchase_units && orderDetails.purchase_units[0];
      // Ensure custom_id and reference_id are correctly extracted
      const packageId = purchaseUnit?.custom_id; // This should contain the packageId (e.g., '7days')
      const businessId = purchaseUnit?.reference_id; // This should contain the businessId
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
            errorMessage += ' Details: ' + error.response.data.details.map((d:any) => d.issue + (d.description ? ' (' + d.description + ')' : '') ).join(', ');
        }
        console.error('PayPal Capture Error Details:', error.response.data);
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
}
