"use client";

import { useCallback, useMemo, useState } from "react";
import MarketplaceMap from "@/components/MarketplaceMap";
import type { MarketplaceListing, MarketplaceType } from "@/lib/types";

export const MARKETPLACE_OPEN_EVENT = "almare:abrir-establecimiento";

const filters: Array<["todos" | MarketplaceType, string]> = [
  ["todos", "Todos"],
  ["hotel", "Hoteles"],
  ["airbnb", "Airbnb"],
  ["restaurante", "Restaurantes"],
];

export default function MarketplaceMapSection({
  listings,
}: {
  listings: MarketplaceListing[];
}) {
  const [filter, setFilter] = useState<"todos" | MarketplaceType>("todos");
  const filteredListings = useMemo(
    () =>
      listings.filter(
        (listing) => filter === "todos" || listing.tipo === filter,
      ),
    [filter, listings],
  );
  const openListing = useCallback((listing: MarketplaceListing) => {
    window.dispatchEvent(
      new CustomEvent(MARKETPLACE_OPEN_EVENT, {
        detail: { listingId: listing.id },
      }),
    );
  }, []);

  return (
    <section
      aria-labelledby="mapa-destinos-title"
      className="mt-12 overflow-hidden rounded-2xl border border-alm-beige-mid bg-white shadow-lg dark:border-alm-mid dark:bg-alm-dark md:mt-16"
    >
      <div className="bg-alm-beige p-5 sm:flex sm:items-end sm:justify-between sm:gap-6 dark:bg-[#133545]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-alm-teal">
            Ubicación
          </p>
          <h3
            id="mapa-destinos-title"
            className="text-lg font-black text-alm-mid dark:text-white"
          >
            Mapa de hoteles, Airbnb y restaurantes
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">
            Selecciona un punto para consultar sus detalles y reservar.
          </p>
        </div>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-gray-500 sm:mt-0 sm:text-right dark:text-alm-beige-mid">
          Explora opciones cercanas después de elegir tu próximo destino.
        </p>
      </div>
      <div className="border-t border-alm-beige-mid dark:border-alm-mid">
        <div
          className="flex flex-wrap gap-2 bg-white px-4 py-3 sm:px-5 dark:bg-alm-dark"
          role="group"
          aria-label="Filtrar puntos del mapa"
        >
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={`rounded-full px-3 py-2 text-[11px] font-bold transition ${
                filter === value
                  ? "bg-alm-teal text-white shadow-sm"
                  : "border border-alm-beige-mid bg-white text-alm-mid hover:bg-alm-teal/10 dark:bg-alm-dark dark:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filteredListings.length ? (
          <MarketplaceMap listings={filteredListings} onSelect={openListing} />
        ) : (
          <div className="grid h-72 place-items-center px-5 text-center text-sm text-gray-500">
            No hay puntos publicados en esta categoría.
          </div>
        )}
      </div>
    </section>
  );
}
