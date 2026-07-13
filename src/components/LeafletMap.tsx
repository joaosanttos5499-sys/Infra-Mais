"use client";

import { useEffect, useRef, memo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Report } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { renderToString } from 'react-dom/server';
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";
import { Loader2 } from "lucide-react";

interface LeafletMapProps {
  reports?: Report[];
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

const statusColorMap: Record<string, string> = {
  PENDING: '#f59e0b',    // Amarelo (Amber-500)
  IN_PROGRESS: '#3c83f6', // Azul customizado (#3c83f6)
  RESOLVED: '#10b981',    // Verde (Emerald-500)
  UNDER_REVIEW: '#94a3b8' // Cinza (Slate-400)
};

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
  const { theme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  const defaultCenter: [number, number] = [-6.515, -36.35];

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const container = mapRef.current;
    if ((container as any)._leaflet_id) return;

    try {
        mapInstance.current = L.map(container, {
          scrollWheelZoom: true,
          tap: true, 
          zoomControl: true,
        }).setView(defaultCenter, 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(mapInstance.current);

        // Previne Layout Shift forçando uma renderização inicial estável
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
            setIsReady(true);
          }
        }, 50);
    } catch (error) {
        console.error("Leaflet initialization error:", error);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setIsReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isReady) return;

    if (interactive && onLocationSelect) {
      const handleClick = (e: L.LeafletMouseEvent) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      };
      map.on("click", handleClick);
      return () => {
        map.off("click", handleClick);
      };
    }
  }, [interactive, onLocationSelect, isReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !isReady) return;

    reportMarkers.current.forEach(marker => marker.removeFrom(map));
    reportMarkers.current.clear();

    if (interactive) return;

    reports.forEach(report => {
      const category = getCategory(report.category);
      const IconComponent = category?.icon;
      const problemLabel = category?.problems.find(p => p.value === report.problem)?.label || report.problem;
      const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
      
      const markerColor = statusColorMap[report.status] || statusColorMap.UNDER_REVIEW;

      const iconHtml = IconComponent 
        ? renderToString(<IconComponent className="h-5 w-5" style={{ color: '#ffffff' }} />)
        : '';

      const customIcon = L.divIcon({
        html: `<div style="background-color: ${markerColor};" class="w-8 h-8 rounded-full shadow-md flex items-center justify-center border-2 border-white">${iconHtml}</div>`,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const popupContent = `
        <div class="min-w-[220px] p-2 font-sans">
          <div class="mb-2">
            <span style="background-color: ${markerColor}; color: #ffffff !important;" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
              ${category?.label || 'Problema'}
            </span>
          </div>
          <h3 class="m-0 text-sm font-bold leading-tight mb-1 text-card-foreground">${problemLabel}</h3>
          <p class="mt-0 mb-4 text-[11px] leading-snug font-medium text-muted-foreground">
            <strong class="text-foreground">${displayCity} - ${report.bairro}</strong><br/>
            ${report.location}
          </p>
          <a href="/dashboard#report-${report.id}" style="background-color: #3c83f6; color: #ffffff !important; text-decoration: none !important; display: block; text-align: center; padding: 10px; border-radius: 8px; font-weight: 800; font-size: 12px; box-shadow: 0 4px 12px rgba(60, 131, 246, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">
            Ver Detalhes
          </a>
        </div>
      `;
      
      const marker = L.marker([report.latitude, report.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent, {
          className: 'custom-popup',
          offset: [0, -10]
        })
        .on('click', (e) => {
          map.setView(e.latlng, 18, { animate: true });
        });
      
      const key = `${report.latitude.toFixed(6)},${report.longitude.toFixed(6)}`;
      reportMarkers.current.set(key, marker);
    });
  }, [reports, interactive, isReady]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !selectedLocation || !isReady) return;

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
      map.setView([selectedLocation.lat, selectedLocation.lng], 18, {
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
  }, [selectedLocation, interactive, isReady]);

  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[550px] relative bg-muted/20 rounded-xl overflow-hidden" style={{ minHeight: 'inherit', aspectRatio: '16/9' }}>
      {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )}
      <div
        ref={mapRef}
        className={cn('w-full h-full relative z-0', interactive ? 'cursor-crosshair' : '')}
        style={{ touchAction: 'pan-y', isolation: 'isolate', minHeight: 'inherit' }}
      />
    </div>
  );
};

export default memo(LeafletMap);
