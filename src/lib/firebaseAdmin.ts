// src/lib/firebaseAdmin.ts

// This file is for initializing the Firebase Admin SDK.
// You will need to install the firebase-admin package:
// npm install firebase-admin
// or
// yarn add firebase-admin

// Import the necessary functions from the admin SDK
import * as admin from 'firebase-admin';

// It is recommended to use environment variables or a configuration file
// for sensitive information like your service account key.

// Initialize the Firebase Admin SDK using environment variables for credentials.
// Ensure these environment variables are set securely in your hosting environment.
// The private key often needs newline characters replaced if stored as a single string env var.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\\n'),
    }),
  });
}

// For Realtime Database:
// const adminDb = admin.database();

// Export the initialized Firestore instance
export const adminDb = admin.firestore();
