
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebaseAdmin';

// Helper function to verify the user is an admin from their ID token
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      // In your project, you must have a custom claim 'role' set to 'admin' for admin users.
      // You can set this using the Firebase Admin SDK, e.g., when a user is first made an admin.
      // admin.auth().setCustomUserClaims(uid, { role: 'admin' });
      if (decodedToken.role === 'admin') {
        return true;
      }
    } catch (error) {
      console.error('Error verifying admin token:', error);
      return false;
    }
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { uid } = await request.json();

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid or missing user ID.' }, { status: 400 });
    }

    // Delete from Firebase Authentication
    await admin.auth().deleteUser(uid);

    // Delete from Firestore
    const userDocRef = adminDb.collection('users').doc(uid);
    await userDocRef.delete();

    return NextResponse.json({ success: true, message: 'User deleted successfully.' });

  } catch (error: any) {
    console.error('Error in delete-user API route:', error);
    
    let message = 'An unexpected error occurred during user deletion.';
    // Handle cases where the user might already be deleted from Auth but not Firestore
    if (error.code === 'auth/user-not-found') {
      message = 'User not found in Firebase Authentication. They may have already been deleted. Cleaning up Firestore entry.';
      try {
        const { uid } = await request.json(); // Re-read UID for safety
        if (uid) await adminDb.collection('users').doc(uid).delete();
      } catch (cleanupError) {
        console.error("Firestore cleanup failed after user-not-found error:", cleanupError);
      }
    } else {
      message = error.message || message;
    }
    
    return NextResponse.json({ success: false, message: message, code: error.code }, { status: 500 });
  }
}
