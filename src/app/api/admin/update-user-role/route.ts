
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebaseAdmin';

// Reusable admin verification logic
async function verifyAdmin(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.role === 'admin') {
        return decodedToken.uid; // Return admin's UID if verified
      }
    } catch (error) {
      console.error('Error verifying admin token:', error);
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, message: 'Firebase Admin SDK not initialized on the server. Check server logs for details.' }, { status: 503 });
    }

    const adminUid = await verifyAdmin(request);
    if (!adminUid) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { uid, role } = await request.json();

    if (!uid || typeof uid !== 'string' || !['admin', 'business', 'customer'].includes(role)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing user ID or role.' }, { status: 400 });
    }

    // You can't set the role of the admin making the request
    if(uid === adminUid && role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Admins cannot change their own role.' }, { status: 400 });
    }

    // Set custom claim in Firebase Authentication
    await admin.auth().setCustomUserClaims(uid, { role: role });
    
    // Update role in Firestore document
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.update({ role: role });

    return NextResponse.json({ success: true, message: 'User role updated successfully.' });
  } catch (error: any) {
    console.error('Error in update-user-role API route:', error);
    return NextResponse.json({ success: false, message: error.message || 'An unexpected error occurred.', code: error.code }, { status: 500 });
  }
}
