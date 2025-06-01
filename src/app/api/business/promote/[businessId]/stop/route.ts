
import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

interface RouteContextParams {
  businessId: string;
}

export async function POST(
  request: Request, // Changed from NextRequest
  context: { params: RouteContextParams }
) {
  const businessId = context.params.businessId;

  if (!businessId) {
    return NextResponse.json({ success: false, message: 'Business ID is required' }, { status: 400 });
  }

  console.log('Received request to stop promotion for businessId: ' + businessId);

  try {
    const businessRef = adminDb.collection('salons').doc(businessId);
    const docSnap = await businessRef.get();

    if (!docSnap.exists()) {
        console.log('No such business found for ID: ' + businessId);
        return NextResponse.json({ success: false, message: 'Business not found' }, { status: 404 });
    }

    await businessRef.update({
      'promotion.isActive': false,
    });
    console.log('Promotion stopped for businessId: ' + businessId);
    return NextResponse.json({ success: true, message: 'Promotion stopped successfully' });
  } catch (error: any) {
    console.error('Error stopping promotion for businessId ' + businessId + ':', error);
    return NextResponse.json({ success: false, message: 'Failed to stop promotion', error: error.message }, { status: 500 });
  }
}
