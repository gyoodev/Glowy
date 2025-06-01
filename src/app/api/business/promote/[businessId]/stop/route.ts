
import { type NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Assuming you might need auth to verify user
import { app, authInstance as auth } from '@/lib/firebase'; // Import initialized app and auth

const firestore = getFirestore(app);

// Ensure this route is only accessible by authenticated users, preferably the business owner or admin
// You'll need to implement proper authentication and authorization checks here.

export async function POST(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const businessId = params.businessId;

  // --- Authentication/Authorization START ---
  // This is a placeholder. In a real app, you'd get the current user
  // and verify they own this business or are an admin.
  const user = auth.currentUser; // This might be null if called server-side without proper session handling
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  // --- Authentication/Authorization END ---


  if (!businessId) {
    return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
  }

  try {
    const salonRef = doc(firestore, 'salons', businessId);
    const salonSnap = await getDoc(salonRef);

    if (!salonSnap.exists()) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }

    // Add owner check here if you have user session
    // const salonData = salonSnap.data();
    // if (salonData.ownerId !== user.uid) { // Assuming user.uid is available
    //   return NextResponse.json({ error: 'Unauthorized to modify this salon.' }, { status: 403 });
    // }


    await updateDoc(salonRef, {
      'promotion.isActive': false,
      // Optionally, you might want to clear other promotion fields or log this action
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
