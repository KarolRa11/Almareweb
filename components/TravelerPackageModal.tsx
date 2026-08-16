"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { IconArrowUpRight, IconCheck, IconX } from "@tabler/icons-react";
import type { TravelerPackage } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default function TravelerPackageModal({ item, quoteUrl, onClose }: { item: TravelerPackage; quoteUrl: string; onClose: () => void }) {
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
      <article className="relative grid max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl dark:bg-[#102f3e] md:grid-cols-[.9fr_1.1fr] md:overflow-hidden">
        <button ref={closeButton} type="button" onClick={onClose} aria-label="Cerrar detalles" className="absolute right-4 top-4 z-20 rounded-full bg-alm-dark/75 p-2.5 text-white shadow-lg transition hover:scale-105 hover:bg-alm-dark"><IconX size={20} /></button>
        <div className="relative min-h-64 overflow-hidden bg-gradient-to-br from-alm-teal via-alm-mid to-alm-dark md:min-h-[560px]">
          {item.imageUrl && <Image unoptimized fill sizes="(max-width: 768px) 100vw, 45vw" src={item.imageUrl} alt={item.name} className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-alm-dark via-alm-dark/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
            {item.badge && <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur-md">{item.badge}</span>}
            <p className="text-xs font-bold uppercase tracking-[.22em] text-alm-pastel">{item.level}</p>
            <h2 id={`traveler-package-${item.id}`} className="mt-1 text-4xl font-black tracking-tight">{item.name}</h2>
          </div>
        </div>
        <div className="flex flex-col p-6 md:max-h-[560px] md:overflow-y-auto md:p-9">
          <p className="pr-10 text-base leading-relaxed text-gray-600 dark:text-alm-beige-mid">{item.description}</p>
          {item.features.length > 0 && <div className="my-7 grid gap-3 sm:grid-cols-2">{item.features.map((feature) => <div key={feature} className="flex items-center gap-3 rounded-xl bg-alm-beige-light p-3 text-sm font-bold dark:bg-[#173f51]"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-alm-teal/15 text-alm-teal"><IconCheck size={16} stroke={3} /></span>{feature}</div>)}</div>}
          <div className="mt-auto rounded-2xl border border-alm-teal/20 bg-alm-teal/10 p-5">
            {item.priceNote && <p className="text-[10px] font-black uppercase tracking-[.18em] text-alm-teal">{item.priceNote}</p>}
            <p className="mt-1 text-3xl font-black text-alm-dark dark:text-white">{formatMoney(item.price, item.currency)}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">{item.currency}</p>
          </div>
          <a href={quoteUrl} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal px-6 py-4 text-base font-black text-white shadow-lg shadow-alm-teal/20 transition hover:-translate-y-0.5 hover:bg-alm-mid hover:shadow-xl">Cotizar <IconArrowUpRight size={19} /></a>
        </div>
      </article>
    </div>
  );
}
