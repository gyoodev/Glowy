
import { type NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app, auth } from '@/lib/firebase'; // Corrected import for auth

const firestore = getFirestore(app);

export async function POST(
  request: NextRequest,
  context: { params: { businessId: string } } // Explicit context typing
) {
  const businessId = context.params.businessId;

  const user = auth.currentUser;
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  if (!businessId) {
    return NextResponse.json({ error: 'Business ID is required.' }, { status: 400 });
  }

  try {
    const salonRef = doc(firestore, 'salons', businessId);
    const salonSnap = await getDoc(salonRef);

    if (!salonSnap.exists()) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }

    const salonData = salonSnap.data();
    if (salonData.ownerId !== user.uid) {
      return NextResponse.json({ error: 'Unauthorized to modify this salon.' }, { status: 403 });
    }

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
