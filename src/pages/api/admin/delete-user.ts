
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // --- Authorization Check ---
  const { authorization } = req.headers;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token.' });
  }
  const idToken = authorization.split('Bearer ')[1];

  try {
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth SDK not initialized.');
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user is an admin
    if (decodedToken.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: User is not an admin.' });
    }

  } catch (error: any) {
    console.error('Error verifying admin token:', error);
    return res.status(401).json({ success: false, message: `Unauthorized: ${error.message}` });
  }
  // --- End Authorization Check ---


  const { uid } = req.body;
  if (!uid) {
    return res.status(400).json({ success: false, message: 'User ID (uid) is required.' });
  }

  if (!adminDb || !adminAuth) {
    return res.status(503).json({ success: false, message: 'Firebase Admin SDK not initialized on the server. Check server logs.' });
  }

  try {
    // 1. Delete user from Firebase Authentication
    await adminAuth.deleteUser(uid);
    console.log(`Successfully deleted user with UID: ${uid} from Firebase Authentication.`);

    // 2. Delete user document from Firestore
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.delete();
    console.log(`Successfully deleted user document for UID: ${uid} from Firestore.`);

    // Potentially, you could also delete related data here (e.g., their reviews, bookings)
    // but that can be complex. For now, we delete the primary records.

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
