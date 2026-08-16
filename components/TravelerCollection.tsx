"use client";

import { useCallback, useState, type CSSProperties } from "react";
import Image from "next/image";
import { IconArrowRight, IconCompass, IconSparkles } from "@tabler/icons-react";
import TravelerPackageModal from "@/components/TravelerPackageModal";
import type { SocialLink, TravelerCollection as TravelerCollectionData, TravelerPackage } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function quoteLink(links: SocialLink[], item: TravelerPackage) {
  const selected = links.find((link) => link.id === "whatsapp" && link.active && link.url) ?? links.find((link) => link.active && link.url);
  if (!selected) return "mailto:admin@almare.com";
  if (selected.id !== "whatsapp") return selected.url;
  const separator = selected.url.includes("?") ? "&" : "?";
  return `${selected.url}${separator}text=${encodeURIComponent(`Hola, me interesa cotizar el paquete ${item.name} (${item.level}).`)}`;
}

export default function TravelerCollection({ collection, socialLinks }: { collection: TravelerCollectionData; socialLinks: SocialLink[] }) {
  const [selected, setSelected] = useState<TravelerPackage | null>(null);
  const closeModal = useCallback(() => setSelected(null), []);
  if (!collection.packages.length) return null;

  return (
    <section id="coleccion-viajero" className="relative scroll-mt-20 overflow-hidden bg-alm-beige-light px-5 py-14 dark:bg-[#153f52] md:py-20">
      <div className="pointer-events-none absolute -left-24 top-12 h-64 w-64 rounded-full bg-alm-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-alm-mid/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto mb-9 max-w-3xl text-center md:mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-alm-teal"><IconCompass size={17} />{collection.eyebrow}</span>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-alm-dark dark:text-white md:text-4xl">{collection.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid md:text-base">{collection.description}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {collection.packages.map((item, index) => (
            <article key={item.id} className={`group relative flex min-h-[390px] flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_12px_35px_rgba(29,79,102,.10)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_22px_45px_rgba(29,79,102,.18)] dark:border-white/10 dark:bg-[#123646] ${index === 2 ? "lg:-translate-y-3 lg:hover:-translate-y-5" : ""}`} style={{ "--package-accent": item.accent ?? "#4a9b8e" } as CSSProperties}>
              <button type="button" onClick={() => setSelected(item)} aria-label={`Ver detalles de ${item.name}`} className="relative h-40 overflow-hidden bg-gradient-to-br from-alm-teal via-alm-mid to-alm-dark text-left">
                {item.imageUrl && <Image unoptimized fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 20vw" src={item.imageUrl} alt="" className="object-cover transition duration-700 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-gradient-to-t from-alm-dark/90 via-alm-dark/20 to-transparent" />
                <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-md"><IconSparkles size={18} /></span>
                {item.badge && <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-alm-dark shadow">{item.badge}</span>}
                <div className="absolute inset-x-0 bottom-0 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-alm-pastel">{item.level}</p><h3 className="mt-1 text-2xl font-black">{item.name}</h3></div>
              </button>
              <div className="flex flex-1 flex-col p-5">
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{item.shortDescription}</p>
                <div className="mt-auto pt-5">{item.priceNote && <p className="text-[9px] font-black uppercase tracking-[.16em] text-gray-400">{item.priceNote}</p>}<p className="mt-1 text-xl font-black text-alm-dark dark:text-white">{formatMoney(item.price, item.currency)}</p><button type="button" onClick={() => setSelected(item)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-alm-teal/25 bg-alm-teal/10 px-4 py-3 text-xs font-black text-alm-mid transition group-hover:bg-alm-teal group-hover:text-white dark:text-alm-pastel">Ver experiencia <IconArrowRight size={16} /></button></div>
              </div>
            </article>
          ))}
        </div>
        {collection.disclaimer && <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-gray-500 dark:text-alm-beige-mid"><strong className="text-alm-dark dark:text-white">Importante:</strong> {collection.disclaimer}</p>}
      </div>
      {selected && <TravelerPackageModal item={selected} quoteUrl={quoteLink(socialLinks, selected)} onClose={closeModal} />}
    </section>
  );
}
