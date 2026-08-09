"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import { IconPhoneCall, IconSend, IconX } from "@tabler/icons-react";
import mapAnimation from "@/public/animations/travel-map.json";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { storeContactRequest } from "@/lib/site-settings";
import type { ContactRequest, SiteSettings } from "@/lib/types";

export default function ContactCallbackWidget({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    const openContactForm = () => {
      setOpen(true);
      setSent(false);
      setError("");
    };
    window.addEventListener("almare:abrir-contacto", openContactForm);
    return () =>
      window.removeEventListener("almare:abrir-contacto", openContactForm);
  }, []);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSending(true);
    setError("");
    const form = new FormData(formElement);
    const request: ContactRequest = {
      id: crypto.randomUUID(),
      nombre: String(form.get("nombre") ?? "").trim(),
      telefono: String(form.get("telefono") ?? "").trim(),
      creado_en: new Date().toISOString(),
      estado: "nueva",
    };
    try {
      const { error: insertError } = await supabase.from("solicitudes_contacto").insert(request);
      if (insertError) {
        setError("No pudimos enviar tu solicitud. Verifica tu conexión e inténtalo nuevamente.");
        return;
      }
      storeContactRequest(request);
      setSent(true);
      formElement.reset();
    } catch {
      setError("No pudimos enviar tu solicitud. Verifica tu conexión e inténtalo nuevamente.");
    } finally {
      setSending(false);
    }
  }

  return <>
    <button type="button" onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)} onFocus={() => setExpanded(true)} onBlur={() => setExpanded(false)} onClick={() => { setOpen(true); setSent(false); }} className={`group fixed bottom-4 left-4 z-50 flex h-24 max-w-[calc(100vw-2rem)] items-center overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-alm-teal to-alm-mid text-white shadow-2xl transition-[width,transform] duration-500 dark:border-alm-dark sm:bottom-7 sm:left-7 sm:h-28 ${expanded ? "w-[min(26rem,calc(100vw-2rem))] -translate-y-1" : "w-24 sm:w-28"}`} aria-label={settings.contactPrompt}>
      <span className="flex h-full w-[5.5rem] shrink-0 items-center justify-center bg-white/95 p-1 sm:w-[6.75rem]"><Lottie animationData={mapAnimation} loop autoplay className="h-20 w-20 sm:h-24 sm:w-24" aria-hidden /></span>
      <span className={`min-w-0 flex-1 px-3 text-left transition-opacity delay-100 duration-300 sm:px-4 ${expanded ? "opacity-100" : "opacity-0"}`}><b className="block text-sm leading-tight sm:text-base">{settings.contactPrompt}</b><span className="mt-1 block text-[11px] leading-tight text-white/85 sm:text-xs">Déjanos tu número y te llamamos</span></span>
    </button>

    {open && <div className="fixed inset-0 z-[2300] flex items-center justify-center bg-alm-dark/75 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="callback-title" className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-[#133545] sm:p-9">
        <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar formulario" className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-alm-dark"><IconX /></button>
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-alm-teal/15 text-alm-teal"><IconPhoneCall size={30} /></span>
        <h2 id="callback-title" className="mt-5 text-2xl font-black">{settings.contactPrompt}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-alm-beige-mid">Déjanos tus datos y el equipo de Travel Almaré se comunicará contigo.</p>
        {sent ? <div className="mt-6 rounded-2xl bg-emerald-50 p-5 text-emerald-700"><p className="font-black">Solicitud recibida</p><p className="mt-1 text-sm">Nos pondremos en contacto contigo lo antes posible.</p><button type="button" onClick={() => setOpen(false)} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white">Cerrar</button></div> : <form onSubmit={submitRequest} className="mt-6 space-y-4">
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <label className="block text-[11px] font-bold uppercase text-gray-500">Nombre completo<input name="nombre" required minLength={2} autoComplete="name" className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3.5 text-sm outline-none focus:border-alm-teal focus:ring-2 focus:ring-alm-teal/20 dark:border-alm-mid" /></label>
          <label className="block text-[11px] font-bold uppercase text-gray-500">Número telefónico<input name="telefono" type="tel" required minLength={8} autoComplete="tel" inputMode="tel" placeholder="+52 744 000 0000" className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3.5 text-sm outline-none focus:border-alm-teal focus:ring-2 focus:ring-alm-teal/20 dark:border-alm-mid" /></label>
          <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal py-3.5 font-black text-white hover:bg-alm-mid disabled:opacity-50"><IconSend size={19} /> {sending ? "Enviando…" : "Solicitar llamada"}</button>
        </form>}
      </section>
    </div>}
  </>;
}
