import { recommendSalons, type RecommendSalonsInput } from '@/ai/flows/recommend-salons';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as RecommendSalonsInput;
    // Add validation for data if necessary here, before calling the flow

    const result = await recommendSalons(data);

    if (result.error) {
      console.error('Error from recommendSalons flow:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendations: result.recommendations }, { status: 200 });

  } catch (error: any) {
    console.error('Error calling recommendSalons flow in API route:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate recommendations in API route' }, { status: 500 });
  }
}
