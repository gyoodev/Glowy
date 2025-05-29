
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../../../lib/firebaseAdmin'; // Adjusted to relative path

export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const businessId = params.businessId;

  if (!businessId) {
    return NextResponse.json({ success: false, message: 'Business ID is required' }, { status: 400 });
  }

  console.log('Received request to stop promotion for businessId: ' + businessId);

  try {
    const businessRef = adminDb.collection('salons').doc(businessId); // Adjust collection name if needed
    const docSnap = await businessRef.get();

    if (!docSnap.exists) {
        console.log('No such business found for ID: ' + businessId);
        return NextResponse.json({ success: false, message: 'Business not found' }, { status: 404 });
    }

    await businessRef.update({
      'promotion.isActive': false,
      // Optionally set expiresAt to null or a past date if you want to clear it
      // 'promotion.expiresAt': null,
    });
    console.log('Promotion stopped for businessId: ' + businessId);
    return NextResponse.json({ success: true, message: 'Promotion stopped successfully' });
  } catch (error: any) { 
    console.error('Error stopping promotion for businessId ' + businessId + ':', error);
    // Return a more specific error message if needed
    return NextResponse.json({ success: false, message: 'Failed to stop promotion', error: error.message }, { status: 500 });
  }
}
