
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

// Fix the default icon path issue in Leaflet when used with bundlers like Webpack.
// This is done once at the module level to avoid issues with React StrictMode.
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetinaUrl.src,
    iconUrl: iconUrl.src,
    shadowUrl: shadowUrl.src,
  });
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

      const marker = L.marker(center).addTo(map);
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
  }, [center, zoom, markerText]); // Dependencies ensure the map can update if props change, though the current logic doesn't handle updates, just initial render and cleanup.

  // The div that will contain the map. Its ref is used by Leaflet to mount the map.
  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
