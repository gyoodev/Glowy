
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('q');

  if (!address) {
    return NextResponse.json({ error: 'Address query parameter is required' }, { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'GlowyApp/1.0 (https://glowy.bg)', // Nominatim requires a User-Agent
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API responded with status ${response.status}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) });
    } else {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    let message = 'An unknown error occurred during geocoding.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
