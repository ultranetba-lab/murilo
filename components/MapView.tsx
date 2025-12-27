
import React, { useEffect, useRef } from 'react';
// @ts-ignore
import L from 'leaflet';

interface MapViewProps {
  lat: number;
  lng: number;
  radius?: number;
}

const MapView: React.FC<MapViewProps> = ({ lat, lng, radius = 100 }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(leafletMap.current);

      L.marker([lat, lng]).addTo(leafletMap.current);
      L.circle([lat, lng], {
        color: '#ef4444',
        fillColor: '#f87171',
        fillOpacity: 0.2,
        radius: radius
      }).addTo(leafletMap.current);
    }

    if (leafletMap.current) {
      leafletMap.current.setView([lat, lng], 15);
    }
  }, [lat, lng, radius]);

  return <div ref={mapRef} className="leaflet-container shadow-inner border border-gray-200" />;
};

export default MapView;
