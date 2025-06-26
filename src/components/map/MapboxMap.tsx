'use client';

import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
// Import the compatibility package styles and script
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';


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

      // With leaflet-defaulticon-compatibility, we don't need to manually create the icon.
      // It patches L.Icon.Default to work out-of-the-box.
      const marker = L.marker(center).addTo(map);
      if (markerText) {
        marker.bindPopup(markerText);
      }
    }

    // Cleanup function: This will be called when the component unmounts.
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
