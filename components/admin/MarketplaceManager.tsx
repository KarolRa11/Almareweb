"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconEdit,
  IconHome,
  IconMapPin,
  IconPlus,
  IconRefresh,
  IconToolsKitchen2,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  MarketplaceListing,
  MarketplaceReservation,
  MarketplaceReservationStatus,
  MarketplaceType,
} from "@/lib/types";

const fallback =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000";
const defaultAmenities = [
  "Wi-Fi",
  "Estacionamiento",
  "Piscina",
  "Vista al mar",
  "Aire acondicionado",
  "Bar",
  "Restaurante",
  "Accesibilidad",
];

function typeLabel(type: MarketplaceType) {
  if (type === "hotel") return "Hotel";
  if (type === "airbnb") return "Airbnb";
  return "Restaurante";
}

function TypeIcon({ type }: { type: MarketplaceType }) {
  if (type === "hotel") return <IconBuildingSkyscraper size={20} />;
  if (type === "airbnb") return <IconHome size={20} />;
  return <IconToolsKitchen2 size={20} />;
}

export default function MarketplaceManager() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [reservations, setReservations] = useState<
    MarketplaceReservation[]
  >([]);
  const [editing, setEditing] = useState<MarketplaceListing | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const load = useCallback(async () => {
    setLoading(true);
    const [listingResult, reservationResult] = await Promise.all([
      supabase
        .from("establecimientos")
        .select("*")
        .order("destacado", { ascending: false })
        .order("nombre"),
      supabase
        .from("reservas_establecimientos")
        .select("*")
        .order("creado_en", { ascending: false }),
    ]);
    const firstError = listingResult.error || reservationResult.error;
    if (firstError) {
      const missingTable =
        firstError.code === "42P01" ||
        firstError.message.includes("schema cache");
      setMessage({
        type: "error",
        text: missingTable
          ? "Falta publicar la migración 006_marketplace_hospitality.sql en Supabase."
          : `No se pudo cargar el módulo: ${firstError.message}`,
      });
    }
    setListings((listingResult.data ?? []) as MarketplaceListing[]);
    setReservations(
      (reservationResult.data ?? []) as MarketplaceReservation[],
    );
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function upload(file: File, folder: string) {
    if (!file.type.startsWith("image/"))
      throw new Error("Solo se permiten archivos de imagen.");
    if (file.size > 8 * 1024 * 1024)
      throw new Error("Cada imagen debe pesar menos de 8 MB.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `establecimientos/${folder}-${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("destinos")
      .upload(path, file, { cacheControl: "3600" });
    if (error) throw error;
    return supabase.storage.from("destinos").getPublicUrl(data.path).data
      .publicUrl;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    try {
      let mainImage = editing?.imagen_principal ?? null;
      let gallery = editing?.imagenes ?? [];
      const mainFile = form.get("imagen_principal");
      const galleryFiles = form
        .getAll("imagenes")
        .filter(
          (value): value is File => value instanceof File && value.size > 0,
        );
      if (mainFile instanceof File && mainFile.size)
        mainImage = await upload(mainFile, "portada");
      if (galleryFiles.length)
        gallery = await Promise.all(
          galleryFiles.map((file) => upload(file, "galeria")),
        );

      const checkedAmenities = defaultAmenities.filter(
        (amenity) => form.getAll("amenidades_base").includes(amenity),
      );
      const customAmenities = String(form.get("amenidades_extra") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const payload = {
        tipo: String(form.get("tipo")) as MarketplaceType,
        nombre: String(form.get("nombre") || "").trim(),
        descripcion: String(form.get("descripcion") || "").trim(),
        direccion: String(form.get("direccion") || "").trim(),
        latitud: Number(form.get("latitud")),
        longitud: Number(form.get("longitud")),
        precio: Number(form.get("precio")),
        descuento: Number(form.get("descuento") || 0),
        unidad_precio: String(form.get("unidad_precio")),
        imagen_principal: mainImage,
        imagenes: gallery,
        amenidades: [...new Set([...checkedAmenities, ...customAmenities])],
        caracteristicas: String(form.get("caracteristicas") || "")
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        capacidad_adultos: Number(form.get("capacidad_adultos")),
        capacidad_ninos: Number(form.get("capacidad_ninos") || 0),
        capacidad_unidades: Number(form.get("capacidad_unidades") || 1),
        minimo_noches: Number(form.get("minimo_noches") || 1),
        hora_apertura: String(form.get("hora_apertura") || "") || null,
        hora_cierre: String(form.get("hora_cierre") || "") || null,
        dias_no_disponibles: String(
          form.get("dias_no_disponibles") || "",
        )
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        activo: form.get("activo") === "on",
        destacado: form.get("destacado") === "on",
      };

      const result = editing
        ? await supabase
            .from("establecimientos")
            .update(payload)
            .eq("id", editing.id)
        : await supabase.from("establecimientos").insert(payload);
      if (result.error) throw result.error;
      setMessage({
        type: "ok",
        text: editing
          ? "Establecimiento actualizado y publicado."
          : "Establecimiento creado y publicado.",
      });
      setEditing(null);
      setFormOpen(false);
      await load();
    } catch (caught) {
      setMessage({
        type: "error",
        text:
          caught instanceof Error
            ? caught.message
            : "No se pudo guardar el establecimiento.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeListing(listing: MarketplaceListing) {
    if (
      !window.confirm(
        `¿Eliminar ${listing.nombre}? Si tiene reservaciones, primero desactívalo para conservar el historial.`,
      )
    )
      return;
    const { error } = await supabase
      .from("establecimientos")
      .delete()
      .eq("id", listing.id);
    setMessage(
      error
        ? {
            type: "error",
            text: "No se puede eliminar porque tiene reservaciones relacionadas. Desactívalo en Editar.",
          }
        : { type: "ok", text: "Establecimiento eliminado." },
    );
    if (!error) await load();
  }

  async function updateReservation(
    reservation: MarketplaceReservation,
    status: MarketplaceReservationStatus,
  ) {
    const { error } = await supabase
      .from("reservas_establecimientos")
      .update({ estado: status })
      .eq("id", reservation.id);
    setMessage(
      error
        ? { type: "error", text: `No se pudo actualizar: ${error.message}` }
        : { type: "ok", text: `Reservación marcada como ${status}.` },
    );
    if (!error) await load();
  }

  async function removeReservation(reservation: MarketplaceReservation) {
    if (
      !window.confirm(
        `¿Eliminar definitivamente la reservación ${reservation.folio}?`,
      )
    )
      return;
    const { error } = await supabase
      .from("reservas_establecimientos")
      .delete()
      .eq("id", reservation.id);
    setMessage(
      error
        ? { type: "error", text: `No se pudo eliminar: ${error.message}` }
        : { type: "ok", text: "Reservación eliminada." },
    );
    if (!error) await load();
  }

  const formListing = editing;
  const revenue = reservations
    .filter(
      (reservation) =>
        reservation.estado === "confirmada" ||
        reservation.estado === "completada",
    )
    .reduce(
      (total, reservation) => total + Number(reservation.total_pagar || 0),
      0,
    );

  return (
    <section
      id="marketplace"
      className="mb-8 scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <header className="flex flex-col gap-4 border-b bg-gray-50 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <IconBuildingSkyscraper className="text-alm-teal" />
            Hospedaje y gastronomía
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Administra hoteles, Airbnb, restaurantes, disponibilidad y
            reservaciones.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold"
          >
            <IconRefresh size={18} /> Actualizar
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2 text-sm font-bold text-white"
          >
            <IconPlus size={18} /> Agregar opción
          </button>
        </div>
      </header>

      <div className="p-5">
        {message && (
          <div
            role="status"
            className={`mb-5 flex items-start justify-between rounded-xl border p-4 text-sm font-bold ${
              message.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Cerrar aviso"
            >
              <IconX size={18} />
            </button>
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Publicados", listings.filter((item) => item.activo).length],
            [
              "Hoteles y Airbnb",
              listings.filter((item) => item.tipo !== "restaurante").length,
            ],
            ["Reservaciones", reservations.length],
            [
              "Ventas confirmadas",
              `$${revenue.toLocaleString("es-MX")} MXN`,
            ],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-gray-50 p-4">
              <p className="text-[10px] font-black uppercase text-gray-400">
                {label}
              </p>
              <p className="mt-1 text-xl font-black text-alm-mid">{value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center text-sm text-gray-400">
            Cargando catálogo...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {listings.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed p-8 text-center text-sm text-gray-500">
                Aún no hay hoteles, Airbnb o restaurantes. Usa “Agregar opción”
                para publicar el primero.
              </div>
            )}
            {listings.map((listing) => (
              <article
                key={listing.id}
                className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row"
              >
                <Image
                  unoptimized
                  width={128}
                  height={112}
                  src={listing.imagen_principal || fallback}
                  alt={listing.nombre}
                  className="h-28 w-full rounded-xl object-cover sm:w-32"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-alm-teal/10 px-2 py-1 text-[10px] font-black uppercase text-alm-mid">
                      <TypeIcon type={listing.tipo} /> {typeLabel(listing.tipo)}
                    </span>
                    {!listing.activo && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase text-gray-500">
                        Oculto
                      </span>
                    )}
                    {listing.destacado && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                        Destacado
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 truncate text-lg font-black">
                    {listing.nombre}
                  </h3>
                  <p className="mt-1 flex items-start gap-1 text-xs text-gray-500">
                    <IconMapPin size={14} className="shrink-0" />
                    {listing.direccion}
                  </p>
                  <p className="mt-2 font-black text-alm-teal">
                    ${Number(listing.precio).toLocaleString("es-MX")}{" "}
                    <span className="text-[10px] font-normal uppercase text-gray-400">
                      / {listing.unidad_precio}
                    </span>
                  </p>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(listing);
                      setFormOpen(true);
                    }}
                    aria-label={`Editar ${listing.nombre}`}
                    className="rounded-lg bg-orange-50 p-3 text-orange-600"
                  >
                    <IconEdit size={19} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeListing(listing)}
                    aria-label={`Eliminar ${listing.nombre}`}
                    className="rounded-lg bg-red-50 p-3 text-red-600"
                  >
                    <IconTrash size={19} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border">
          <div className="flex items-center gap-2 border-b bg-gray-50 px-5 py-4">
            <IconCalendarEvent className="text-alm-teal" />
            <h3 className="font-black">Reservaciones del marketplace</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-alm-beige-light/50 text-[10px] uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Establecimiento</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Ocupación</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      Aún no hay reservaciones de hoteles, Airbnb o restaurantes.
                    </td>
                  </tr>
                )}
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-4 py-3">
                      <b className="block">{reservation.nombre_cliente}</b>
                      <span className="text-xs text-alm-teal">
                        {reservation.email_cliente}
                      </span>
                      <span className="block text-xs text-gray-400">
                        {reservation.telefono}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <b>{reservation.nombre_establecimiento}</b>
                      <span className="block text-xs capitalize text-gray-400">
                        {reservation.tipo_establecimiento} · {reservation.folio}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(
                        `${reservation.fecha_inicio}T12:00:00`,
                      ).toLocaleDateString("es-MX")}
                      {reservation.fecha_fin && (
                        <span className="block text-xs text-gray-400">
                          al{" "}
                          {new Date(
                            `${reservation.fecha_fin}T12:00:00`,
                          ).toLocaleDateString("es-MX")}
                        </span>
                      )}
                      {reservation.hora && (
                        <span className="block text-xs text-gray-400">
                          {reservation.hora.slice(0, 5)} h
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {reservation.adultos} adultos · {reservation.ninos} niños
                      {reservation.tipo_establecimiento !== "restaurante" && (
                        <span className="block text-xs text-gray-400">
                          {reservation.unidades} habitación(es)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-black text-alm-teal">
                      ${Number(reservation.total_pagar).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={reservation.estado}
                        onChange={(event) =>
                          void updateReservation(
                            reservation,
                            event.target.value as MarketplaceReservationStatus,
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-xs font-bold"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="completada">Completada</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void removeReservation(reservation)}
                        aria-label={`Eliminar reservación ${reservation.folio}`}
                        className="rounded-lg bg-red-50 p-2 text-red-600"
                      >
                        <IconTrash size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-alm-dark/80 p-3 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setFormOpen(false)
          }
        >
          <section className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-alm-teal px-6 py-4 text-white">
              <h2 className="flex items-center gap-2 text-xl font-black">
                {formListing ? <IconEdit /> : <IconPlus />}
                {formListing
                  ? `Editar ${formListing.nombre}`
                  : "Nuevo hotel, Airbnb o restaurante"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Cerrar formulario"
                className="rounded-full bg-white/20 p-2"
              >
                <IconX />
              </button>
            </header>
            <form key={formListing?.id || "new"} onSubmit={save} className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Tipo
                  <select
                    name="tipo"
                    defaultValue={formListing?.tipo || "hotel"}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="restaurante">Restaurante</option>
                  </select>
                </label>
                <label className="sm:col-span-1 lg:col-span-2 text-[10px] font-black uppercase text-gray-500">
                  Nombre
                  <input
                    name="nombre"
                    required
                    defaultValue={formListing?.nombre || ""}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  />
                </label>
              </div>
              <label className="block text-[10px] font-black uppercase text-gray-500">
                Descripción
                <textarea
                  name="descripcion"
                  required
                  defaultValue={formListing?.descripcion || ""}
                  className="mt-1 h-28 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-[1.5fr_.7fr_.7fr]">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Dirección
                  <input
                    name="direccion"
                    required
                    defaultValue={formListing?.direccion || ""}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Latitud
                  <input
                    name="latitud"
                    required
                    type="number"
                    min="-90"
                    max="90"
                    step="0.000001"
                    defaultValue={formListing?.latitud ?? 16.855186}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Longitud
                  <input
                    name="longitud"
                    required
                    type="number"
                    min="-180"
                    max="180"
                    step="0.000001"
                    defaultValue={formListing?.longitud ?? -99.867323}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Precio base (MXN)
                  <input
                    name="precio"
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={formListing?.precio ?? ""}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-orange-600">
                  Descuento %
                  <input
                    name="descuento"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    defaultValue={formListing?.descuento ?? 0}
                    className="mt-1 w-full rounded-xl border border-orange-200 bg-orange-50 px-3 py-3 text-sm font-bold text-orange-600"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Unidad de precio
                  <select
                    name="unidad_precio"
                    defaultValue={formListing?.unidad_precio || "noche"}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  >
                    <option value="noche">Por noche</option>
                    <option value="persona">Por persona</option>
                    <option value="reservacion">Por reservación</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Capacidad adultos
                  <input
                    name="capacidad_adultos"
                    required
                    type="number"
                    min="1"
                    defaultValue={formListing?.capacidad_adultos ?? 2}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Capacidad niños
                  <input
                    name="capacidad_ninos"
                    required
                    type="number"
                    min="0"
                    defaultValue={formListing?.capacidad_ninos ?? 0}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Habitaciones / cupos
                  <input
                    name="capacidad_unidades"
                    required
                    type="number"
                    min="1"
                    defaultValue={formListing?.capacidad_unidades ?? 1}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Mínimo de noches
                  <input
                    name="minimo_noches"
                    required
                    type="number"
                    min="1"
                    defaultValue={formListing?.minimo_noches ?? 1}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Hora de apertura (restaurantes)
                  <input
                    name="hora_apertura"
                    type="time"
                    defaultValue={formListing?.hora_apertura?.slice(0, 5) || ""}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Hora de cierre (restaurantes)
                  <input
                    name="hora_cierre"
                    type="time"
                    defaultValue={formListing?.hora_cierre?.slice(0, 5) || ""}
                    className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal"
                  />
                </label>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500">
                  Amenidades
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {defaultAmenities.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                    >
                      <input
                        name="amenidades_base"
                        type="checkbox"
                        value={amenity}
                        defaultChecked={formListing?.amenidades?.includes(
                          amenity,
                        )}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
                <input
                  name="amenidades_extra"
                  defaultValue={(formListing?.amenidades ?? [])
                    .filter((item) => !defaultAmenities.includes(item))
                    .join(", ")}
                  placeholder="Otras amenidades separadas por coma"
                  className="mt-3 w-full rounded-xl border px-3 py-3 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Características (una por línea)
                  <textarea
                    name="caracteristicas"
                    defaultValue={(formListing?.caracteristicas ?? []).join(
                      "\n",
                    )}
                    className="mt-1 h-28 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  Fechas bloqueadas (AAAA-MM-DD, separadas por coma)
                  <textarea
                    name="dias_no_disponibles"
                    defaultValue={(
                      formListing?.dias_no_disponibles ?? []
                    ).join(", ")}
                    className="mt-1 h-28 w-full rounded-xl border px-3 py-3 text-sm font-normal normal-case"
                  />
                </label>
              </div>
              <div className="grid gap-4 rounded-2xl border bg-gray-50 p-4 sm:grid-cols-2">
                <label className="text-[10px] font-black uppercase text-gray-500">
                  <IconUpload className="mb-1 inline" size={17} /> Portada
                  <input
                    name="imagen_principal"
                    type="file"
                    accept="image/*"
                    required={!formListing?.imagen_principal}
                    className="mt-1 block w-full text-xs font-normal normal-case"
                  />
                </label>
                <label className="text-[10px] font-black uppercase text-gray-500">
                  <IconUpload className="mb-1 inline" size={17} /> Galería
                  <input
                    name="imagenes"
                    type="file"
                    accept="image/*"
                    multiple
                    className="mt-1 block w-full text-xs font-normal normal-case"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-5 rounded-xl bg-alm-beige-light p-4 text-sm font-bold">
                <label className="flex items-center gap-2">
                  <input
                    name="activo"
                    type="checkbox"
                    defaultChecked={formListing?.activo ?? true}
                  />
                  Visible en la página
                </label>
                <label className="flex items-center gap-2">
                  <input
                    name="destacado"
                    type="checkbox"
                    defaultChecked={formListing?.destacado ?? false}
                  />
                  Marcar como destacado
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-alm-teal py-4 text-base font-black text-white disabled:opacity-50"
              >
                {saving
                  ? "Guardando y publicando..."
                  : formListing
                    ? "Guardar cambios"
                    : "Publicar opción"}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
