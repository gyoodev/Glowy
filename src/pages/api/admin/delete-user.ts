
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
// dotenv config is now handled in firebaseAdmin.ts, so it's not needed here.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // Check if Admin SDK was initialized
  if (!adminDb || !adminAuth) {
    console.error("Firebase Admin SDK is not initialized. Check server logs for environment variable issues.");
    return res.status(503).json({ success: false, message: 'Firebase Admin SDK not initialized on the server. Check server logs.' });
  }

  const { authorization } = req.headers;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token.' });
  }

  const idToken = authorization.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const requestingUserId = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(requestingUserId).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: User is not an admin.' });
    }
  } catch (error: any) {
    console.error('Error verifying admin token or fetching role:', error);
    return res.status(401).json({ success: false, message: `Unauthorized: ${error.message}` });
  }

  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ success: false, message: 'User ID (uid) is required.' });
  }

  try {
    await adminAuth.deleteUser(uid);
    console.log(`Successfully deleted user with UID: ${uid} from Firebase Authentication.`);

    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.delete();
    console.log(`Successfully deleted user document for UID: ${uid} from Firestore.`);

    return res.status(200).json({ success: true, message: 'Потребителят е изтрит успешно.' });

  } catch (error: any) {
    console.error(`Error deleting user ${uid}:`, error);

    let errorMessage = 'An unknown error occurred.';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Потребителят не беше намерен във Firebase Authentication. Възможно е вече да е изтрит.';
      errorCode = 'USER_NOT_FOUND';
    } else {
      errorMessage = error.message || 'Failed to delete user.';
    }

    return res.status(500).json({ success: false, message: errorMessage, code: errorCode });
  }
}
