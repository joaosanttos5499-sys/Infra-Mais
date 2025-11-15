"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LeafletMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Se já existir uma instância global antiga, remove ela (HMR safe)
    if (typeof window !== "undefined" && (window as any).__leafletMap) {
      try {
        (window as any).__leafletMap.remove();
      } catch (e) {
        // ignore
      }
      (window as any).__leafletMap = undefined;
    }

    if (!mapRef.current) return;

    // Cria o mapa manualmente (sem react-leaflet)
    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([-8.05, -34.9], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    L.marker([-8.05, -34.9], { icon }).addTo(map).bindPopup("Exemplo de marcador");

    // Salva globalmente para permitir remoção futura (HMR/dev)
    (window as any).__leafletMap = map;

    // cleanup quando o componente desmontar
    return () => {
      try {
        map.remove();
      } catch (e) {
        // ignore
      }
      (window as any).__leafletMap = undefined;
    };
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "300px" }}
      // opcional: evita conflito com outras divs id/map
      // id can be omitted because we use ref
    />
  );
}
