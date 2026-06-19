import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  IconPlaneDeparture,
  IconUser,
  IconCalendarPlus,
  IconSearch,
  IconMapPin,
  IconLock,
  IconMap2,
  IconMoon,
} from "@tabler/icons-react";
import CatalogoCliente from "@/components/CatalogoCliente"; // Importamos el nuevo componente

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  // Traemos los datos de Supabase en tiempo real
  const { data: destinos } = await supabase
    .from("destinos")
    .select("*")
    .order("precio", { ascending: true });

  return (
    <main className="min-h-screen bg-alm-beige-light dark:bg-gray-900 text-alm-dark dark:text-gray-100 font-sans transition-colors duration-300">
      {/* NAV PUBLICO COMPLETO */}
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
          <a className="text-[13px] font-medium text-alm-teal cursor-pointer">
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
          <IconMoon
            size={18}
            className="text-alm-mid cursor-pointer hover:text-alm-teal transition mx-2"
          />
          <a
            href="/login"
            className="flex items-center gap-1.5 bg-transparent text-alm-mid dark:text-gray-300 border border-alm-mid dark:border-gray-500 rounded-md px-3.5 py-1.5 text-[13px] hover:bg-alm-beige-light dark:hover:bg-gray-800 transition"
          >
            <IconUser size={16} /> Mi cuenta
          </a>
          <button className="flex items-center gap-1.5 bg-alm-teal text-white rounded-md px-4 py-1.5 text-[13px] font-medium hover:bg-alm-mid transition">
            <IconCalendarPlus size={16} /> Reservar
          </button>
        </div>
      </nav>

      {/* HERO CON BUSCADOR COMPLETO */}
      <section className="bg-gradient-to-br from-alm-dark via-alm-mid to-alm-teal py-12 px-6 text-center text-white">
        <h1 className="text-2xl md:text-4xl font-medium mb-2">
          Descubre Acapulco con Travel Almaré
        </h1>
        <p className="text-sm md:text-base text-white/80 mb-8 max-w-2xl mx-auto">
          Destinos locales exclusivos · Paquetes a tu medida · Atención
          personalizada
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 max-w-4xl mx-auto shadow-lg text-left">
          <div className="flex-1">
            <label className="text-[11px] text-alm-teal font-medium uppercase tracking-wide mb-1 block">
              Destino
            </label>
            <input
              type="text"
              placeholder="¿A dónde quieres ir?"
              className="w-full border border-alm-beige-mid dark:border-gray-600 rounded-md px-3 py-2 text-[13px] bg-alm-beige-light dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-light"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] text-alm-teal font-medium uppercase tracking-wide mb-1 block">
              Fecha de salida
            </label>
            <input
              type="date"
              className="w-full border border-alm-beige-mid dark:border-gray-600 rounded-md px-3 py-2 text-[13px] bg-alm-beige-light dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-light"
            />
          </div>
          <div className="flex-1">
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
            <button className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-alm-teal text-white rounded-md px-8 py-2 text-[13px] font-medium hover:bg-alm-mid transition h-[38px]">
              <IconSearch size={16} /> Buscar
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN DEL CATÁLOGO (Inyectamos el Componente Cliente) */}
      <section className="bg-white dark:bg-gray-900 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
            <h2 className="text-[20px] font-bold text-alm-dark dark:text-white flex items-center gap-2">
              <IconMapPin className="text-alm-teal" /> Destinos Populares
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 bg-alm-teal text-white text-[12px] rounded-full cursor-pointer font-medium">
                Todos
              </span>
              <span className="px-4 py-1.5 border border-alm-beige-mid dark:border-gray-700 text-alm-mid dark:text-gray-300 text-[12px] rounded-full cursor-pointer hover:bg-alm-beige-light dark:hover:bg-gray-800 transition">
                Tradicional
              </span>
              <span className="px-4 py-1.5 border border-alm-beige-mid dark:border-gray-700 text-alm-mid dark:text-gray-300 text-[12px] rounded-full cursor-pointer hover:bg-alm-beige-light dark:hover:bg-gray-800 transition">
                Dorado
              </span>
              <span className="px-4 py-1.5 border border-alm-beige-mid dark:border-gray-700 text-alm-mid dark:text-gray-300 text-[12px] rounded-full cursor-pointer hover:bg-alm-beige-light dark:hover:bg-gray-800 transition">
                Diamante
              </span>
            </div>
          </div>

          {/* AQUÍ ESTÁ LA MAGIA INTERACTIVA */}
          <CatalogoCliente destinos={destinos || []} />

          {/* BANNER MAPA INTERACTIVO */}
          <div className="mt-10 bg-gradient-to-br from-alm-beige to-alm-pastel dark:from-gray-800 dark:to-gray-700 rounded-xl h-24 flex items-center justify-center border border-alm-beige-mid dark:border-gray-600 text-[15px] font-bold text-alm-mid dark:text-white gap-2 cursor-pointer shadow-sm hover:shadow-md transition">
            <IconMap2 size={24} className="text-alm-teal" /> Explorar Mapa
            Interactivo
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-alm-dark py-8 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center md:items-start border-b border-white/10 pb-6 mb-4">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <IconPlaneDeparture className="text-alm-pastel w-7 h-7" />
            <div className="flex flex-col leading-none">
              <span className="text-[12px] text-alm-pastel italic font-serif">
                Travel
              </span>
              <span className="text-[16px] font-medium text-white tracking-wide">
                ALMARÉ
              </span>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[11px]">
          <p className="text-white/50">© 2026 Travel Almaré</p>
          <div className="flex items-center gap-1.5 text-alm-pastel">
            <IconLock size={14} /> HTTPS Seguro
          </div>
        </div>
      </footer>
    </main>
  );
}
