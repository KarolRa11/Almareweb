"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { IconArrowUpRight, IconBed, IconCheck, IconClock, IconSailboat, IconToolsKitchen2, IconUsers, IconX } from "@tabler/icons-react";
import type { TravelerPackage } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default function TravelerPackageModal({ item, quoteUrl, commercialConditions = [], onClose }: { item: TravelerPackage; quoteUrl: string; commercialConditions?: string[]; onClose: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-alm-dark/85 p-3 backdrop-blur-md md:p-6" role="dialog" aria-modal="true" aria-labelledby={`traveler-package-${item.id}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article className="relative grid max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-[#102f3e] md:grid-cols-[.82fr_1.18fr] md:overflow-hidden">
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Cerrar detalles" className="absolute right-4 top-4 z-20 rounded-full bg-alm-dark/75 p-2.5 text-white shadow-lg transition hover:scale-105 hover:bg-alm-dark"><IconX size={20} /></button>
        <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-alm-teal via-alm-mid to-alm-dark md:min-h-[680px]">
          {item.imageUrl && <Image unoptimized fill sizes="(max-width: 768px) 100vw, 45vw" src={item.imageUrl} alt={item.name} className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-alm-dark via-alm-dark/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            {item.badge && <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur-md">{item.badge}</span>}
            <p className="text-xs font-bold uppercase tracking-[.22em] text-alm-pastel">{item.level}</p>
            <h2 id={`traveler-package-${item.id}`} className="mt-1 text-4xl font-black tracking-tight">{item.name}</h2>
            {item.duration && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/85"><IconClock size={17} /> {item.duration}</p>}
          </div>
        </div>
        <div className="flex flex-col p-6 md:max-h-[680px] md:overflow-y-auto md:p-9">
          {item.tagline && <p className="pr-10 text-xl font-black text-alm-dark dark:text-white">{item.tagline}</p>}
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{item.description}</p>
          {(item.lodging || item.yacht || item.meals) && <div className="my-6 grid gap-2 sm:grid-cols-3">
            {item.lodging && <div className="rounded-xl bg-alm-beige-light p-3 dark:bg-[#173f51]"><IconBed className="mb-2 text-alm-teal" size={19} /><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Hospedaje</p><p className="mt-1 text-xs font-bold leading-relaxed">{item.lodging}</p></div>}
            {item.yacht && <div className="rounded-xl bg-alm-beige-light p-3 dark:bg-[#173f51]"><IconSailboat className="mb-2 text-alm-teal" size={19} /><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Yate</p><p className="mt-1 text-xs font-bold leading-relaxed">{item.yacht}</p></div>}
            {item.meals && <div className="rounded-xl bg-alm-beige-light p-3 dark:bg-[#173f51]"><IconToolsKitchen2 className="mb-2 text-alm-teal" size={19} /><p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Alimentos</p><p className="mt-1 text-xs font-bold leading-relaxed">{item.meals}</p></div>}
          </div>}
          {item.features.length > 0 && <div><h3 className="text-xs font-black uppercase tracking-[.16em] text-alm-teal">Todo lo que incluye</h3><div className="mt-3 grid gap-x-5 gap-y-2 sm:grid-cols-2">{item.features.map((feature) => <div key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-gray-700 dark:text-alm-beige-mid"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-alm-teal/15 text-alm-teal"><IconCheck size={12} stroke={3} /></span>{feature}</div>)}</div></div>}
          {item.idealFor && <div className="mt-6 rounded-2xl border border-alm-beige-mid p-4 dark:border-alm-mid"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-alm-teal"><IconUsers size={17} /> Ideal para</p><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{item.idealFor}</p></div>}
          <div className="mt-6 rounded-2xl border border-alm-teal/20 bg-alm-teal/10 p-5">
            {item.priceNote && <p className="text-[10px] font-black uppercase tracking-[.18em] text-alm-teal">{item.priceNote}</p>}
            <p className="mt-1 text-3xl font-black text-alm-dark dark:text-white">{formatMoney(item.price, item.currency)}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">{item.currency} por persona</p>
            {item.couplePrice != null && <p className="mt-3 border-t border-alm-teal/20 pt-3 text-sm font-bold text-alm-mid dark:text-alm-pastel">Pareja: desde {formatMoney(item.couplePrice, item.currency)}</p>}
          </div>
          {commercialConditions.length > 0 && <details className="mt-4 rounded-xl border border-alm-beige-mid p-4 text-xs dark:border-alm-mid"><summary className="cursor-pointer font-black text-alm-mid dark:text-alm-pastel">Condiciones comerciales</summary><ul className="mt-3 space-y-2 pl-4 text-gray-500 dark:text-alm-beige-mid">{commercialConditions.map((condition) => <li key={condition} className="list-disc">{condition}</li>)}</ul></details>}
          <a href={quoteUrl} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal px-6 py-4 text-base font-black text-white shadow-lg shadow-alm-teal/20 transition hover:-translate-y-0.5 hover:bg-alm-mid hover:shadow-xl">Cotizar <IconArrowUpRight size={19} /></a>
        </div>
      </article>
    </div>
  );
}
