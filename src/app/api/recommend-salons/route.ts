
import { recommendSalons, type RecommendSalonsInput, type RecommendSalonsOutput } from '@/ai/flows/recommend-salons';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as RecommendSalonsInput;
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

  } catch (error: any) {
    console.error('API Route: Uncaught error in POST /api/recommend-salons:', error); // Log unexpected errors
    let errorMessage = 'An unexpected error occurred in the API route for salon recommendations.';
    if (typeof error?.message === 'string') {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error.toString === 'function') {
      errorMessage = error.toString();
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
