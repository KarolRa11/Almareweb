"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  IconLock,
  IconMail,
  IconMapPin,
  IconPlaneDeparture,
  IconSearch,
} from "@tabler/icons-react";
import CatalogoCliente from "@/components/CatalogoCliente";
import ContactCallbackWidget from "@/components/ContactCallbackWidget";
import CulturalProgramWidget from "@/components/CulturalProgramWidget";
import MarketplaceExplorer from "@/components/MarketplaceExplorer";
import Navbar from "@/components/Navbar";
import TravelerCollection from "@/components/TravelerCollection";
import { hexToRgba, readStoredSiteSettings, SITE_SETTINGS_STORAGE_KEY, SITE_SETTINGS_UPDATED_EVENT } from "@/lib/site-settings";
import type { Banner, Destino, MarketplaceListing, SiteSettings, SocialLink, TravelerCollection as TravelerCollectionData, YachtCollection as YachtCollectionData } from "@/lib/types";

export default function HomeContent({ destinos, banners, marketplaceListings, socialLinks, travelerCollection, yachtCollection, initialSiteSettings }: { destinos: Destino[]; banners: Banner[]; marketplaceListings: MarketplaceListing[]; socialLinks: SocialLink[]; travelerCollection: TravelerCollectionData; yachtCollection: YachtCollectionData; initialSiteSettings: SiteSettings }) {
  const [query, setQuery] = useState("");
  const [fecha, setFecha] = useState("");
  const [viajeros, setViajeros] = useState("1");
  const [filtro, setFiltro] = useState("Todos");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [siteSettings, setSiteSettings] = useState(initialSiteSettings);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const syncSettings = () => setSiteSettings(readStoredSiteSettings() ?? initialSiteSettings);
    const timer = window.setTimeout(syncSettings, 0);
    const syncStorage = (event: StorageEvent) => { if (event.key === SITE_SETTINGS_STORAGE_KEY) syncSettings(); };
    window.addEventListener("storage", syncStorage);
    window.addEventListener(SITE_SETTINGS_UPDATED_EVENT, syncSettings);
    return () => { window.clearTimeout(timer); window.removeEventListener("storage", syncStorage); window.removeEventListener(SITE_SETTINGS_UPDATED_EVENT, syncSettings); };
  }, [initialSiteSettings]);

  const resultados = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return destinos.filter((destino) => {
      const categoryMatch =
        filtro === "Todos" ||
        `${destino.titulo} ${destino.descripcion}`
          .toLocaleLowerCase("es")
          .includes(filtro.toLocaleLowerCase("es"));
      const searchMatch =
        !term ||
        `${destino.titulo} ${destino.descripcion}`
          .toLocaleLowerCase("es")
          .includes(term);
      return categoryMatch && searchMatch;
    });
  }, [destinos, filtro, query]);

  function buscar(e: FormEvent) {
    e.preventDefault();
    document.getElementById("destinos")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-alm-beige-light text-alm-dark transition-colors duration-300 dark:bg-alm-dark dark:text-white">
      <Navbar socialLinks={socialLinks} siteSettings={siteSettings} />
      <section id="inicio" className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-alm-dark via-alm-mid to-alm-teal px-4 py-10 text-center text-white sm:px-5 sm:py-14 md:py-20">
        {banners.map((banner, index) => <Image key={banner.id} unoptimized fill priority={index === 0} sizes="100vw" src={banner.imagen_url} alt="" aria-hidden className={`object-cover transition-opacity duration-1000 ${index === bannerIndex ? "opacity-35" : "opacity-0"}`} />)}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(siteSettings.gradientStart, siteSettings.gradientOpacity)}, ${hexToRgba(siteSettings.gradientEnd, siteSettings.gradientOpacity)})` }} />
        <div className="relative mx-auto max-w-6xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-semibold backdrop-blur-sm sm:px-4 sm:text-xs">
            <IconMapPin size={16} /> Experiencias seleccionadas en Acapulco
          </span>
          <h1 className="text-[2rem] font-black leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">Descubre Acapulco con Travel Almaré</h1>
          <p className="mx-auto mb-9 mt-3 max-w-2xl text-sm text-white/80 md:text-base">Destinos locales exclusivos · Paquetes a tu medida · Atención personalizada</p>
          <form onSubmit={buscar} className="mx-auto grid max-w-4xl gap-3 rounded-3xl bg-white p-4 text-left shadow-2xl dark:bg-[#133545] md:grid-cols-[1.2fr_1fr_.8fr_auto]">
            <label className="text-[11px] font-bold uppercase tracking-wide text-alm-teal">Destino
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder="¿A dónde quieres ir?" className="mt-1 block w-full rounded-lg border border-alm-beige-mid bg-alm-beige-light px-3 py-2.5 text-[13px] text-alm-dark outline-none focus:ring-2 focus:ring-alm-light dark:border-alm-mid dark:bg-alm-dark dark:text-white" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wide text-alm-teal">Fecha de salida
              <input value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().slice(0, 10)} type="date" className="mt-1 block w-full rounded-lg border border-alm-beige-mid bg-alm-beige-light px-3 py-2.5 text-[13px] text-alm-dark outline-none focus:ring-2 focus:ring-alm-light dark:border-alm-mid dark:bg-alm-dark dark:text-white dark:[color-scheme:dark]" />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-wide text-alm-teal">Viajeros
              <select value={viajeros} onChange={(e) => setViajeros(e.target.value)} className="mt-1 block w-full rounded-lg border border-alm-beige-mid bg-alm-beige-light px-3 py-2.5 text-[13px] text-alm-dark outline-none focus:ring-2 focus:ring-alm-light dark:border-alm-mid dark:bg-alm-dark dark:text-white">
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? "persona" : "personas"}</option>)}
              </select>
            </label>
            <button className="mt-auto flex h-[42px] items-center justify-center gap-2 rounded-lg bg-alm-teal px-7 text-[13px] font-bold text-white transition hover:bg-alm-mid"><IconSearch size={17} /> Buscar</button>
          </form>
        </div>
      </section>

      <TravelerCollection collection={travelerCollection} socialLinks={socialLinks} />

      <section id="destinos" className="scroll-mt-20 bg-white px-4 py-12 transition-colors dark:bg-alm-dark sm:px-5 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-alm-teal">Explora tu próxima aventura</p><h2 className="flex items-center gap-2 text-2xl font-black"><IconMapPin className="text-alm-teal" /> Destinos populares</h2></div>
            <div className="mobile-filter-row sm:flex sm:flex-wrap sm:gap-2" role="group" aria-label="Filtrar destinos">
              {["Todos", "Tradicional", "Dorado", "Diamante"].map((item) => <button key={item} onClick={() => setFiltro(item)} aria-pressed={filtro === item} className={`rounded-full px-4 py-2 text-xs font-bold transition ${filtro === item ? "bg-alm-teal text-white shadow-md" : "border border-alm-beige-mid text-alm-mid hover:bg-alm-beige-light dark:border-alm-mid dark:text-alm-beige-light dark:hover:bg-[#133545]"}`}>{item}</button>)}
            </div>
          </div>
          <CatalogoCliente destinos={resultados} fechaInicial={fecha} viajerosIniciales={Number(viajeros)} />
          <figure className="mt-12 overflow-hidden rounded-2xl border border-alm-beige-mid bg-alm-beige shadow-lg dark:border-alm-mid md:mt-16">
            <Image
              src="/mapa-zonas-almare.png"
              alt="Ilustración de las zonas turísticas de Acapulco y las experiencias de Travel Almaré"
              width={1408}
              height={768}
              sizes="(max-width: 767px) 100vw, 1152px"
              className="h-auto w-full object-contain"
            />
          </figure>
        </div>
      </section>

      <MarketplaceExplorer listings={marketplaceListings} yachtCollection={yachtCollection} />

      <section id="paquetes" className="scroll-mt-20 bg-alm-beige-light px-5 py-14 dark:bg-[#153f52]">
        <div className="mobile-snap-row mx-auto max-w-6xl sm:grid sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
          {[{title:"Viajes a tu medida", text:"Diseñamos cada experiencia según tus fechas, grupo y presupuesto."},{title:"Atención local", text:"Acompañamiento directo antes, durante y después de tu viaje."},{title:"Reserva protegida", text:"Tu solicitud queda registrada y nuestro equipo confirma cada detalle."}].map((item, index) => <article key={item.title} className="mobile-snap-card rounded-2xl border border-alm-beige-mid bg-white p-6 shadow-sm dark:border-alm-mid dark:bg-alm-dark sm:w-auto sm:min-w-0"><span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-alm-teal/15 font-black text-alm-teal">0{index + 1}</span><h3 className="text-lg font-black">{item.title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{item.text}</p></article>)}
        </div>
      </section>

      <section id="preguntas" className="bg-white px-5 py-14 dark:bg-alm-dark">
        <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-alm-teal">Antes de reservar</p><h2 className="mt-1 text-2xl font-black">Preguntas frecuentes</h2><div className="mt-6 space-y-3">{[
          ["¿La reservación confirma automáticamente el pago?", "No. La reservación registra tu solicitud y el equipo confirma disponibilidad y forma de pago. La plataforma no muestra un pago como aprobado sin una pasarela configurada."],
          ["¿Puedo reservar sin una cuenta?", "Puedes explorar todos los destinos, pero necesitas una cuenta verificada para registrar y consultar tus reservaciones."],
          ["¿Dónde consulto mi solicitud?", "Después de iniciar sesión, abre Mi cuenta. Ahí encontrarás el folio, fecha, pasajeros, total y estado disponible."],
          ["¿Los niños cuentan como pasajeros?", "Sí. Los niños a partir de los 3 años cuentan como una persona o pasajero. Revisa la etiqueta de cada experiencia, porque algunas pueden ser solo para adultos o no admitir niños."],
          ["¿Cómo cancelo una reservación?", "Abre Mi cuenta y usa Cancelar reservación mientras esté pendiente o confirmada. El equipo recibirá el nuevo estado; para cambios adicionales, contáctanos con tu folio."],
        ].map(([question, answer]) => <details key={question} className="group rounded-2xl border border-alm-beige-mid bg-alm-beige-light p-5 dark:border-alm-mid dark:bg-[#133545]"><summary className="cursor-pointer list-none pr-4 font-black marker:hidden">{question}<span className="float-right text-alm-teal group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{answer}</p></details>)}</div></div>
      </section>

      <footer id="contacto" className="scroll-mt-20 bg-alm-dark px-5 py-10 text-white dark:bg-[#0d2a38]">
        <div className="mx-auto grid max-w-6xl gap-8 border-b border-white/10 pb-8 md:grid-cols-2">
          <div><div className="flex items-center gap-2"><IconPlaneDeparture className="text-alm-pastel" size={31} /><div className="leading-none"><span className="block font-serif text-xs italic text-alm-pastel">Travel</span><span className="text-lg font-bold tracking-wide">ALMARÉ</span></div></div><p className="mt-4 max-w-sm text-sm text-white/60">Experiencias memorables y atención cercana en el corazón de Acapulco.</p></div>
          <div className="grid content-start gap-3 text-sm"><a className="flex items-center gap-2 text-white/70 hover:text-alm-pastel" href="mailto:admin@almare.com"><IconMail size={18} /> admin@almare.com</a><a className="text-white/70 hover:text-alm-pastel" href="#preguntas">Preguntas frecuentes</a><a className="text-white/70 hover:text-alm-pastel" href="/politicas">Privacidad, reservaciones y cancelaciones</a></div>
        </div>
        <div className="mx-auto mt-5 flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-[11px] text-white/50 sm:flex-row sm:text-left"><p>© 2026 Travel Almaré</p><span className="flex items-center gap-1.5 text-alm-pastel"><IconLock size={14} /> Sitio seguro</span></div>
      </footer>
      <ContactCallbackWidget settings={siteSettings} />
      <CulturalProgramWidget />
    </main>
  );
}
