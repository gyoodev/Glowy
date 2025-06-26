
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebaseAdmin';

// Reusable admin verification logic from other routes
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken.role === 'admin';
    } catch (error) {
      console.error('Error verifying admin token:', error);
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, message: 'Firebase Admin SDK not initialized on the server. Check server logs for details.' }, { status: 503 });
    }

    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { email, password, displayName, phoneNumber, role } = await request.json();

    if (!email || !displayName || !role) {
      return NextResponse.json({ success: false, message: 'Missing required fields: email, displayName, role.' }, { status: 400 });
    }
    
    // 1. Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      emailVerified: true, // Admin-created users can be auto-verified
      password: password, // Optional, user can set it later via password reset
      displayName: displayName,
      phoneNumber: phoneNumber, // Optional
      disabled: false,
    });
    
    const uid = userRecord.uid;

    // 2. Set custom claims for role
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // 3. Create user document in Firestore
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.set({
      userId: uid,
      email: email,
      name: displayName,
      displayName: displayName,
      phoneNumber: phoneNumber || '',
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, uid: uid, message: 'User created successfully.' });

  } catch (error: any) {
    console.error('Error in create-user API route:', error);
    return NextResponse.json({ success: false, message: error.message || 'An unexpected error occurred.', code: error.code }, { status: 500 });
  }
}
