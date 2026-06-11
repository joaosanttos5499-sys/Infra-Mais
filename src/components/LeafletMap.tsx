
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
  const selectionMarkerInstance = useRef<L.Marker | null>(null);
  const reportMarkers = useRef<Map<string, L.Marker>>(new Map());

  const defaultCenter: [number, number] = [-6.515, -36.35];

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

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
    if (!map) return;

    // Clear old markers
    reportMarkers.current.forEach(marker => marker.removeFrom(map));
    reportMarkers.current.clear();

    if (interactive) return;

    reports.forEach(report => {
      const category = getCategory(report.category);
      const IconComponent = category?.icon;
      const problemLabel = category?.problems.find(p => p.value === report.problem)?.label || report.problem;
      const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
      const categoryColor = category?.color || '#3b82f6';

      const iconHtml = IconComponent 
        ? renderToString(<IconComponent className="h-5 w-5" style={{ color: '#ffffff' }} />)
        : '';

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${categoryColor};" class="w-8 h-8 rounded-full shadow-md flex items-center justify-center border-2 border-white">${iconHtml}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const popupContent = `
        <div class="min-w-[220px] p-2 font-sans bg-white">
          <div class="mb-2">
            <span style="background-color: ${categoryColor}; color: #ffffff !important;" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              ${category?.label || 'Problema'}
            </span>
          </div>
          <h3 class="m-0 text-sm font-bold text-gray-900 leading-tight mb-1">${problemLabel}</h3>
          <p class="mt-0 mb-4 text-[11px] text-gray-600 leading-snug font-medium">
            <strong class="text-gray-800">${displayCity} - ${report.bairro}</strong><br/>
            ${report.location}
          </p>
          <a href="/dashboard#report-${report.id}" style="background-color: #3b82f6; color: #ffffff !important; text-decoration: none !important;" class="block text-center py-2.5 rounded-lg text-xs font-black shadow-lg hover:brightness-110 transition-all uppercase tracking-wide">
            Ver Detalhes
          </a>
        </div>
      `;
      
      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent, {
          className: 'custom-popup',
          offset: [0, -10]
        });
      
      const key = `${report.latitude.toFixed(6)},${report.longitude.toFixed(6)}`;
      reportMarkers.current.set(key, marker);
    });
  }, [reports, interactive]);

  // Handle Selected Location (Redirection or Picking)
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedLocation) return;

    if (interactive) {
      if (selectionMarkerInstance.current) {
        selectionMarkerInstance.current.removeFrom(map);
      }
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      selectionMarkerInstance.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon }).addTo(map);
      map.setView([selectedLocation.lat, selectedLocation.lng], 16);
    } else {
      map.setView([selectedLocation.lat, selectedLocation.lng], 17, {
        animate: true,
        duration: 1
      });

      const key = `${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`;
      const marker = reportMarkers.current.get(key);
      
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
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
