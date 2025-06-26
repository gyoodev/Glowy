'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

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
