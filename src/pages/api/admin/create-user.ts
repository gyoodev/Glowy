
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { config } from 'dotenv';

config(); // Force load .env variables

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
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: User is not an admin.' });
    }
  } catch (error: any) {
    console.error('Error verifying admin token or fetching role:', error);
    return res.status(401).json({ success: false, message: `Unauthorized: ${error.message}` });
  }

  const { email, password, displayName, phoneNumber, role } = req.body;

  if (!email || !displayName || !role) {
    return res.status(400).json({ success: false, message: 'Email, displayName, and role are required fields.' });
  }

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // Automatically verify email for admin-created users
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, { role });
    
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      userId: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      name: userRecord.displayName,
      phoneNumber: phoneNumber || '',
      role: role,
      createdAt: new Date().toISOString(),
      profilePhotoUrl: '',
    });

    res.status(201).json({ success: true, uid: userRecord.uid, message: 'Потребителят е създаден успешно.' });

  } catch (error: any) {
    console.error('Error creating new user:', error);
    let errorMessage = 'An unknown error occurred while creating the user.';
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Имейл адресът вече се използва от друг потребител.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
}
