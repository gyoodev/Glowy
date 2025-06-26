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
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// The private key from env vars often has its newlines escaped as "\\n".
// This needs to be replaced with actual newline characters "\n" for the SDK to parse it correctly.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');


// Initialize the Firebase Admin SDK using environment variables for credentials.
// Ensure these environment variables are set securely in your hosting environment.
if (!admin.apps.length) {
  // Only attempt to initialize if all required credentials are provided.
  // This prevents the "Service account object must contain..." error during build
  // if the environment variables are not set on the build server.
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
        console.error('Firebase Admin SDK initialization error:', error.stack);
        // This will prevent the app from crashing during build but will log the error.
        // The API routes using adminDb will likely fail at runtime if this happens.
    }
  } else {
    // This provides a clear log message during the build if variables are missing.
    console.warn(
      'Firebase Admin SDK credentials not fully configured. Admin features will be disabled. ' +
      'Missing: ' +
      [!projectId && 'projectId', !clientEmail && 'clientEmail', !privateKey && 'privateKey']
        .filter(Boolean)
        .join(', ')
    );
  }
}

// For Realtime Database:
// const adminDb = admin.database();

// Export the initialized Firestore instance
export const adminDb = admin.firestore();
