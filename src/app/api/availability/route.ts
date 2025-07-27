
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'This API endpoint is deprecated and should not be used.' }, { status: 410 });
}
