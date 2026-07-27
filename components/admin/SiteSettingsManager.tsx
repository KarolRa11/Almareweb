"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { IconDeviceFloppy, IconPalette, IconPhoneCall, IconPhotoUp, IconRefresh } from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  CONTACT_REQUESTS_UPDATED_EVENT,
  DEFAULT_SITE_SETTINGS,
  parseSiteSettings,
  readStoredContactRequests,
  readStoredSiteSettings,
  storeSiteSettings,
} from "@/lib/site-settings";
import type { ContactRequest, SiteSettings } from "@/lib/types";

export default function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  async function loadRequests() {
    const local = readStoredContactRequests();
    const { data } = await supabase.from("solicitudes_contacto").select("*").order("creado_en", { ascending: false });
    const merged = [...((data ?? []) as ContactRequest[]), ...local];
    setRequests(Array.from(new Map(merged.map((item) => [item.id, item])).values()).sort((a, b) => b.creado_en.localeCompare(a.creado_en)));
  }

  useEffect(() => {
    let active = true;
    void Promise.all([
      supabase.from("configuracion").select("valor").eq("clave", "apariencia_sitio").maybeSingle(),
      supabase.from("solicitudes_contacto").select("*").order("creado_en", { ascending: false }),
    ]).then(([configResult, requestResult]) => {
      if (!active) return;
      const storedSettings = readStoredSiteSettings();
      setSettings(storedSettings ?? (configResult.data?.valor ? parseSiteSettings(configResult.data.valor) : DEFAULT_SITE_SETTINGS));
      const local = readStoredContactRequests();
      const remote = (requestResult.data ?? []) as ContactRequest[];
      setRequests(Array.from(new Map([...remote, ...local].map((item) => [item.id, item])).values()).sort((a, b) => b.creado_en.localeCompare(a.creado_en)));
      setLoading(false);
    });
    const syncRequests = () => void loadRequests();
    window.addEventListener(CONTACT_REQUESTS_UPDATED_EVENT, syncRequests);
    return () => { active = false; window.removeEventListener(CONTACT_REQUESTS_UPDATED_EVENT, syncRequests); };
    // El cliente de Supabase es estable durante la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  async function selectLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 1.5 * 1024 * 1024) {
      setMessage({ type: "error", text: "El icono debe ser una imagen de máximo 1.5 MB." });
      event.target.value = "";
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    update("logoUrl", dataUrl);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    storeSiteSettings(settings);
    const { error } = await supabase.from("configuracion").upsert(
      { clave: "apariencia_sitio", valor: settings, actualizado_en: new Date().toISOString() },
      { onConflict: "clave" },
    );
    setMessage({
      type: "ok",
      text: error
        ? "Diseño guardado en este navegador. Ya puedes verlo en el inicio."
        : "Diseño, logo y contenido publicados correctamente.",
    });
    setSaving(false);
  }

  return <div id="apariencia" className="scroll-mt-24 space-y-8">
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-5 md:px-6"><h2 className="flex items-center gap-2 font-black"><IconPalette className="text-alm-teal" /> Marca y apariencia</h2><p className="mt-1 text-sm text-gray-500">Personaliza el navbar, el degradado del carrusel y el contenido de la empresa.</p></div>
      {loading ? <p className="p-8 text-center text-sm text-gray-500">Cargando configuración…</p> : <div className="grid gap-7 p-4 md:p-6 xl:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-2xl border p-4"><p className="text-xs font-black uppercase text-gray-500">Logo principal</p><div className="mt-3 flex items-center gap-4">{settings.logoUrl ? <Image unoptimized src={settings.logoUrl} alt="Vista previa del logo" width={76} height={60} className="h-16 w-20 rounded-xl object-contain" /> : <span className="flex h-16 w-20 items-center justify-center rounded-xl bg-alm-teal/10 text-alm-teal"><IconPalette size={32} /></span>}<div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-alm-mid px-4 py-2.5 text-sm font-bold text-white"><IconPhotoUp size={18} /> Elegir imagen<input type="file" accept="image/*" onChange={selectLogo} className="hidden" /></label>{settings.logoUrl && <button type="button" onClick={() => update("logoUrl", "")} className="ml-2 text-xs font-bold text-red-500">Usar icono original</button>}<p className="mt-2 text-xs text-gray-400">Se usa en el navbar, Quiénes somos y pago · PNG, JPG, WebP o SVG · máximo 1.5 MB</p></div></div></div>
          <label className="block text-xs font-black uppercase text-gray-500">Título de la pestaña<input value={settings.aboutTitle} onChange={(event) => update("aboutTitle", event.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3 text-sm normal-case outline-none focus:border-alm-teal" /></label>
          <label className="block text-xs font-black uppercase text-gray-500">Texto de Quiénes somos<textarea value={settings.aboutText} onChange={(event) => update("aboutText", event.target.value)} rows={5} className="mt-1 w-full resize-y rounded-xl border px-4 py-3 text-sm font-normal normal-case leading-relaxed outline-none focus:border-alm-teal" /></label>
          <label className="block text-xs font-black uppercase text-gray-500">Texto del botón flotante<input value={settings.contactPrompt} onChange={(event) => update("contactPrompt", event.target.value)} className="mt-1 w-full rounded-xl border px-4 py-3 text-sm normal-case outline-none focus:border-alm-teal" /></label>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border p-5"><p className="text-xs font-black uppercase text-gray-500">Degradado sobre las imágenes del carrusel</p><div className="mt-4 grid grid-cols-2 gap-4"><label className="text-xs font-bold text-gray-500">Color inicial<input type="color" value={settings.gradientStart} onChange={(event) => update("gradientStart", event.target.value)} className="mt-1 h-12 w-full cursor-pointer rounded-lg border bg-white p-1" /></label><label className="text-xs font-bold text-gray-500">Color final<input type="color" value={settings.gradientEnd} onChange={(event) => update("gradientEnd", event.target.value)} className="mt-1 h-12 w-full cursor-pointer rounded-lg border bg-white p-1" /></label></div><label className="mt-5 block text-xs font-bold text-gray-500">Intensidad: {settings.gradientOpacity}%<input type="range" min="0" max="100" value={settings.gradientOpacity} onChange={(event) => update("gradientOpacity", Number(event.target.value))} className="mt-2 w-full accent-alm-teal" /></label><div className="mt-5 h-32 rounded-2xl" style={{ background: `linear-gradient(135deg, ${settings.gradientStart}, ${settings.gradientEnd})`, opacity: settings.gradientOpacity / 100 }} /></div>
          {message && <p role="status" className={`rounded-xl border p-4 text-sm font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</p>}
          <button type="button" onClick={saveSettings} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal py-3.5 font-black text-white hover:bg-alm-mid disabled:opacity-50"><IconDeviceFloppy size={20} /> {saving ? "Guardando…" : "Guardar apariencia"}</button>
        </div>
      </div>}
    </section>

    <section id="solicitudes-contacto" className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-5 md:px-6"><div><h2 className="flex items-center gap-2 font-black"><IconPhoneCall className="text-alm-teal" /> Solicitudes de contacto</h2><p className="mt-1 text-sm text-gray-500">Personas que solicitaron que Travel Almaré les llame.</p></div><button type="button" onClick={loadRequests} aria-label="Actualizar solicitudes" className="rounded-xl border bg-white p-2.5 text-alm-mid"><IconRefresh size={19} /></button></div>
      {requests.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">Todavía no hay solicitudes.</p> : <div className="divide-y">{requests.map((request) => <article key={request.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center md:px-6"><div><p className="font-black">{request.nombre}</p><p className="text-xs text-gray-400">{new Date(request.creado_en).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p></div><a href={`tel:${request.telefono.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 rounded-xl bg-alm-teal/10 px-4 py-2.5 text-sm font-black text-alm-mid"><IconPhoneCall size={18} /> {request.telefono}</a></article>)}</div>}
    </section>
  </div>;
}
