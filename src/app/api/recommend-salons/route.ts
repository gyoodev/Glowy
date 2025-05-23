import { recommendSalons } from '@/ai/flows/recommend-salons';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Add validation for data if necessary

    const result = await recommendSalons(data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calling recommendSalons flow:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}