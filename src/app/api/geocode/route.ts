
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('q');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.');
    return NextResponse.json({ error: 'Google Maps API key is not configured on the server.' }, { status: 500 });
  }
  
  if (!address) {
    return NextResponse.json({ error: 'Address query parameter is required' }, { status: 400 });
  }

  const googleApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=bg`;

  try {
    const response = await fetch(googleApiUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      return NextResponse.json({ lat: location.lat, lng: location.lng });
    } else if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ error: 'Адресът не може да бъде намерен на картата.' }, { status: 404 });
    } else {
      console.error('Google Geocoding API Error:', data.status, data.error_message);
      return NextResponse.json({ error: data.error_message || `Грешка от Google Maps API: ${data.status}` }, { status: 500 });
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
