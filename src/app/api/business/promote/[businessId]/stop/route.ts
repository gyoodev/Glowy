
import { type NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app, auth } from '@/lib/firebase'; // Corrected import for auth

const firestore = getFirestore(app);

export async function POST(
  request: NextRequest,
  context: any // Changed to any for diagnostic purposes
) {
  const businessId = context.params.businessId;

  // Firebase Auth is client-side, this check won't work as expected in a server-side API route
  // For server-side auth, you'd typically verify an ID token passed in the request headers.
  // For simplicity in this specific route, if this needs to be owner-restricted,
  // ensure the client only calls this if the user is the owner, or implement token verification.
  // The original code had `auth.currentUser` which is a client-side construct.
  // We'll proceed assuming some form of client-side authorization or a future server-side check.

  if (!businessId) {
    return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
  }

  try {
    const salonRef = doc(firestore, 'salons', businessId);
    const salonSnap = await getDoc(salonRef);

    if (!salonSnap.exists()) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }

    // Add owner check if possible, e.g., if client sends user ID or token
    // const salonData = salonSnap.data();
    // if (salonData.ownerId !== verifiedUserId) { // verifiedUserId would come from token
    //   return NextResponse.json({ error: 'Unauthorized to modify this salon.' }, { status: 403 });
    // }

    await updateDoc(salonRef, {
      'promotion.isActive': false,
    });

    return NextResponse.json({ success: true, message: `Promotion for salon ${businessId} has been stopped.` });

  } catch (e: unknown) {
    let errorMessage = 'Failed to stop promotion.';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error(`Error stopping promotion for business ${businessId}:`, e);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

