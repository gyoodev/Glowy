
import { type NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Assuming 'app' is the initialized FirebaseApp

const firestoreInstance = getFirestore(app);

// Helper function to get user document reference
const getUserDocRef = (userId: string) => doc(firestoreInstance, 'users', userId);

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  let salonId;
  try {
    const body = await request.json();
    salonId = body.salonId;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!userId || !salonId) {
    return NextResponse.json({ error: 'Missing userId or salonId' }, { status: 400 });
  }

  try {
    const userDocRef = getUserDocRef(userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDocSnap.data();
    const currentPreferences = userData?.preferences || {};
    const favoriteSalons = currentPreferences.favoriteSalons || [];

    if (!favoriteSalons.includes(salonId)) {
      await updateDoc(userDocRef, {
        'preferences.favoriteSalons': arrayUnion(salonId),
      });
    }

    return NextResponse.json({ message: 'Salon added to favorites' }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = 'Failed to add salon to favorites';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error('Error adding salon to favorites:', e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  let salonId;
  try {
    const body = await request.json();
    salonId = body.salonId;
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!userId || !salonId) {
    return NextResponse.json({ error: 'Missing userId or salonId' }, { status: 400 });
  }

  try {
    const userDocRef = getUserDocRef(userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await updateDoc(userDocRef, {
      'preferences.favoriteSalons': arrayRemove(salonId),
    });

    return NextResponse.json({ message: 'Salon removed from favorites' }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = 'Failed to remove salon from favorites';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error('Error removing salon from favorites:', e);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
