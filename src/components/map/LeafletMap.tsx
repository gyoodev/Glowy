
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
      const geocode = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
          const data = await response.json();
          
          if (!response.ok) {
            let userFriendlyMessage = 'Възникна грешка при зареждане на картата.';
            if (response.status === 404) {
              userFriendlyMessage = 'Адресът не може да бъде намерен на картата.';
            } else if (data.error) {
              userFriendlyMessage = data.error;
            }
            setError(userFriendlyMessage);
            setMapCenter(null);
          } else if (data.lat && data.lng) {
            setMapCenter([data.lat, data.lng]);
          } else {
             setError('Получени са невалидни координати от сървъра.');
             setMapCenter(null);
          }
        } catch (e: any) {
          console.error('Network or parsing error in LeafletMap geocoding:', e);
          setError('Възникна мрежова грешка при зареждане на картата.');
          setMapCenter(null);
        } finally {
          setIsLoading(false);
        }
      };
      geocode();
    }
  }, [center, address]);

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      setError("Mapbox токенът не е конфигуриран от страна на клиента.");
      return;
    }

    if (mapContainerRef.current && mapCenter && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(mapCenter, zoom);
      mapInstanceRef.current = map;

      L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`, {
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a>',
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(map);
      
      const marker = L.marker(mapCenter).addTo(map);
      if (markerText) {
        marker.bindPopup(markerText).openPopup();
      }
    } else if (mapInstanceRef.current && mapCenter) {
      mapInstanceRef.current.setView(mapCenter, zoom);
    }

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
    return <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
        <p className="font-semibold text-destructive">Проблем с картата</p>
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
