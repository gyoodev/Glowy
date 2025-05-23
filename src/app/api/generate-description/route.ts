
import { NextRequest, NextResponse } from 'next/server';
import { generateSalonDescription, type GenerateSalonDescriptionInput } from '@/ai/flows/generate-salon-description';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as GenerateSalonDescriptionInput;
    console.log('Received data for description generation:', data);

    const result = await generateSalonDescription(data);

    if (result.error) {
      console.error('Error from generateSalonDescription flow:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, salonDescription: result.salonDescription }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing description generation request in API route:', error);
    // This catch is for unexpected errors in the API route itself
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred in the API route' }, { status: 500 });
  }
}
