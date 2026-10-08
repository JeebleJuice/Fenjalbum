"use client";

import { useEffect, useRef } from "react";
import { formatDisplayDate } from "@/lib/date-format";

export type MapMediaPoint = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  capturedAt: string | null;
  thumbSrc: string | null;
};

type PointGroup = { latitude: number; longitude: number; items: MapMediaPoint[] };

function groupNearby(points: MapMediaPoint[]) {
  const groups = new Map<string, MapMediaPoint[]>();
  for (const point of points) {
    const key = `${Math.round(point.latitude * 20) / 20}:${Math.round(point.longitude * 20) / 20}`;
    groups.set(key, [...(groups.get(key) ?? []), point]);
  }
  return Array.from(groups.values()).map<PointGroup>((items) => ({
    latitude: items.reduce((sum, item) => sum + item.latitude, 0) / items.length,
    longitude: items.reduce((sum, item) => sum + item.longitude, 0) / items.length,
    items
  }));
}

export function PhotoMap({ points }: { points: MapMediaPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    let disposed = false;
    let map: import("leaflet").Map | null = null;

    void import("leaflet").then((L) => {
      if (disposed || !containerRef.current) return;
      map = L.map(containerRef.current, { zoomControl: true, preferCanvas: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const bounds: Array<[number, number]> = [];
      for (const group of groupNearby(points)) {
        const location: [number, number] = [group.latitude, group.longitude];
        bounds.push(location);
        const marker = L.circleMarker(location, {
          radius: Math.min(22, 7 + Math.sqrt(group.items.length) * 2.5),
          color: "rgba(255,255,255,.9)",
          weight: 2,
          fillColor: "hsl(226 75% 58%)",
          fillOpacity: 0.9
        }).addTo(map);

        const popup = document.createElement("div");
        popup.className = "fenjalbum-map-popup";
        const heading = document.createElement("strong");
        heading.textContent = `${group.items.length} ${group.items.length === 1 ? "memory" : "memories"} here`;
        popup.appendChild(heading);
        for (const item of group.items.slice(0, 6)) {
          const link = document.createElement("a");
          link.href = `/media/${encodeURIComponent(item.id)}?returnTo=${encodeURIComponent("/map")}`;
          if (item.thumbSrc) {
            const image = document.createElement("img");
            image.src = item.thumbSrc;
            image.alt = "";
            link.appendChild(image);
          }
          const label = document.createElement("span");
          label.textContent = item.capturedAt ? `${item.title} · ${formatDisplayDate(item.capturedAt)}` : item.title;
          link.appendChild(label);
          popup.appendChild(link);
        }
        if (group.items.length > 6) {
          const remainder = document.createElement("small");
          remainder.textContent = `+ ${group.items.length - 6} more`;
          popup.appendChild(remainder);
        }
        marker.bindPopup(popup, { maxWidth: 300, minWidth: 220 });
      }

      if (bounds.length === 1) map.setView(bounds[0], 11);
      else map.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
    });

    return () => {
      disposed = true;
      map?.remove();
    };
  }, [points]);

  return <div ref={containerRef} className="h-full min-h-[18rem] w-full rounded-[1.25rem]" aria-label="Map of media capture locations" />;
}
