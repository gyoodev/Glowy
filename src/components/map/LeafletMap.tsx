'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import * as L from 'leaflet';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


interface LeafletMapProps {
  center?: { lat: number, lng: number }; // [lat, lng]
  address?: string;
  zoom?: number;
  markerText?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ center, address, zoom = 15, markerText }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number] | null>(center ? [center.lat, center.lng] : null);
  const [isLoading, setIsLoading] = useState<boolean>(!center && !!address);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (center) {
      setMapCenter([center.lat, center.lng]);
      setIsLoading(false);
      setError(null);
    } else if (address) {
      setIsLoading(true);
      setError(null);
      const geocode = async () => {
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to geocode address');
          }
          const data = await response.json();
          if (data.lat && data.lng) {
            setMapCenter([data.lat, data.lng]);
          } else {
             throw new Error('Coordinates not found for the address.');
          }
        } catch (e: any) {
          console.error('Geocoding error in LeafletMap:', e);
          setError(e.message || 'Could not find location.');
        } finally {
          setIsLoading(false);
        }
      };
      geocode();
    }
  }, [center, address]);

  useEffect(() => {
    // Initialize map only if we have a center and the container exists.
    if (mapContainerRef.current && mapCenter && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(mapCenter, zoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      const marker = L.marker(mapCenter).addTo(map);
      if (markerText) {
        marker.bindPopup(markerText).openPopup();
      }
    } else if (mapInstanceRef.current && mapCenter) {
      // If map already exists, just update its view
      mapInstanceRef.current.setView(mapCenter, zoom);
    }

    // Cleanup function: This will be called when the component unmounts.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapCenter, zoom, markerText]);

  if (isLoading) {
    return <Skeleton className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Зареждане на карта...</span>
    </Skeleton>;
  }

  if (error) {
    return <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="font-semibold text-destructive">Грешка при зареждане на картата</p>
        <p className="text-sm text-muted-foreground">{error}</p>
    </div>;
  }
  
  if (!mapCenter && !address) {
     return <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg">
        <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="font-semibold text-muted-foreground">Няма предоставен адрес</p>
    </div>;
  }

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
