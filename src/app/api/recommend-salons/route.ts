
import { recommendSalons, RecommendSalonsInputSchema, type RecommendSalonsInput, type RecommendSalonsOutput } from '@/ai/flows/recommend-salons';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const rawData = await req.json();
    const parseResult = RecommendSalonsInputSchema.safeParse(rawData);

    if (!parseResult.success) {
      return NextResponse.json({ success: false, error: "Invalid input provided.", details: parseResult.error.format() }, { status: 400 });
    }
    
    const data: RecommendSalonsInput = parseResult.data;
    // console.log('API Route: Received data for salon recommendations:', data); // Optional: for detailed input logging

    const result: RecommendSalonsOutput = await recommendSalons(data);

    if (result.error) {
      console.error('API Route: Error from recommendSalons flow:', result.error); // Explicit server-side log
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    if (!result.recommendations) {
      console.error('API Route: No recommendations in successful result from flow');
      return NextResponse.json({ success: false, error: 'AI did not return any recommendations.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendations: result.recommendations }, { status: 200 });

  } catch (e: unknown) {
    let errorMessage = 'An unexpected error occurred in the API route for salon recommendations.';
    if (e instanceof Error) {
        errorMessage = e.message;
        console.error('API Route: Uncaught error in POST /api/recommend-salons:', e.message, e.stack);
    } else if (typeof e === 'string') {
        errorMessage = e;
        console.error('API Route: Uncaught string error in POST /api/recommend-salons:', e);
    } else {
        console.error('API Route: Uncaught non-Error object in POST /api/recommend-salons:', e);
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
