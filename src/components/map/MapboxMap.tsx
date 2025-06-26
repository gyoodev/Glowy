'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Manually import icons to fix Next.js build issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

interface LeafletMapProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  markerText?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ center, zoom = 15, markerText }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Initialize map only if the container exists and the map isn't already initialized.
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);
      mapInstanceRef.current = map; // Store instance

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Explicitly create a new Icon instance to avoid issues with default paths in bundlers.
      const defaultIcon = new L.Icon({
        iconUrl: iconUrl.src,
        iconRetinaUrl: iconRetinaUrl.src,
        shadowUrl: shadowUrl.src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const marker = L.marker(center, { icon: defaultIcon }).addTo(map);
      if (markerText) {
        marker.bindPopup(markerText);
      }
    }

    // Cleanup function: This will be called when the component unmounts.
    // It's crucial for preventing the "Map container is already initialized" error.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, markerText]);

  // The div that will contain the map. Its ref is used by Leaflet to mount the map.
  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
