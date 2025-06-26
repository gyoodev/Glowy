
'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  useEffect(() => {
    // This effect runs only on the client side
    // Fix the default icon path issue in Leaflet when used with bundlers like Webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: iconRetinaUrl.src,
      iconUrl: iconUrl.src,
      shadowUrl: shadowUrl.src,
    });
  }, []);

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={center}>
        {markerText && <Popup>{markerText}</Popup>}
      </Marker>
    </MapContainer>
  );
};

export default LeafletMap;
