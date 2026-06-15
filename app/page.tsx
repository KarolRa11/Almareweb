"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  IconPlaneDeparture,
  IconUser,
  IconCalendarPlus,
  IconSearch,
  IconMapPin,
  IconBeach,
  IconBuilding,
  IconGlobe,
  IconSailboat,
  IconLock,
  IconBrandWhatsapp,
  IconMap2,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen bg-alm-beige-light dark:bg-gray-900 text-alm-dark dark:text-gray-100 font-sans transition-colors duration-300">
      {/* NAV PUBLICO */}
      <nav className="bg-white dark:bg-gray-900 border-b border-alm-beige-mid dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <IconPlaneDeparture className="text-alm-teal w-8 h-8" />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] text-alm-teal italic font-serif">
              Travel
            </span>
            <span className="text-[18px] font-medium text-alm-mid tracking-wide">
              ALMARÉ
            </span>
            <span className="text-[9px] tracking-[3px] text-alm-mid">
              agencia de viajes
            </span>
          </div>
        </div>

        <div className="hidden md:flex gap-5 items-center">
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Inicio
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Destinos
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Paquetes
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Alojamiento
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Contacto
          </a>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-alm-mid dark:text-gray-300"
            >
              {theme === "dark" ? (
                <IconSun size={18} />
              ) : (
                <IconMoon size={18} />
              )}
            </button>
          )}

          <button className="flex items-center gap-1.5 bg-transparent text-alm-mid dark:text-gray-300 border border-alm-mid dark:border-gray-500 rounded-md px-3.5 py-1.5 text-[13px] hover:bg-alm-beige-light dark:hover:bg-gray-800 transition">
            <IconUser size={16} /> Mi cuenta
          </button>
          <button className="flex items-center gap-1.5 bg-alm-teal text-white rounded-md px-4 py-2 text-[13px] font-medium hover:bg-alm-mid transition">
            <IconCalendarPlus size={16} /> Reservar
          </button>
        </div>
      </nav>

      {/* HERO CON BUSCADOR */}
      <section className="bg-gradient-to-br from-alm-dark via-alm-mid to-alm-teal py-10 px-6 text-center text-white">
        <div className="inline-block bg-white/10 border border-white/30 rounded-full px-4 py-1.5 text-xs text-alm-pastel mb-4 tracking-wide">
          ✦ Hasta 30% de descuento en paquetes de verano 2026
        </div>
        <h1 className="text-2xl md:text-3xl font-medium mb-2">
          Descubre el mundo con Travel Almaré
        </h1>
        <p className="text-sm md:text-base text-white/80 mb-8">
          Destinos nacionales e internacionales · Paquetes a tu medida ·
          Atención personalizada
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 max-w-3xl mx-auto shadow-lg text-left">
          <div>
            <label className="text-[11px] text-alm-teal font-medium uppercase tracking-wide mb-1 block">
              Destino
            </label>
            <input
              type="text"
              placeholder="¿A dónde quieres ir?"
              className="w-full border border-alm-beige-mid dark:border-gray-600 rounded-md px-3 py-2 text-[13px] bg-alm-beige-light dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-light"
            />
          </div>
          <div>
            <label className="text-[11px] text-alm-teal font-medium uppercase tracking-wide mb-1 block">
              Fecha de salida
            </label>
            <input
              type="date"
              className="w-full border border-alm-beige-mid dark:border-gray-600 rounded-md px-3 py-2 text-[13px] bg-alm-beige-light dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-light"
            />
          </div>
          <div>
            <label className="text-[11px] text-alm-teal font-medium uppercase tracking-wide mb-1 block">
              Viajeros
            </label>
            <select className="w-full border border-alm-beige-mid dark:border-gray-600 rounded-md px-3 py-2 text-[13px] bg-alm-beige-light dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-light">
              <option>1 persona</option>
              <option>2 personas</option>
              <option>Familia</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full flex items-center justify-center gap-1.5 bg-alm-teal text-white rounded-md px-6 py-2 text-[13px] font-medium hover:bg-alm-mid transition">
              <IconSearch size={16} /> Buscar
            </button>
          </div>
        </div>
      </section>

      {/* DESTINOS */}
      <section className="bg-white dark:bg-gray-900 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-[17px] font-medium text-alm-dark dark:text-white mb-4 flex items-center gap-2">
            <IconMapPin className="text-alm-teal" /> Destinos populares
          </h2>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {["Todos", "Nacionales", "Internacionales", "Playa", "Cultura"].map(
              (tab, i) => (
                <span
                  key={i}
                  className={`px-4 py-1.5 rounded-full text-xs cursor-pointer border ${i === 0 ? "bg-alm-teal text-white border-alm-teal" : "bg-white dark:bg-gray-800 text-alm-mid border-alm-beige-mid dark:border-gray-700"}`}
                >
                  {tab}
                </span>
              ),
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                title: "Cancún",
                desc: "Mar Caribe · Cenotes",
                price: "7,500",
                icon: <IconBeach size={32} />,
                color: "from-[#B5D4F4] to-alm-light",
              },
              {
                title: "Ciudad de México",
                desc: "Cultura · Gastronomía",
                price: "3,200",
                icon: <IconBuilding size={32} />,
                color: "from-alm-pastel to-alm-teal",
              },
              {
                title: "Europa",
                desc: "París · Roma · Barcelona",
                price: "42,000",
                icon: <IconGlobe size={32} />,
                color: "from-alm-beige-mid to-alm-mid",
              },
              {
                title: "Caribe",
                desc: "Aruba · Jamaica",
                price: "28,000",
                icon: <IconSailboat size={32} />,
                color: "from-alm-light to-alm-dark",
              },
            ].map((d, i) => (
              <div
                key={i}
                className="border border-alm-beige-mid dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800"
              >
                <div
                  className={`h-24 bg-gradient-to-br ${d.color} flex items-center justify-center text-white`}
                >
                  {d.icon}
                </div>
                <div className="p-3">
                  <h3 className="text-[13px] font-medium text-alm-dark dark:text-white">
                    {d.title}
                  </h3>
                  <p className="text-[11px] text-alm-teal mb-2">{d.desc}</p>
                  <div className="text-[10px] text-[#C4933F] flex">★★★★★</div>
                  <div className="text-[13px] font-medium text-alm-mid dark:text-alm-light mt-1">
                    Desde ${d.price} MXN
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-gradient-to-br from-alm-beige to-alm-pastel dark:from-gray-800 dark:to-gray-700 rounded-xl h-24 flex items-center justify-center border border-alm-beige-mid dark:border-gray-600 text-[13px] text-alm-mid dark:text-white gap-2 cursor-pointer shadow-sm">
            <IconMap2 size={20} /> Mapa interactivo de destinos
          </div>
        </div>
      </section>

      {/* WHATSAPP FLOTANTE */}
      <a
        href="https://wa.me/521234567890"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
      >
        <IconBrandWhatsapp size={28} />
      </a>

      {/* FOOTER */}
      <footer className="bg-alm-dark py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start border-b border-white/10 pb-6 mb-4">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <IconPlaneDeparture className="text-alm-pastel w-7 h-7" />
            <div className="flex flex-col leading-none">
              <span className="text-[12px] text-alm-pastel italic font-serif">
                Travel
              </span>
              <span className="text-[16px] font-medium text-white tracking-wide">
                ALMARÉ
              </span>
              <span className="text-[8px] tracking-[2px] text-alm-light">
                agencia de viajes
              </span>
            </div>
          </div>
          <div className="flex gap-6 text-[12px] text-alm-pastel">
            <a className="hover:text-white cursor-pointer transition">
              Aviso de privacidad
            </a>
            <a className="hover:text-white cursor-pointer transition">
              Términos y condiciones
            </a>
            <a className="hover:text-white cursor-pointer transition">
              Soporte
            </a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto flex justify-between items-center text-[11px]">
          <p className="text-white/50">
            © 2026 Travel Almaré · Todos los derechos reservados
          </p>
          <div className="flex items-center gap-1.5 text-alm-pastel">
            <IconLock size={14} /> Conexión segura HTTPS
          </div>
        </div>
      </footer>
    </main>
  );
}
