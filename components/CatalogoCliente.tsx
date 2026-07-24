"use client";

import { useEffect, useMemo, useState } from "react";
import { IconAlertCircle, IconCalendarEvent, IconCheck, IconChevronLeft, IconChevronRight, IconDiscount, IconMaximize, IconX } from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Destino } from "@/lib/types";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import Image from "next/image";
import { destinationPolicy, DESTINATION_RULES_STORAGE_KEY, DESTINATION_RULES_UPDATED_EVENT, mergeStoredDestinationRules } from "@/lib/destination-rules";

const fallback = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200";
const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

export default function CatalogoCliente({ destinos, fechaInicial = "", viajerosIniciales = 1 }: { destinos: Destino[]; fechaInicial?: string; viajerosIniciales?: number }) {
  const [seleccionado, setSeleccionado] = useState<Destino | null>(null);
  const [booking, setBooking] = useState(false);
  const [exitosa, setExitosa] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authNotice, setAuthNotice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [modalIndex, setModalIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [destinosMostrados, setDestinosMostrados] = useState(destinos);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    void supabase.auth.getUser().then((result: { data: { user: User | null } }) => setUser(result.data.user));
    const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const sync = () => setDestinosMostrados(mergeStoredDestinationRules(destinos));
    const timer = window.setTimeout(sync, 0);
    const storage = (event: StorageEvent) => { if (event.key === DESTINATION_RULES_STORAGE_KEY) sync(); };
    window.addEventListener("storage", storage);
    window.addEventListener(DESTINATION_RULES_UPDATED_EVENT, sync);
    return () => { window.clearTimeout(timer); window.removeEventListener("storage", storage); window.removeEventListener(DESTINATION_RULES_UPDATED_EVENT, sync); };
  }, [destinos]);

  function fotos(destino: Destino) {
    return (destino.imagenes?.length ? destino.imagenes : [destino.imagen_principal || fallback]).filter(Boolean) as string[];
  }
  function precio(destino: Destino) { return Number(destino.precio) * (1 - Number(destino.descuento || 0) / 100); }
  function cerrar() { setSeleccionado(null); setBooking(false); setExitosa(false); setAuthNotice(false); setError(""); setModalIndex(0); setFullscreen(false); }
  function mover(delta: number) { if (!seleccionado) return; const total = fotos(seleccionado).length; setModalIndex((i) => (i + delta + total) % total); }

  async function reservar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !seleccionado) { setAuthNotice(true); return; }
    setSubmitting(true); setError("");
    const form = new FormData(e.currentTarget);
    const pasajeros = Number(form.get("pasajeros"));
    // La base instalada originalmente tiene destinos con id bigint y una columna
    // destino_id UUID incompatible. Conservamos el destino por título hasta que se
    // aplique supabase/schema.sql, que normaliza la FK como bigint.
    const payload = {
      titulo_destino: seleccionado.titulo,
      nombre_cliente: String(form.get("nombre") || "").trim(), email_cliente: user.email,
      telefono: String(form.get("telefono") || "").trim(), fecha_viaje: form.get("fecha"),
      pasajeros, total_pagar: precio(seleccionado) * pasajeros,
      usuario_id: user.id,
      precio_unitario: precio(seleccionado),
    };
    let { error: insertError } = await supabase.from("reservaciones").insert(payload);
    if (insertError && (insertError.message.includes("usuario_id") || insertError.message.includes("precio_unitario"))) {
      const { usuario_id: _userId, precio_unitario: _unit, ...legacyPayload } = payload;
      void _userId; void _unit;
      const retry = await supabase.from("reservaciones").insert(legacyPayload);
      insertError = retry.error;
    }
    if (insertError) setError("No pudimos registrar la reserva. Verifica los datos e inténtalo nuevamente."); else setExitosa(true);
    setSubmitting(false);
  }

  function iniciarReserva() {
    if (user) {
      setBooking(true);
      return;
    }
    setAuthNotice(true);
    window.dispatchEvent(new Event("almare:abrir-autenticacion"));
  }

  return <>
    {destinosMostrados.length === 0 ? <div className="rounded-2xl border border-dashed border-alm-beige-mid px-6 py-14 text-center dark:border-alm-mid"><IconAlertCircle className="mx-auto mb-3 text-alm-teal" size={32} /><h3 className="font-black">No encontramos destinos</h3><p className="mt-1 text-sm text-gray-500 dark:text-alm-beige-mid">Prueba otra búsqueda o cambia el filtro seleccionado.</p></div> :
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {destinosMostrados.map((d) => <article key={d.id} className="group flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-alm-beige-mid bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-[#255369] dark:bg-[#133545]">
        <button onClick={() => setSeleccionado(d)} className="relative h-56 overflow-hidden bg-alm-dark text-left" aria-label={`Ver detalles de ${d.titulo}`}><Image unoptimized fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" src={d.imagen_principal || fotos(d)[0]} alt={d.titulo} className="object-cover transition duration-700 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-alm-dark/70 via-transparent to-transparent" />{Number(d.descuento) > 0 && <span className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-black text-white shadow"><IconDiscount size={15} /> {d.descuento}% OFF</span>}</button>
        <div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-black">{d.titulo}</h3><div className="mt-2 flex flex-wrap gap-1">{(d.etiquetas || ["Familiar"]).map((tag) => <span key={tag} className="rounded-full bg-alm-teal/10 px-2 py-1 text-[10px] font-bold text-alm-mid dark:text-alm-pastel">{tag}</span>)}</div><p className={`mt-2 text-xs font-bold ${d.permite_ninos === false || Number(d.edad_minima) >= 18 ? "text-red-600" : "text-gray-500 dark:text-alm-beige-mid"}`}>{destinationPolicy(d)}</p><p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{d.descripcion}</p><div className="mt-auto flex items-end justify-between border-t border-alm-beige-mid pt-4 dark:border-alm-dark"><div>{Number(d.descuento) > 0 && <span className="block text-[11px] font-bold text-red-500 line-through">Antes: {money.format(d.precio)}</span>}<span className={`block text-xl font-black ${Number(d.descuento) > 0 ? "text-red-600" : "text-alm-mid dark:text-alm-pastel"}`}>{Number(d.descuento) > 0 && <small className="mr-1 text-[10px] uppercase">Ahora:</small>}{money.format(precio(d))}</span><span className="text-[10px] uppercase text-gray-400">por persona</span></div><button onClick={() => setSeleccionado(d)} className="rounded-xl bg-alm-teal px-5 py-2.5 text-xs font-bold text-white transition hover:bg-alm-mid">Ver detalles</button></div></div>
      </article>)}
    </div>}

    {seleccionado && <div role="dialog" aria-modal="true" aria-label={`Detalles de ${seleccionado.titulo}`} className="fixed inset-0 z-50 flex items-center justify-center bg-alm-dark/90 p-3 backdrop-blur-md" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}>
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-alm-dark md:flex-row">
        <button onClick={cerrar} aria-label="Cerrar" className="absolute right-4 top-4 z-30 rounded-full bg-black/60 p-2.5 text-white hover:bg-black"><IconX size={20} /></button>
        <div className="relative h-56 bg-black md:h-auto md:w-1/2"><Image unoptimized fill sizes="(max-width: 768px) 100vw, 50vw" src={fotos(seleccionado)[modalIndex]} alt={`${seleccionado.titulo}, fotografía ${modalIndex + 1}`} className="object-cover" />{fotos(seleccionado).length > 1 && <><button onClick={() => mover(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 rounded-full bg-black/50 p-2 text-white"><IconChevronLeft /></button><button onClick={() => mover(1)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 rounded-full bg-black/50 p-2 text-white"><IconChevronRight /></button></>}<button onClick={() => setFullscreen(true)} aria-label="Ampliar fotografía" className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white"><IconMaximize size={20} /></button><span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs text-white">{modalIndex + 1} / {fotos(seleccionado).length}</span></div>
        <div className="w-full overflow-y-auto p-6 md:w-1/2 md:p-9">
          {!booking ? <><h2 className="pr-10 text-2xl font-black md:text-3xl">{seleccionado.titulo}</h2><div className="mt-3 flex flex-wrap gap-1">{(seleccionado.etiquetas || ["Familiar"]).map((tag) => <span key={tag} className="rounded-full bg-alm-teal/10 px-2 py-1 text-xs font-bold text-alm-mid dark:text-alm-pastel">{tag}</span>)}</div><p className={`mt-3 rounded-xl p-3 text-sm font-bold ${seleccionado.permite_ninos === false || Number(seleccionado.edad_minima) >= 18 ? "bg-red-50 text-red-600" : "bg-alm-teal/10 text-alm-mid dark:text-alm-pastel"}`}>{destinationPolicy(seleccionado)}</p><p className="my-5 text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">{seleccionado.descripcion}</p><div className="rounded-2xl border border-alm-beige-mid bg-alm-beige-light p-5 dark:border-alm-mid dark:bg-[#133545]"><p className="text-xs font-black uppercase text-alm-teal">Precio por persona</p>{Number(seleccionado.descuento) > 0 && <p className="font-bold text-red-500 line-through">Antes: {money.format(seleccionado.precio)}</p>}<p className={`text-4xl font-black ${Number(seleccionado.descuento) > 0 ? "text-red-600" : ""}`}>{Number(seleccionado.descuento) > 0 && <span className="mr-2 text-sm uppercase">Ahora</span>}{money.format(precio(seleccionado))}</p></div>{authNotice && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">Inicia sesión desde <strong>Mi cuenta</strong> para completar tu reserva.</div>}<button onClick={iniciarReserva} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal py-4 text-base font-black text-white shadow-lg hover:bg-alm-mid"><IconCalendarEvent /> {user ? "Reservar ahora" : "Inicia sesión para reservar"}</button></> : exitosa ? <div className="flex min-h-80 flex-col items-center justify-center text-center"><span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-alm-teal/15 text-alm-teal"><IconCheck size={42} /></span><h2 className="text-2xl font-black">¡Reserva registrada!</h2><p className="mt-2 text-sm text-gray-500 dark:text-alm-beige-mid">La encontrarás en Mi cuenta. Nuestro equipo se pondrá en contacto contigo.</p><button onClick={cerrar} className="mt-7 w-full rounded-xl bg-alm-teal py-3.5 font-bold text-white">Finalizar</button></div> :
          <form onSubmit={reservar}><h2 className="pr-10 text-2xl font-black">Finaliza tu reserva</h2><p className="mt-1 text-sm text-gray-500">{seleccionado.titulo}</p><p className={`mt-4 rounded-xl p-3 text-sm font-bold ${seleccionado.permite_ninos === false || Number(seleccionado.edad_minima) >= 18 ? "bg-red-50 text-red-600" : "bg-alm-teal/10 text-alm-mid dark:text-alm-pastel"}`}>{destinationPolicy(seleccionado)}</p>{error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase text-gray-500 sm:col-span-2">Nombre completo<input name="nombre" required minLength={2} autoComplete="name" className="mt-1 block w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid" /></label><label className="text-[10px] font-bold uppercase text-gray-500">Correo<input value={user?.email ?? ""} readOnly className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-alm-mid dark:bg-[#133545]" /></label><label className="text-[10px] font-bold uppercase text-gray-500">Teléfono<input name="telefono" required type="tel" minLength={8} autoComplete="tel" className="mt-1 block w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid" /></label><label className="text-[10px] font-bold uppercase text-gray-500">Fecha<input name="fecha" required type="date" defaultValue={fechaInicial} min={new Date().toISOString().slice(0, 10)} className="mt-1 block w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid dark:[color-scheme:dark]" /></label><label className="text-[10px] font-bold uppercase text-gray-500">Pasajeros<input name="pasajeros" required type="number" min="1" max="20" defaultValue={viajerosIniciales} className="mt-1 block w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid" /><span className="mt-1 block normal-case text-red-600">Cada niño de 3 años o más cuenta como pasajero.</span></label></div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setBooking(false)} className="rounded-xl bg-alm-beige-light px-5 py-3 font-bold dark:bg-[#133545]">Volver</button><button disabled={submitting} className="flex-1 rounded-xl bg-alm-teal py-3 font-black text-white disabled:opacity-50">{submitting ? "Registrando..." : "Confirmar reserva"}</button></div></form>}
        </div>
      </div>
    </div>}
    {fullscreen && seleccionado && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black p-4"><button onClick={() => setFullscreen(false)} className="absolute right-5 top-5 z-10 rounded-full bg-white/15 p-3 text-white" aria-label="Cerrar fotografía"><IconX /></button><div className="relative h-full w-full"><Image unoptimized fill sizes="100vw" src={fotos(seleccionado)[modalIndex]} alt={seleccionado.titulo} className="object-contain" /></div></div>}
  </>;
}
