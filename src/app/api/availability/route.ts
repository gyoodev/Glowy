
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { Salon } from '@/types';
import { mapSalon } from '@/utils/mappers';

export async function GET(request: NextRequest) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin SDK not initialized. Check server logs for environment variable issues.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get('salonId');
  const date = searchParams.get('date'); // Expects date in 'yyyy-MM-dd' format

  if (!salonId || !date) {
    return NextResponse.json({ error: 'salonId and date are required' }, { status: 400 });
  }

  try {
    // 1. Get the salon's general availability for the given date
    const salonRef = adminDb.collection('salons').doc(salonId);
    const salonSnap = await salonRef.get();

    if (!salonSnap.exists) {
      return NextResponse.json({ error: 'Salon not found' }, { status: 404 });
    }
    const salonData = mapSalon(salonSnap.data(), salonSnap.id);
    const availableSlotsFromSchedule = salonData.availability?.[date] || [];

    // 2. Get all bookings for that salon on that specific day that are 'pending' or 'confirmed'
    const bookingsQuery = adminDb.collection('bookings')
      .where('salonId', '==', salonId)
      .where('date', '==', `${date}T00:00:00.000Z`) // Query date in ISO format as stored
      .where('status', 'in', ['pending', 'confirmed']);
      
    const bookingsSnapshot = await bookingsQuery.get();
    const bookedSlots = new Set(bookingsSnapshot.docs.map(doc => doc.data().time));

    // 3. Filter out the booked slots from the available slots
    const trulyAvailableSlots = availableSlotsFromSchedule.filter(slot => !bookedSlots.has(slot));

    return NextResponse.json({ availableTimes: trulyAvailableSlots });

  } catch (error) {
    console.error('Error fetching availability:', error);
    let errorMessage = 'An unknown error occurred while fetching availability.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
