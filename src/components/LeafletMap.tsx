"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Report } from "@/lib/types";

// Define a interface para as props
interface LeafletMapProps {
  reports?: Report[]; // Tornando os relatórios opcionais
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function LeafletMap({
  reports = [],
  interactive = false,
  onLocationSelect,
  selectedLocation,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const reportMarkers = useRef<L.Marker[]>([]);

  const defaultCenter: [number, number] = [-6.515, -36.35];

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView(defaultCenter, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    if (!map) return;

    // Lógica para modo interativo (formulário)
    if (interactive && onLocationSelect) {
      map.on("click", (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });
    }

    // Limpa marcadores de relatórios antigos
    reportMarkers.current.forEach(marker => marker.removeFrom(map));
    reportMarkers.current = [];

    // Adiciona marcadores para relatórios (página inicial)
    if (!interactive && reports.length > 0) {
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
        
      reports.forEach(report => {
          const reportMarker = L.marker([report.latitude, report.longitude], { icon })
              .addTo(map)
              .bindPopup(`<b>${report.category}</b><br>${report.location}`);
          reportMarkers.current.push(reportMarker);
      });
    }


    return () => {
      if (map) {
        map.off("click");
      }
    };
  }, [interactive, onLocationSelect, reports]);
  
  // Efeito para gerenciar o marcador de seleção
  useEffect(() => {
      const map = mapInstance.current;
      if (!map || !interactive) return;

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      // Remove o marcador antigo
      if (markerInstance.current) {
          markerInstance.current.removeFrom(map);
          markerInstance.current = null;
      }

      // Adiciona um novo marcador se a localização for selecionada
      if (selectedLocation) {
          markerInstance.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(map);
          map.setView([selectedLocation.lat, selectedLocation.lng], 16); // Centraliza no marcador
      }

  }, [selectedLocation, interactive]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "300px" }}
      className={interactive ? 'cursor-pointer' : ''}
    />
  );
}
