import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin'; // Assuming you have a firebaseAdmin config

export async function POST(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  const businessId = params.businessId;

  if (!businessId) {
    return NextResponse.json({ success: false, message: 'Business ID is required' }, { status: 400 });
  }

  console.log(`Received request to stop promotion for businessId: ${businessId}`);

  try {
    const businessRef = adminDb.collection('salons').doc(businessId); // Adjust collection name if needed
    await businessRef.update({
      'promotion.isActive': false,
      'promotion.expiresAt': null, // Or set to a past date
    });
    console.log(`Promotion stopped for businessId: ${businessId}`);
    return NextResponse.json({ success: true, message: 'Promotion stopped successfully' });
  } catch (error: any) { // Added type annotation for error
    console.error(`Error stopping promotion for businessId ${businessId}:`, error);
    // Return a more specific error message if needed
    return NextResponse.json({ success: false, message: 'Failed to stop promotion', error: error.message }, { status: 500 });
  }

  // Placeholder success response
  return NextResponse.json({ success: true, message: `Promotion stop requested for businessId: ${businessId}` });
}

// Optional: Add support for other HTTP methods if needed
// export async function GET(req: NextRequest) {}
// export async function PUT(req: NextRequest) {}
// export async function DELETE(req: NextRequest) {}