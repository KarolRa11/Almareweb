"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MarketplaceListing } from "@/lib/types";

const markerByType: Record<MarketplaceListing["tipo"], string> = {
  hotel: "🏨",
  airbnb: "🏠",
  restaurante: "🍽️",
};

export default function MarketplaceMap({
  listings,
  onSelect,
}: {
  listings: MarketplaceListing[];
  onSelect: (listing: MarketplaceListing) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let disposed = false;

    async function renderMap() {
      if (!containerRef.current) return;
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;

      mapRef.current?.remove();
      const map = L.map(containerRef.current, {
        center: [16.855186, -99.867323],
        zoom: 12,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const points: [number, number][] = [];
      listings.forEach((listing) => {
        const point: [number, number] = [
          Number(listing.latitud),
          Number(listing.longitud),
        ];
        if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) return;
        points.push(point);
        const marker = L.marker(point, {
          title: listing.nombre,
          icon: L.divIcon({
            className: "almare-map-marker-shell",
            html: `<span class="almare-map-marker almare-map-marker--${listing.tipo}" aria-hidden="true"><span>${markerByType[listing.tipo]}</span></span>`,
            iconSize: [44, 52],
            iconAnchor: [22, 48],
          }),
        }).addTo(map);
        marker.bindTooltip(listing.nombre, {
          direction: "top",
          offset: [0, -42],
        });
        marker.on("click", () => onSelect(listing));
      });

      if (points.length === 1) map.setView(points[0], 15);
      else if (points.length > 1)
        map.fitBounds(L.latLngBounds(points), { padding: [45, 45], maxZoom: 15 });

      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void renderMap();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [listings, onSelect]);

  return (
    <div
      ref={containerRef}
      className="h-[330px] w-full bg-alm-beige-light sm:h-[380px] md:h-[500px]"
      aria-label="Mapa interactivo con hoteles, Airbnb y restaurantes"
    />
  );
}
