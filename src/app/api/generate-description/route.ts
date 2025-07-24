

import { NextRequest, NextResponse } from 'next/server';
import { 
  GenerateSalonDescriptionInputSchema, 
  type GenerateSalonDescriptionInput, 
  type GenerateSalonDescriptionOutput 
} from '@/ai/schemas/generate-salon-description-schemas';
import { generateSalonDescription } from '@/ai/flows/generate-salon-description';

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    const parseResult = GenerateSalonDescriptionInputSchema.safeParse(rawData);

    if (!parseResult.success) {
        return NextResponse.json({ success: false, error: "Invalid input for description generation.", details: parseResult.error.format() }, { status: 400 });
    }
    const data: GenerateSalonDescriptionInput = parseResult.data;
    
    const result: GenerateSalonDescriptionOutput = await generateSalonDescription(data);

    if (result.error) {
      console.error('API Route: Error from generateSalonDescription flow:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
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
