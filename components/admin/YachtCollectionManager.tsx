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
  IconSailboat,
  IconTrash,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  DEFAULT_YACHT_COLLECTION,
  parseYachtCollection,
} from "@/lib/yacht-collection";
import type { YachtCollection, YachtListing } from "@/lib/types";

function newYacht(): YachtListing {
  return {
    id: crypto.randomUUID(),
    name: "Nuevo yate",
    description: "",
    price: 0,
    currency: "MXN",
    priceUnit: "por paseo",
    capacity: 8,
    duration: "4 horas",
    location: "Bahía de Acapulco",
    imageUrl: null,
    images: [],
    amenities: [],
    features: [],
    badge: null,
    whatsappNumber: "",
    whatsappMessage:
      "Hola, quiero cotizar el yate {nombre}. ¿Me pueden compartir disponibilidad y condiciones?",
    active: true,
  };
}

export default function YachtCollectionManager() {
  const [collection, setCollection] = useState<YachtCollection>(
    DEFAULT_YACHT_COLLECTION,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "apariencia_sitio")
      .maybeSingle()
      .then(
        ({
          data,
          error,
        }: {
          data: { valor: unknown } | null;
          error: { message: string } | null;
        }) => {
          if (!active) return;
          const value =
            data?.valor && typeof data.valor === "object"
              ? (data.valor as { yachtCollection?: unknown })
              : null;
          if (value?.yachtCollection)
            setCollection(parseYachtCollection(value.yachtCollection));
          if (error)
            setMessage({
              type: "error",
              text: `No se pudo cargar la sección: ${error.message}`,
            });
          setLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [supabase]);

  function updateYacht(id: string, patch: Partial<YachtListing>) {
    setCollection((current) => ({
      ...current,
      yachts: current.yachts.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
    setMessage(null);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= collection.yachts.length) return;
    setCollection((current) => {
      const yachts = [...current.yachts];
      [yachts[index], yachts[target]] = [yachts[target], yachts[index]];
      return { ...current, yachts };
    });
  }

  async function uploadFiles(
    yacht: YachtListing,
    event: React.ChangeEvent<HTMLInputElement>,
    gallery: boolean,
  ) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    if (
      files.some(
        (file) =>
          !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024,
      )
    ) {
      setMessage({
        type: "error",
        text: "Cada archivo debe ser una imagen de máximo 8 MB.",
      });
      event.target.value = "";
      return;
    }
    setUploading(yacht.id);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
          const path = `yates/${yacht.id}-${crypto.randomUUID()}.${extension}`;
          const { data, error } = await supabase.storage
            .from("destinos")
            .upload(path, file, { cacheControl: "3600" });
          if (error || !data)
            throw error ?? new Error("No se pudo subir la imagen.");
          return supabase.storage.from("destinos").getPublicUrl(data.path).data
            .publicUrl;
        }),
      );
      updateYacht(
        yacht.id,
        gallery
          ? { images: [...yacht.images, ...urls] }
          : { imageUrl: urls[0] },
      );
      setMessage({
        type: "ok",
        text: "Imagen cargada. Guarda la sección para publicarla.",
      });
    } catch (caught) {
      setMessage({
        type: "error",
        text:
          caught instanceof Error
            ? caught.message
            : "No se pudo subir la imagen.",
      });
    }
    setUploading(null);
    event.target.value = "";
  }

  async function save() {
    if (!collection.title.trim() || !collection.description.trim()) {
      setMessage({
        type: "error",
        text: "Completa el título y la descripción de la sección.",
      });
      return;
    }
    if (
      collection.yachts.some(
        (item) => !item.name.trim() || item.price < 0 || item.capacity < 1,
      )
    ) {
      setMessage({
        type: "error",
        text: "Revisa nombre, precio y capacidad de todos los yates.",
      });
      return;
    }
    if (
      collection.yachts.some(
        (item) =>
          item.active && item.whatsappNumber.replace(/\D/g, "").length < 10,
      )
    ) {
      setMessage({
        type: "error",
        text: "Cada yate publicado necesita un número de WhatsApp válido con código de país.",
      });
      return;
    }
    setSaving(true);
    const normalized: YachtCollection = {
      ...collection,
      eyebrow: collection.eyebrow.trim(),
      title: collection.title.trim(),
      description: collection.description.trim(),
      yachts: collection.yachts.map((item) => ({
        ...item,
        name: item.name.trim(),
        description: item.description.trim(),
        currency: item.currency.trim().toUpperCase() || "MXN",
        priceUnit: item.priceUnit.trim() || "por paseo",
        duration: item.duration?.trim() || null,
        location: item.location?.trim() || null,
        badge: item.badge?.trim().slice(0, 48) || null,
        whatsappNumber: item.whatsappNumber.replace(/\D/g, ""),
        whatsappMessage:
          item.whatsappMessage.trim() ||
          "Hola, quiero cotizar el yate {nombre}.",
        amenities: item.amenities.map((value) => value.trim()).filter(Boolean),
        features: item.features.map((value) => value.trim()).filter(Boolean),
      })),
    };
    const currentResult = await supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "apariencia_sitio")
      .maybeSingle();
    const currentValue =
      currentResult.data?.valor && typeof currentResult.data.valor === "object"
        ? (currentResult.data.valor as Record<string, unknown>)
        : {};
    const { error } = await supabase
      .from("configuracion")
      .upsert(
        {
          clave: "apariencia_sitio",
          valor: { ...currentValue, yachtCollection: normalized },
          actualizado_en: new Date().toISOString(),
        },
        { onConflict: "clave" },
      );
    let publicError: { message: string } | null = null;
    if (!error) {
      const publicFile = new Blob([JSON.stringify(normalized)], {
        type: "application/json",
      });
      const result = await supabase.storage
        .from("destinos")
        .upload("configuracion-publica/yates.json", publicFile, {
          cacheControl: "60",
          contentType: "application/json",
          upsert: true,
        });
      publicError = result.error;
    }
    setMessage(
      error || publicError
        ? {
            type: "error",
            text: `No se pudo publicar: ${error?.message || publicError?.message}`,
          }
        : { type: "ok", text: "Sección de yates publicada correctamente." },
    );
    if (!error && !publicError) {
      setCollection(normalized);
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <section
      id="admin-yates"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <header className="flex flex-col gap-4 border-b bg-gray-50 px-5 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <IconSailboat className="text-alm-teal" /> Yates
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra tarjetas, información, imágenes y amenidades de los
            yates.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setCollection((current) => ({
              ...current,
              yachts: [...current.yachts, newYacht()],
            }))
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
        >
          <IconPlus size={18} /> Agregar yate
        </button>
      </header>
      {loading ? (
        <p className="p-10 text-center text-sm text-gray-500">
          Cargando yates…
        </p>
      ) : (
        <div className="space-y-6 p-5">
          <div className="grid gap-4 rounded-2xl border bg-gray-50 p-4 lg:grid-cols-2">
            <label className="text-[10px] font-black uppercase text-gray-500">
              Texto superior
              <input
                value={collection.eyebrow}
                onChange={(event) =>
                  setCollection((current) => ({
                    ...current,
                    eyebrow: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm font-normal normal-case"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-gray-500">
              Título
              <input
                value={collection.title}
                onChange={(event) =>
                  setCollection((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm font-normal normal-case"
              />
            </label>
            <label className="text-[10px] font-black uppercase text-gray-500 lg:col-span-2">
              Descripción
              <textarea
                value={collection.description}
                onChange={(event) =>
                  setCollection((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm font-normal normal-case"
              />
            </label>
          </div>
          {collection.yachts.map((yacht, index) => (
            <article
              key={yacht.id}
              className="overflow-hidden rounded-2xl border"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-alm-teal font-black text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-black">{yacht.name}</p>
                    <p className="text-xs text-gray-400">
                      {yacht.active ? "Publicado" : "Oculto"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir yate"
                    className="rounded-lg border bg-white p-2 text-alm-mid disabled:opacity-30"
                  >
                    <IconArrowUp size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === collection.yachts.length - 1}
                    aria-label="Bajar yate"
                    className="rounded-lg border bg-white p-2 text-alm-mid disabled:opacity-30"
                  >
                    <IconArrowDown size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      window.confirm(`¿Eliminar ${yacht.name}?`) &&
                      setCollection((current) => ({
                        ...current,
                        yachts: current.yachts.filter(
                          (item) => item.id !== yacht.id,
                        ),
                      }))
                    }
                    aria-label="Eliminar yate"
                    className="rounded-lg border border-red-200 bg-white p-2 text-red-500"
                  >
                    <IconTrash size={18} />
                  </button>
                </div>
              </div>
              <div className="grid gap-5 p-4 xl:grid-cols-[220px_1fr]">
                <div>
                  <div className="relative grid h-44 place-items-center overflow-hidden rounded-2xl bg-alm-dark text-white">
                    {yacht.imageUrl ? (
                      <Image
                        unoptimized
                        fill
                        sizes="220px"
                        src={yacht.imageUrl}
                        alt={yacht.name}
                        className="object-cover"
                      />
                    ) : (
                      <IconSailboat size={42} />
                    )}
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-alm-mid px-3 py-2.5 text-xs font-black text-white">
                    <IconPhotoUp size={17} />
                    {uploading === yacht.id ? "Subiendo…" : "Subir portada"}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading !== null}
                      onChange={(event) =>
                        void uploadFiles(yacht, event, false)
                      }
                      className="hidden"
                    />
                  </label>
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-alm-mid px-3 py-2.5 text-xs font-black text-alm-mid">
                    <IconPhotoUp size={17} />
                    Agregar galería
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={uploading !== null}
                      onChange={(event) => void uploadFiles(yacht, event, true)}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-center text-[10px] text-gray-400">
                    {yacht.images.length} imágenes en galería
                  </p>
                </div>
                <div className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Nombre
                    <input
                      value={yacht.name}
                      onChange={(event) =>
                        updateYacht(yacht.id, { name: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Distintivo corto
                    <input
                      value={yacht.badge ?? ""}
                      maxLength={48}
                      onChange={(event) =>
                        updateYacht(yacht.id, { badge: event.target.value })
                      }
                      placeholder="Ej. Premium"
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                    <span className="mt-1 block font-normal normal-case text-gray-400">
                      Máximo 48 caracteres. La información extensa va en la descripción.
                    </span>
                  </label>
                  <label className="flex items-end gap-2 pb-3 text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={yacht.active}
                      onChange={(event) =>
                        updateYacht(yacht.id, { active: event.target.checked })
                      }
                      className="h-4 w-4 accent-alm-teal"
                    />{" "}
                    Publicado
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Precio
                    <input
                      type="number"
                      min="0"
                      value={yacht.price}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          price: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Moneda
                    <input
                      value={yacht.currency}
                      maxLength={3}
                      onChange={(event) =>
                        updateYacht(yacht.id, { currency: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal uppercase"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Unidad de precio
                    <input
                      value={yacht.priceUnit}
                      onChange={(event) =>
                        updateYacht(yacht.id, { priceUnit: event.target.value })
                      }
                      placeholder="por paseo"
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Capacidad
                    <input
                      type="number"
                      min="1"
                      value={yacht.capacity}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          capacity: Number(event.target.value),
                        })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Duración
                    <input
                      value={yacht.duration ?? ""}
                      onChange={(event) =>
                        updateYacht(yacht.id, { duration: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500">
                    Ubicación
                    <input
                      value={yacht.location ?? ""}
                      onChange={(event) =>
                        updateYacht(yacht.id, { location: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-green-700 sm:col-span-2 lg:col-span-1">
                    Número de WhatsApp
                    <input
                      type="tel"
                      inputMode="tel"
                      value={yacht.whatsappNumber}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          whatsappNumber: event.target.value,
                        })
                      }
                      placeholder="527440000000"
                      className="mt-1 w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-normal normal-case text-gray-800"
                    />
                    <span className="mt-1 block font-normal normal-case text-gray-400">
                      Incluye código de país, sin + ni espacios.
                    </span>
                  </label>
                  <label className="text-[10px] font-black uppercase text-green-700 sm:col-span-2 lg:col-span-3">
                    Mensaje pregrabado de WhatsApp
                    <textarea
                      value={yacht.whatsappMessage}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          whatsappMessage: event.target.value,
                        })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm font-normal normal-case text-gray-800"
                    />
                    <span className="mt-1 block font-normal normal-case text-gray-400">
                      Variables disponibles: {"{nombre}"}, {"{precio}"}, {"{duracion}"}, {"{capacidad}"} y {"{ubicacion}"}.
                    </span>
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2 lg:col-span-3">
                    Descripción
                    <textarea
                      value={yacht.description}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          description: event.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2">
                    Amenidades{" "}
                    <span className="font-normal normal-case">
                      (una por línea)
                    </span>
                    <textarea
                      value={yacht.amenities.join("\n")}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          amenities: event.target.value.split("\n"),
                        })
                      }
                      rows={5}
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                  <label className="text-[10px] font-black uppercase text-gray-500 sm:col-span-2 lg:col-span-1">
                    Características{" "}
                    <span className="font-normal normal-case">
                      (una por línea)
                    </span>
                    <textarea
                      value={yacht.features.join("\n")}
                      onChange={(event) =>
                        updateYacht(yacht.id, {
                          features: event.target.value.split("\n"),
                        })
                      }
                      rows={5}
                      className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm font-normal normal-case"
                    />
                  </label>
                </div>
              </div>
            </article>
          ))}
          {message && (
            <p
              role="status"
              className={`rounded-xl border p-4 text-sm font-bold ${message.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
            >
              {message.text}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || uploading !== null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-alm-teal px-6 py-3.5 font-black text-white disabled:opacity-50 sm:w-auto"
            >
              <IconDeviceFloppy />
              {saving ? "Publicando…" : "Guardar y publicar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
