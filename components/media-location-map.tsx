"use client";

import { useEffect, useRef } from "react";

export function MediaLocationMap({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet").then((L) => {
      if (disposed || !containerRef.current) return;
      const location: [number, number] = [latitude, longitude];
      map = L.map(containerRef.current, {
        attributionControl: true,
        boxZoom: false,
        doubleClickZoom: false,
        dragging: false,
        keyboard: false,
        scrollWheelZoom: false,
        touchZoom: false,
        zoomControl: false
      }).setView(location, 13);
      L.tileLayer("/api/map/tiles/{z}/{x}/{y}", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      L.circleMarker(location, {
        radius: 7,
        color: "rgba(255,255,255,.95)",
        weight: 2,
        fillColor: "hsl(226 75% 58%)",
        fillOpacity: 1
      }).addTo(map);
      requestAnimationFrame(() => map?.invalidateSize());
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-44 w-full"
      aria-label={`Map showing media location at ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
    />
  );
}
