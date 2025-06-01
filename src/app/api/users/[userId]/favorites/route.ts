
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { app } from '@/lib/firebase'; // Correctly import 'app'

const firestoreInstance = getFirestore(app); // Use 'app' to initialize Firestore

// Helper function to get user document reference
const getUserDocRef = (userId: string) => doc(firestoreInstance, 'users', userId);

interface FavoritesRouteContext {
  params: {
    userId: string;
  };
}

export async function POST(
  req: NextRequest,
  context: FavoritesRouteContext
) {
  const userId = context.params.userId;
  const { salonId } = await req.json();

  if (!userId || !salonId) {
    return NextResponse.json({ error: 'Missing userId or salonId' }, { status: 400 });
  }

  try {
    const userDocRef = getUserDocRef(userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Ensure preferences and favoriteSalons array exist, and only add if not already present
    const userData = userDocSnap.data();
    const currentPreferences = userData?.preferences || {};
    const favoriteSalons = currentPreferences.favoriteSalons || [];

    if (!favoriteSalons.includes(salonId)) {
      await updateDoc(userDocRef, {
        'preferences.favoriteSalons': arrayUnion(salonId),
      });
    }

    return NextResponse.json({ message: 'Salon added to favorites' }, { status: 200 });

  } catch (error) {
    console.error('Error adding salon to favorites:', error);
    return NextResponse.json({ error: 'Failed to add salon to favorites' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: FavoritesRouteContext
) {
  const userId = context.params.userId;
  const { salonId } = await req.json();

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

  } catch (error) {
    console.error('Error removing salon from favorites:', error);
    return NextResponse.json({ error: 'Failed to remove salon from favorites' }, { status: 500 });
  }
}
