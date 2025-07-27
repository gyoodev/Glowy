// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Force load environment variables from .env file
config();

// This is the key: only initialize if not already done.
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // A more robust check to see if the variables are actually present and not just empty strings
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin credentials (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are not fully set in environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // The replace() is crucial for parsing the key from env vars.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    // This will catch the error if credentials are not set, preventing a build crash.
    console.error(`CRITICAL: Firebase Admin SDK initialization failed. Admin features will be disabled. Error: ${error.message}`);
  }
}

// Now, the critical part. We only export a valid firestore instance if the app was initialized.
// If not, we export `null`. This prevents a crash during the build process.
// The API routes that use this will need to handle the null case.
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
const adminAuth = admin.apps.length > 0 ? admin.auth() : null;

export { adminDb, adminAuth };
