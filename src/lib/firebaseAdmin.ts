
// src/lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

// This is the key: only initialize if not already done.
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    // The build fails if these are missing. The check MUST be inside the try...catch.
    if (!projectId || !clientEmail || !privateKey) {
        throw new Error('Firebase Admin credentials are not set in environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // The replace() is crucial for parsing the key from env vars.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized.');
  } catch (error: any) {
    // This will catch the error if credentials are not set, preventing the build crash.
    // It will log a warning, which is what we see in the build logs, but it won't crash the build itself.
    // The crash happens *after* this, when something tries to use `admin.firestore()`.
    console.warn(`Firebase Admin SDK initialization failed. This is expected during the build on systems without admin credentials. Admin features will be disabled. Error: ${error.message}`);
  }
}

// Now, the critical part. We only export a valid firestore instance if the app was initialized.
// If not, we export `null`. This prevents a crash during the build process.
// The API routes that use this will need to handle the null case.
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
const adminAuth = admin.apps.length > 0 ? admin.auth() : null;

export { adminDb, adminAuth };
