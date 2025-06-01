
import { NextRequest, NextResponse } from 'next/server';
import { generateSalonDescription, type GenerateSalonDescriptionInput, type GenerateSalonDescriptionOutput } from '@/ai/flows/generate-salon-description';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as GenerateSalonDescriptionInput;
    // console.log('API Route: Received data for description generation:', data); // Optional: for detailed input logging

    const result: GenerateSalonDescriptionOutput = await generateSalonDescription(data);

    if (result.error) {
      console.error('API Route: Error from generateSalonDescription flow:', result.error); // Explicit server-side log
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    if (!result.salonDescription) {
      console.error('API Route: No salonDescription in successful result from flow');
      return NextResponse.json({ success: false, error: 'AI did not return a salon description.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, salonDescription: result.salonDescription }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = "An unexpected error occurred in the API route for description generation.";
    if (e instanceof Error) {
        errorMessage = e.message;
        console.error('API Route: Uncaught error in POST /api/generate-description:', e.message, e.stack);
    } else if (typeof e === 'string') {
        errorMessage = e;
        console.error('API Route: Uncaught string error in POST /api/generate-description:', e);
    } else {
        console.error('API Route: Uncaught non-Error object in POST /api/generate-description:', e);
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
