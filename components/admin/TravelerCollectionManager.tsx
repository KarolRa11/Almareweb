"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowDown,
  IconArrowUp,
  IconDeviceFloppy,
  IconPhotoUp,
  IconPlus,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { DEFAULT_TRAVELER_COLLECTION, parseTravelerCollection } from "@/lib/traveler-collection";
import type { TravelerCollection, TravelerPackage } from "@/lib/types";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function newPackage(): TravelerPackage {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `paquete-${Date.now()}`;
  return {
    id,
    level: "Nuevo nivel",
    name: "Nueva experiencia",
    price: 0,
    currency: "MXN",
    priceNote: "Precio de referencia",
    shortDescription: "",
    description: "",
    imageUrl: null,
    features: [],
    badge: null,
    accent: "#4a9b8e",
  };
}

export default function TravelerCollectionManager() {
  const [collection, setCollection] = useState<TravelerCollection>(DEFAULT_TRAVELER_COLLECTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void supabase.from("configuracion").select("valor").eq("clave", "apariencia_sitio").maybeSingle().then(({ data, error }: { data: { valor: unknown } | null; error: { message: string } | null }) => {
      if (!active) return;
      const value = data?.valor && typeof data.valor === "object" ? data.valor as { travelerCollection?: unknown } : null;
      if (value?.travelerCollection) setCollection(parseTravelerCollection(value.travelerCollection));
      if (error) setMessage({ type: "error", text: `No se pudo cargar la colección: ${error.message}` });
      setLoading(false);
    });
    return () => { active = false; };
  }, [supabase]);

  function updateCollection<K extends keyof TravelerCollection>(key: K, value: TravelerCollection[K]) {
    setCollection((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  function updatePackage(id: string, patch: Partial<TravelerPackage>) {
    setCollection((current) => ({
      ...current,
      packages: current.packages.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
    setMessage(null);
  }

  function movePackage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= collection.packages.length) return;
    setCollection((current) => {
      const packages = [...current.packages];
      [packages[index], packages[target]] = [packages[target], packages[index]];
      return { ...current, packages };
    });
  }

  function removePackage(item: TravelerPackage) {
    if (!window.confirm(`¿Eliminar ${item.name} de la colección? El cambio se publicará cuando guardes.`)) return;
    setCollection((current) => ({ ...current, packages: current.packages.filter((entry) => entry.id !== item.id) }));
  }

  async function uploadImage(item: TravelerPackage, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_IMAGE_SIZE) {
      setMessage({ type: "error", text: "La portada debe ser una imagen de máximo 8 MB." });
      event.target.value = "";
      return;
    }
    setUploadingId(item.id);
    setMessage(null);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeId = item.id.replace(/[^a-zA-Z0-9-_]/g, "-");
    const { data, error } = await supabase.storage.from("destinos").upload(`coleccion-viajeros/${safeId}-${Date.now()}.${extension}`, file, { cacheControl: "3600" });
    if (error || !data) {
      setMessage({ type: "error", text: `No se pudo subir la imagen: ${error?.message || "error inesperado"}` });
    } else {
      const imageUrl = supabase.storage.from("destinos").getPublicUrl(data.path).data.publicUrl;
      updatePackage(item.id, { imageUrl });
      setMessage({ type: "ok", text: "Imagen cargada. Guarda la colección para publicarla." });
    }
    setUploadingId(null);
    event.target.value = "";
  }

  async function saveCollection() {
    if (!collection.title.trim() || !collection.description.trim()) {
      setMessage({ type: "error", text: "Completa el título y la descripción de la sección." });
      return;
    }
    if (collection.packages.length === 0) {
      setMessage({ type: "error", text: "Agrega al menos un paquete antes de publicar." });
      return;
    }
    const invalid = collection.packages.find((item) => !item.name.trim() || !item.level.trim() || !Number.isFinite(item.price) || item.price < 0);
    if (invalid) {
      setMessage({ type: "error", text: "Cada tarjeta necesita nivel, nombre y un precio válido." });
      return;
    }
    setSaving(true);
    setMessage(null);
    const normalized: TravelerCollection = {
      ...collection,
      eyebrow: collection.eyebrow.trim(),
      title: collection.title.trim(),
      description: collection.description.trim(),
      disclaimer: collection.disclaimer?.trim() || null,
      packages: collection.packages.map((item) => ({
        ...item,
        level: item.level.trim(),
        name: item.name.trim(),
        currency: item.currency.trim().toUpperCase() || "MXN",
        priceNote: item.priceNote?.trim() || null,
        shortDescription: item.shortDescription.trim(),
        description: item.description.trim(),
        badge: item.badge?.trim() || null,
        features: item.features.map((feature) => feature.trim()).filter(Boolean),
      })),
    };
    const currentResult = await supabase.from("configuracion").select("valor").eq("clave", "apariencia_sitio").maybeSingle();
    const currentValue = currentResult.data?.valor && typeof currentResult.data.valor === "object" ? currentResult.data.valor as Record<string, unknown> : {};
    const { error } = await supabase.from("configuracion").upsert(
      { clave: "apariencia_sitio", valor: { ...currentValue, travelerCollection: normalized }, actualizado_en: new Date().toISOString() },
      { onConflict: "clave" },
    );
    if (error) {
      setMessage({ type: "error", text: `No se pudo publicar la colección: ${error.message}` });
    } else {
      setCollection(normalized);
      setMessage({ type: "ok", text: "Colección publicada correctamente en la página principal." });
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <section id="perfiles-viajero" className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-gray-50 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div><h2 className="flex items-center gap-2 font-black"><IconSparkles className="text-alm-teal" /> Perfiles de viajero</h2><p className="mt-1 text-sm text-gray-500">Administra el contenido, orden, precios e imágenes de la colección de paquetes.</p></div>
        <button type="button" onClick={() => updateCollection("packages", [...collection.packages, newPackage()])} className="flex items-center justify-center gap-2 rounded-xl border border-alm-teal bg-white px-4 py-2.5 text-sm font-black text-alm-mid hover:bg-alm-teal/10"><IconPlus size={18} /> Agregar tarjeta</button>
      </div>
      {loading ? <p className="p-10 text-center text-sm text-gray-500">Cargando colección…</p> : <div className="space-y-7 p-4 md:p-6">
        <div className="grid gap-4 rounded-2xl border bg-gray-50 p-4 lg:grid-cols-2">
          <label className="text-[11px] font-black uppercase text-gray-500">Texto superior<input value={collection.eyebrow} onChange={(event) => updateCollection("eyebrow", event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
          <label className="text-[11px] font-black uppercase text-gray-500">Título de la sección<input value={collection.title} onChange={(event) => updateCollection("title", event.target.value)} className="mt-1 w-full rounded-xl border bg-white px-4 py-3 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
          <label className="text-[11px] font-black uppercase text-gray-500 lg:col-span-2">Descripción<textarea value={collection.description} onChange={(event) => updateCollection("description", event.target.value)} rows={3} className="mt-1 w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
          <label className="text-[11px] font-black uppercase text-gray-500 lg:col-span-2">Aviso comercial<textarea value={collection.disclaimer ?? ""} onChange={(event) => updateCollection("disclaimer", event.target.value)} rows={2} className="mt-1 w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
        </div>

        <div className="space-y-5">{collection.packages.map((item, index) => (
          <article key={item.id} className="overflow-hidden rounded-2xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50 p-4">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-alm-teal text-sm font-black text-white">{index + 1}</span><div><p className="font-black">{item.name || "Tarjeta sin nombre"}</p><p className="text-xs text-gray-400">{item.level || "Nivel pendiente"}</p></div></div>
              <div className="flex gap-2"><button type="button" onClick={() => movePackage(index, -1)} disabled={index === 0} aria-label={`Subir ${item.name}`} className="rounded-lg border bg-white p-2 text-alm-mid disabled:opacity-30"><IconArrowUp size={18} /></button><button type="button" onClick={() => movePackage(index, 1)} disabled={index === collection.packages.length - 1} aria-label={`Bajar ${item.name}`} className="rounded-lg border bg-white p-2 text-alm-mid disabled:opacity-30"><IconArrowDown size={18} /></button><button type="button" onClick={() => removePackage(item)} aria-label={`Eliminar ${item.name}`} className="rounded-lg border border-red-200 bg-white p-2 text-red-500 hover:bg-red-50"><IconTrash size={18} /></button></div>
            </div>
            <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[220px_1fr]">
              <div>
                <div className="relative grid h-48 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-alm-teal to-alm-dark text-white">{item.imageUrl ? <Image unoptimized fill sizes="220px" src={item.imageUrl} alt={`Vista previa de ${item.name}`} className="object-cover" /> : <IconSparkles size={42} className="opacity-70" />}</div>
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-alm-mid px-4 py-3 text-sm font-black text-white"><IconPhotoUp size={18} /> {uploadingId === item.id ? "Subiendo…" : item.imageUrl ? "Cambiar imagen" : "Subir imagen"}<input type="file" accept="image/*" disabled={uploadingId !== null} onChange={(event) => void uploadImage(item, event)} className="hidden" /></label>
                {item.imageUrl && <button type="button" onClick={() => updatePackage(item.id, { imageUrl: null })} className="mt-2 w-full text-xs font-bold text-red-500">Quitar imagen</button>}
              </div>
              <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-[10px] font-black uppercase text-gray-500">Nivel<input value={item.level} onChange={(event) => updatePackage(item.id, { level: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500">Nombre<input value={item.name} onChange={(event) => updatePackage(item.id, { name: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500">Distintivo<input value={item.badge ?? ""} onChange={(event) => updatePackage(item.id, { badge: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500">Precio<input type="number" min="0" step="1" value={item.price} onChange={(event) => updatePackage(item.id, { price: Number(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500">Moneda<input value={item.currency} maxLength={3} onChange={(event) => updatePackage(item.id, { currency: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal uppercase outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500">Color<input type="color" value={item.accent || "#4a9b8e"} onChange={(event) => updatePackage(item.id, { accent: event.target.value })} className="mt-1 h-[42px] w-full cursor-pointer rounded-xl border bg-white p-1" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2">Leyenda del precio<input value={item.priceNote ?? ""} onChange={(event) => updatePackage(item.id, { priceNote: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2 lg:col-span-3">Descripción corta<textarea value={item.shortDescription} onChange={(event) => updatePackage(item.id, { shortDescription: event.target.value })} rows={2} className="mt-1 w-full resize-y rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2 lg:col-span-3">Descripción detallada<textarea value={item.description} onChange={(event) => updatePackage(item.id, { description: event.target.value })} rows={3} className="mt-1 w-full resize-y rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
                <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2 lg:col-span-3">Beneficios <span className="font-normal normal-case text-gray-400">(uno por línea)</span><textarea value={item.features.join("\n")} onChange={(event) => updatePackage(item.id, { features: event.target.value.split("\n") })} rows={4} className="mt-1 w-full resize-y rounded-xl border px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-alm-teal" /></label>
              </div>
            </div>
          </article>
        ))}</div>

        {message && <p role="status" className={`rounded-xl border p-4 text-sm font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{message.text}</p>}
        <div className="flex justify-end"><button type="button" onClick={() => void saveCollection()} disabled={saving || uploadingId !== null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal px-6 py-3.5 font-black text-white hover:bg-alm-mid disabled:opacity-50 sm:w-auto"><IconDeviceFloppy size={20} /> {saving ? "Publicando…" : "Guardar y publicar"}</button></div>
      </div>}
    </section>
  );
}
