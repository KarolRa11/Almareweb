"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconArrowUp,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconDeviceFloppy,
  IconMail,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { DEFAULT_SOCIAL_LINKS, normalizeSocialUrl, parseSocialLinks, readStoredSocialLinks, storeSocialLinks, validateSocialUrl } from "@/lib/social-links";
import type { SocialLink, SocialNetwork } from "@/lib/types";

function NetworkIcon({ id }: { id: SocialNetwork }) {
  if (id === "whatsapp") return <IconBrandWhatsapp size={24} />;
  if (id === "facebook") return <IconBrandFacebook size={24} />;
  if (id === "tiktok") return <IconBrandTiktok size={24} />;
  if (id === "instagram") return <IconBrandInstagram size={24} />;
  return <IconMail size={24} />;
}

export default function SocialLinksManager() {
  const [links, setLinks] = useState<SocialLink[]>(DEFAULT_SOCIAL_LINKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storageMode, setStorageMode] = useState<"supabase" | "local">("supabase");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "redes_sociales")
      .maybeSingle()
      .then(({ data, error }: { data: { valor: unknown } | null; error: { message: string } | null }) => {
        if (!active) return;
        if (data?.valor) setLinks(parseSocialLinks(data.valor));
        if (error) {
          setStorageMode("local");
          const stored = readStoredSocialLinks();
          if (stored) setLinks(stored);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [supabase]);

  function updateLink(id: SocialNetwork, patch: Partial<SocialLink>) {
    setLinks((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
    setMessage(null);
  }

  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    setLinks((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, order) => ({ ...item, order: order + 1 }));
    });
    setMessage(null);
  }

  async function saveLinks() {
    const normalized = links.map((item, index) => ({
      ...item,
      url: normalizeSocialUrl(item.id, item.url),
      order: index + 1,
    }));
    const invalid = normalized.find((item) => validateSocialUrl(item.id, item.url));
    if (invalid) {
      setMessage({ type: "error", text: `${invalid.label}: ${validateSocialUrl(invalid.id, invalid.url)}` });
      return;
    }

    setSaving(true);
    setMessage(null);
    let databaseError: { message: string } | null = null;
    if (storageMode === "supabase") {
      const result = await supabase.from("configuracion").upsert(
        { clave: "redes_sociales", valor: normalized, actualizado_en: new Date().toISOString() },
        { onConflict: "clave" },
      );
      databaseError = result.error;
      if (databaseError) setStorageMode("local");
    }
    storeSocialLinks(normalized);
    setLinks(normalized);
    setMessage({
      type: "ok",
      text: databaseError || storageMode === "local"
        ? "Enlaces guardados en este navegador. Ya puedes comprobarlos en la página de inicio."
        : "Contacto actualizado. El nuevo orden y los enlaces ya están publicados.",
    });
    router.refresh();
    setSaving(false);
  }

  return (
    <section id="contacto" className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-5 md:px-6">
        <h2 className="flex items-center gap-2 font-black"><IconBrandWhatsapp className="text-alm-teal" size={24} /> Contacto y redes sociales</h2>
        <p className="mt-1 text-sm text-gray-500">Ordena los medios de contacto, activa los que quieras mostrar y cambia sus enlaces.</p>
        {storageMode === "local" && <p className="mt-2 text-xs font-semibold text-amber-700">Guardado local activo: funciona en este navegador. Para compartir los cambios con todos los dispositivos, instala la migración de Supabase.</p>}
      </div>

      <div className="space-y-3 p-4 md:p-6">
        {loading ? <p className="py-6 text-center text-sm text-gray-500">Cargando configuración…</p> : links.map((item, index) => (
          <article key={item.id} className="grid gap-4 rounded-2xl border p-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-alm-teal/10 text-alm-teal"><NetworkIcon id={item.id} /></span>
              <div><p className="font-black">{item.label}</p><p className="text-xs text-gray-400">Posición {index + 1}</p></div>
            </div>
            <label className="text-[11px] font-bold uppercase text-gray-500">
              {item.id === "email" ? "Correo" : item.id === "whatsapp" ? "Número o enlace de WhatsApp" : "Enlace completo"}
              <input
                value={item.url}
                onChange={(event) => updateLink(item.id, { url: event.target.value })}
                placeholder={item.id === "email" ? "contacto@almare.com" : item.id === "whatsapp" ? "+52 744 000 0000" : `https://${item.id}.com/tu-cuenta`}
                inputMode={item.id === "email" ? "email" : "url"}
                className="mt-1 w-full rounded-xl border px-4 py-3 text-sm normal-case outline-none focus:border-alm-teal focus:ring-2 focus:ring-alm-teal/20"
              />
            </label>
            <div className="flex items-center justify-between gap-2 lg:justify-end">
              <label className="mr-2 flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-600"><input type="checkbox" checked={item.active} onChange={(event) => updateLink(item.id, { active: event.target.checked })} className="h-4 w-4 accent-alm-teal" /> Visible</label>
              <button type="button" onClick={() => moveLink(index, -1)} disabled={index === 0} aria-label={`Subir ${item.label}`} className="rounded-lg border p-2 text-alm-mid disabled:cursor-not-allowed disabled:opacity-30"><IconArrowUp size={18} /></button>
              <button type="button" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1} aria-label={`Bajar ${item.label}`} className="rounded-lg border p-2 text-alm-mid disabled:cursor-not-allowed disabled:opacity-30"><IconArrowDown size={18} /></button>
            </div>
          </article>
        ))}

        {message && <p role="status" className={`rounded-xl border p-4 text-sm font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</p>}
        <div className="flex justify-end pt-2"><button type="button" onClick={saveLinks} disabled={loading || saving} className="flex items-center gap-2 rounded-xl bg-alm-teal px-6 py-3 font-black text-white transition hover:bg-alm-mid disabled:opacity-50"><IconDeviceFloppy size={20} /> {saving ? "Guardando…" : "Guardar y publicar"}</button></div>
      </div>
    </section>
  );
}
