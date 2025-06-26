'use client';

import React, { useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MapboxMapProps {
  latitude: number;
  longitude: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const MapboxMap: React.FC<MapboxMapProps> = ({ latitude, longitude }) => {
  const [viewport, setViewport] = useState({
    latitude,
    longitude,
    zoom: 14,
  });

  if (!MAPBOX_TOKEN) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="text-destructive">Map Configuration Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Mapbox access token is not configured. Please add{' '}
            <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to your{' '}
            <code>.env</code> file.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-md border">
      <Map
        {...viewport}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        style={{ width: '100%', height: '100%' }}
      >
        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <MapPin className="h-8 w-8 text-primary" fill="hsl(var(--primary))" />
        </Marker>
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
};

export default MapboxMap;
