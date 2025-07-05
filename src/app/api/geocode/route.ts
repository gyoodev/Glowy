
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('q');
  const apiKey = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!apiKey) {
    console.error('Mapbox Access Token is not configured. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file.');
    return NextResponse.json({ error: 'Mapbox Access Token is not configured on the server. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file. Refer to the README for instructions.' }, { status: 500 });
  }

  if (!address) {
    return NextResponse.json({ error: 'Address query parameter is required' }, { status: 400 });
  }

  const mapboxApiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}&country=BG&language=bg&limit=1`;

  try {
    const response = await fetch(mapboxApiUrl);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const location = data.features[0].center; // Mapbox returns [lng, lat]
      return NextResponse.json({ lat: location[1], lng: location[0] });
    } else {
      return NextResponse.json({ error: 'Адресът не може да бъде намерен на картата.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Mapbox Geocoding API error:', error);
    let message = 'An unknown error occurred during geocoding.';
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
