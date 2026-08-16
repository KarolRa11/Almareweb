"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  IconBrandWhatsapp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconSailboat,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import type { YachtCollection as YachtCollectionData, YachtListing } from "@/lib/types";

const fallback = "/images/traveler-collection/elite.jpg";

function quoteLink(yacht: YachtListing) {
  const number = yacht.whatsappNumber.replace(/\D/g, "");
  const baseUrl = number ? `https://wa.me/${number}` : "https://wa.me/";
  const price = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: yacht.currency,
    maximumFractionDigits: 0,
  }).format(yacht.price);
  const details = yacht.whatsappMessage
    .replaceAll("{nombre}", yacht.name)
    .replaceAll("{precio}", price)
    .replaceAll("{duracion}", yacht.duration ?? "por confirmar")
    .replaceAll("{capacidad}", String(yacht.capacity))
    .replaceAll("{ubicacion}", yacht.location ?? "Acapulco");
  return `${baseUrl}?text=${encodeURIComponent(details)}`;
}

export default function YachtCollection({
  collection,
  embedded = false,
}: {
  collection: YachtCollectionData;
  embedded?: boolean;
}) {
  const yachts = collection.yachts.filter((item) => item.active);
  const [selected, setSelected] = useState<YachtListing | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const pictures = useMemo(
    () =>
      selected
        ? [selected.imageUrl, ...selected.images].filter(
            (value): value is string => Boolean(value),
          )
        : [],
    [selected],
  );

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [selected]);

  return (
    <>
      <section
        id="yates"
        className={
          embedded
            ? "scroll-mt-24"
            : "mt-12 scroll-mt-24 rounded-3xl border border-alm-beige-mid bg-white p-5 shadow-lg dark:border-alm-mid dark:bg-alm-dark md:p-8"
        }
      >
        <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-alm-teal">
              {collection.eyebrow}
            </p>
            <h3 className="mt-1 flex items-center gap-2 text-2xl font-black text-alm-mid dark:text-white">
              <IconSailboat className="text-alm-teal" /> {collection.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-alm-beige-mid">
              {collection.description}
            </p>
          </div>
          <span className="w-fit rounded-full bg-alm-teal/10 px-4 py-2 text-xs font-black text-alm-mid dark:text-alm-pastel">
            {yachts.length} {yachts.length === 1 ? "opción" : "opciones"}
          </span>
        </div>
        {yachts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-alm-beige-mid px-6 py-10 text-center dark:border-alm-mid">
            <IconSailboat className="mx-auto text-alm-teal" size={38} />
            <h4 className="mt-3 font-black">Próximamente</h4>
            <p className="mt-1 text-sm text-gray-500">
              El equipo está preparando las opciones de yates disponibles.
            </p>
          </div>
        ) : (
          <div
            className={
              yachts.length === 1
                ? "mx-auto max-w-4xl"
                : "mobile-snap-row sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
            }
          >
            {yachts.map((yacht) => (
              <article
                key={yacht.id}
                className={`${yachts.length === 1 ? "grid min-h-0 sm:min-h-[360px] sm:grid-cols-[1.12fr_.88fr]" : "mobile-snap-card flex min-h-[420px] flex-col sm:w-auto sm:min-w-0"} group overflow-hidden rounded-3xl border border-alm-beige-mid bg-white shadow-[0_14px_40px_rgba(29,79,102,.10)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(29,79,102,.16)] dark:border-alm-mid dark:bg-alm-dark`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelected(yacht);
                    setImageIndex(0);
                  }}
                  className={`relative overflow-hidden text-left ${yachts.length === 1 ? "h-64 sm:h-full sm:min-h-[360px]" : "h-56"}`}
                  aria-label={`Ver detalles de ${yacht.name}`}
                >
                  <Image
                    unoptimized
                    fill
                    sizes={
                      yachts.length === 1
                        ? "(max-width: 640px) 100vw, 55vw"
                        : "(max-width: 640px) 100vw, 33vw"
                    }
                    src={yacht.imageUrl || fallback}
                    alt={yacht.name}
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-alm-dark/75 via-transparent to-transparent" />
                  {yacht.badge && (
                    <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] truncate rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-alm-mid shadow-sm backdrop-blur-sm">
                      {yacht.badge}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h4 className="text-2xl font-black">{yacht.name}</h4>
                    {yacht.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/80">
                        <IconMapPin size={14} />
                        {yacht.location}
                      </p>
                    )}
                  </div>
                </button>
                <div className={`flex min-w-0 flex-1 flex-col ${yachts.length === 1 ? "p-6 sm:p-7" : "p-5"}`}>
                  {yachts.length === 1 && (
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[.18em] text-alm-teal">
                      Experiencia privada en la bahía
                    </p>
                  )}
                  <p className={`${yachts.length === 1 ? "line-clamp-5" : "line-clamp-3"} whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid`}>
                    {yacht.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {yacht.duration && (
                      <span className="flex items-center gap-1 rounded-full bg-alm-teal/10 px-2.5 py-1 text-[10px] font-bold text-alm-mid dark:text-alm-pastel">
                        <IconClock size={13} />
                        {yacht.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1 rounded-full bg-alm-teal/10 px-2.5 py-1 text-[10px] font-bold text-alm-mid dark:text-alm-pastel">
                      <IconUsers size={13} />
                      Hasta {yacht.capacity}
                    </span>
                  </div>
                  <div className="mt-auto flex flex-col gap-4 border-t border-alm-beige-mid pt-4 dark:border-alm-mid sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p className={`${yachts.length === 1 ? "text-3xl" : "text-xl"} font-black text-alm-mid dark:text-white`}>
                        {new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: yacht.currency,
                          maximumFractionDigits: 0,
                        }).format(yacht.price)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-gray-400">
                        {yacht.priceUnit}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(yacht);
                        setImageIndex(0);
                      }}
                      className="w-full shrink-0 rounded-xl bg-alm-teal px-5 py-3 text-xs font-black text-white shadow-lg shadow-alm-teal/20 transition hover:bg-alm-mid sm:w-auto"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="yacht-detail-title"
          className="mobile-dialog-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-alm-dark/85 p-3 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <article className="mobile-bottom-sheet relative grid max-h-[94dvh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#133545] lg:grid-cols-2 lg:overflow-hidden">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-20 rounded-full bg-black/60 p-2.5 text-white"
            >
              <IconX />
            </button>
            <div className="relative min-h-52 bg-alm-dark sm:min-h-72 lg:min-h-[650px]">
              <Image
                unoptimized
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={pictures[imageIndex] || fallback}
                alt={`${selected.name}, fotografía ${imageIndex + 1}`}
                className="object-cover"
              />
              {pictures.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex(
                        (index) =>
                          (index - 1 + pictures.length) % pictures.length,
                      )
                    }
                    aria-label="Fotografía anterior"
                    className="absolute left-4 top-1/2 rounded-full bg-black/60 p-2 text-white"
                  >
                    <IconChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((index) => (index + 1) % pictures.length)
                    }
                    aria-label="Fotografía siguiente"
                    className="absolute right-4 top-1/2 rounded-full bg-black/60 p-2 text-white"
                  >
                    <IconChevronRight />
                  </button>
                </>
              )}
            </div>
            <div className="overflow-y-auto p-5 sm:p-6 lg:max-h-[650px] lg:p-9">
              <span className="inline-flex items-center gap-2 rounded-full bg-alm-teal/10 px-3 py-1 text-xs font-black text-alm-teal">
                <IconSailboat size={17} />
                Yate
              </span>
              <h2
                id="yacht-detail-title"
                className="mt-3 pr-10 text-3xl font-black"
              >
                {selected.name}
              </h2>
              {selected.location && (
                <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                  <IconMapPin size={17} />
                  {selected.location}
                </p>
              )}
              <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">
                {selected.description}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <span className="flex items-center gap-2 rounded-xl bg-alm-beige-light p-3 text-sm font-bold dark:bg-alm-dark">
                  <IconUsers className="text-alm-teal" />
                  Hasta {selected.capacity} pasajeros
                </span>
                {selected.duration && (
                  <span className="flex items-center gap-2 rounded-xl bg-alm-beige-light p-3 text-sm font-bold dark:bg-alm-dark">
                    <IconClock className="text-alm-teal" />
                    {selected.duration}
                  </span>
                )}
              </div>
              {selected.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-black">Características</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selected.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <IconCheck
                          className="mt-0.5 shrink-0 text-alm-teal"
                          size={16}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-black">Amenidades</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="rounded-full bg-alm-teal/10 px-3 py-2 text-xs font-bold text-alm-mid dark:text-alm-pastel"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-7 rounded-2xl bg-alm-beige-light p-5 dark:bg-alm-dark">
                <p className="text-3xl font-black text-alm-mid dark:text-white">
                  {new Intl.NumberFormat("es-MX", {
                    style: "currency",
                    currency: selected.currency,
                    maximumFractionDigits: 0,
                  }).format(selected.price)}
                </p>
                <p className="text-xs uppercase text-gray-400">
                  {selected.priceUnit}
                </p>
              </div>
              <a
                href={quoteLink(selected)}
                target="_blank"
                rel="noreferrer"
                aria-label={`Cotizar ${selected.name} por WhatsApp`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-4 font-black text-white transition hover:bg-[#1ebe5d]"
              >
                <IconBrandWhatsapp size={21} /> Cotizar por WhatsApp
              </a>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
