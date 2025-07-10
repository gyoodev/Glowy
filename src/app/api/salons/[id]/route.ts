
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { mapSalon } from '@/utils/mappers';
import type { Salon } from '@/types';

// Force dynamic execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/salons/[id]
 * Fetches details for a single salon by its ID.
 * @param {NextRequest} request - The incoming request object.
 * @param {{ params: { id: string } }} context - The context object containing route parameters.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not initialized.' },
      { status: 503 }
    );
  }
  
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Salon ID is required.' }, { status: 400 });
  }

  try {
    const salonDocRef = doc(adminDb, 'salons', id);
    const salonDocSnap = await getDoc(salonDocRef);

    if (!salonDocSnap.exists()) {
      return NextResponse.json({ error: 'Salon not found.' }, { status: 404 });
    }
    
    const salonData = mapSalon(salonDocSnap.data(), salonDocSnap.id) as Salon;

    // Optional: Only return approved salons via public API
    if (salonData.status !== 'approved') {
         return NextResponse.json({ error: 'Salon not available.' }, { status: 404 });
    }

    return NextResponse.json(salonData, { status: 200 });

  } catch (error) {
    console.error(`Error fetching salon with ID ${id}:`, error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the salon.' },
      { status: 500 }
    );
  }
}
