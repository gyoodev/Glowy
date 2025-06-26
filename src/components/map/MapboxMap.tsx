'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Import marker images directly for Next.js to handle
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default icon path issue in Next.js
// This ensures that Leaflet can find the icon images
if (L.Icon.Default.prototype._getIconUrl) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
}
  
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x.src,
    iconUrl: markerIcon.src,
    shadowUrl: markerShadow.src,
});


interface LeafletMapProps {
  latitude: number;
  longitude: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ latitude, longitude }) => {
  if (typeof window === 'undefined') {
    return (
        <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-md border bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">Loading map...</p>
        </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-md border z-0">
      <MapContainer center={[latitude, longitude]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>
            Местоположение на салона.
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
