
import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { mapSalon } from '@/utils/mappers';
import type { Salon, BusinessStatus } from '@/types';

// Force dynamic execution to ensure fresh data on every request
export const dynamic = 'force-dynamic';

/**
 * GET /api/salons
 * Fetches a list of all approved salons.
 */
export async function GET() {
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin SDK not initialized.' },
      { status: 503 }
    );
  }

  try {
    const salonsCollectionRef = adminDb.collection('salons');
    const q = query(
      salonsCollectionRef,
      where('status', '==', 'approved' as BusinessStatus),
      orderBy('name')
    );
    
    const salonsSnapshot = await getDocs(q);
    
    if (salonsSnapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }
    
    const salonsList: Salon[] = salonsSnapshot.docs.map(doc => mapSalon(doc.data(), doc.id));
    
    return NextResponse.json(salonsList, { status: 200 });

  } catch (error) {
    console.error('Error fetching salons:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching salons.' },
      { status: 500 }
    );
  }
}
