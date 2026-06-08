
"use client";

import { useEffect, useRef, memo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Report } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { renderToString } from 'react-dom/server';
import { cn } from "@/lib/utils";

interface LeafletMapProps {
  reports?: Report[];
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const LeafletMap = ({
  reports = [],
  interactive = false,
  onLocationSelect,
  selectedLocation,
}: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const reportMarkers = useRef<L.Marker[]>([]);

  const defaultCenter: [number, number] = [-6.515, -36.35];

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Check if map container is already initialized by checking for leaflet id
    const container = mapRef.current;
    if ((container as any)._leaflet_id) return;

    mapInstance.current = L.map(container, {
      scrollWheelZoom: true,
      tap: true, 
    }).setView(defaultCenter, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Handle Interactivity
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    if (interactive && onLocationSelect) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      };
      map.on("click", handleClick);
      return () => {
        map.off("click", handleClick);
      };
    }
  }, [interactive, onLocationSelect]);

  // Handle Markers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || interactive) return;

    // Clear old markers
    reportMarkers.current.forEach(marker => marker.removeFrom(map));
    reportMarkers.current = [];

    reports.forEach(report => {
      const category = getCategory(report.category);
      const IconComponent = category?.icon;
      const problemLabel = category?.problems.find(p => p.value === report.problem)?.label || report.problem;
      const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;

      const iconHtml = IconComponent 
        ? renderToString(<IconComponent className="h-5 w-5 text-white" />)
        : '';

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${category?.color || '#3b82f6'};" class="w-8 h-8 rounded-full shadow-md flex items-center justify-center border-2 border-white">${iconHtml}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const popupContent = `
        <div class="min-w-[200px] p-1 font-sans">
          <div class="mb-2">
            <span class="bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
              ${category?.label || 'Problema'}
            </span>
          </div>
          <h3 class="m-0 text-sm font-bold text-gray-900 leading-tight">${problemLabel}</h3>
          <p class="mt-1 mb-3 text-xs text-gray-500 leading-snug">
            <strong>${displayCity} - ${report.bairro}</strong><br/>
            ${report.location}
          </p>
          <a href="/dashboard#report-${report.id}" class="block text-center bg-primary text-white py-2 rounded-md text-xs font-bold hover:brightness-110 transition-all">
            Ver Detalhes
          </a>
        </div>
      `;
      
      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
      
      reportMarkers.current.push(marker);
    });
  }, [reports, interactive]);

  // Handle Selected Location
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !interactive) return;

    if (markerInstance.current) {
      markerInstance.current.removeFrom(map);
    }

    if (selectedLocation) {
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      markerInstance.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(map);
      map.setView([selectedLocation.lat, selectedLocation.lng], 16);
    }
  }, [selectedLocation, interactive]);

  return (
    <div
      ref={mapRef}
      className={cn('w-full h-full min-h-[300px] relative z-0', interactive ? 'cursor-crosshair' : '')}
      style={{ touchAction: 'pan-y', isolation: 'isolate' }}
    />
  );
};

export default memo(LeafletMap);
