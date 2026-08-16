"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import {
  IconAirConditioning,
  IconBuildingSkyscraper,
  IconCalendarEvent,
  IconCar,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconHome,
  IconMapPin,
  IconPool,
  IconToolsKitchen2,
  IconUsers,
  IconWifi,
  IconX,
} from "@tabler/icons-react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import MarketplaceMap from "@/components/MarketplaceMap";
import YachtCollection from "@/components/YachtCollection";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  MarketplaceListing,
  MarketplaceType,
  YachtCollection as YachtCollectionData,
} from "@/lib/types";

const fallback =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=82&w=1400";
const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const typeLabel: Record<MarketplaceType, string> = {
  hotel: "Hoteles",
  airbnb: "Airbnb",
  restaurante: "Restaurantes",
};
const unitLabel = {
  noche: "por noche",
  persona: "por persona",
  reservacion: "por reservación",
} as const;

function TypeIcon({
  type,
  size = 22,
}: {
  type: MarketplaceType;
  size?: number;
}) {
  if (type === "hotel") return <IconBuildingSkyscraper size={size} />;
  if (type === "airbnb") return <IconHome size={size} />;
  return <IconToolsKitchen2 size={size} />;
}

function AmenityIcon({ label }: { label: string }) {
  const value = label.toLocaleLowerCase("es");
  if (value.includes("wifi") || value.includes("internet"))
    return <IconWifi size={17} />;
  if (value.includes("estacion")) return <IconCar size={17} />;
  if (value.includes("piscina") || value.includes("alberca"))
    return <IconPool size={17} />;
  if (value.includes("aire")) return <IconAirConditioning size={17} />;
  return <span aria-hidden>✓</span>;
}

function dateDiff(start: string, end: string) {
  if (!start || !end) return 1;
  return Math.max(
    1,
    Math.round(
      (new Date(`${end}T12:00:00`).getTime() -
        new Date(`${start}T12:00:00`).getTime()) /
        86_400_000,
    ),
  );
}

function rpcError(message: string) {
  if (message.includes("AUTH_REQUIRED")) return "Inicia sesión para reservar.";
  if (message.includes("SIN_DISPONIBILIDAD"))
    return "Ya no hay disponibilidad para esa fecha y cantidad.";
  if (message.includes("CAPACIDAD_EXCEDIDA"))
    return "La cantidad de huéspedes o comensales supera la capacidad.";
  if (message.includes("FECHA_BLOQUEADA"))
    return "La fecha elegida está bloqueada por el establecimiento.";
  if (message.includes("MINIMO_NOCHES"))
    return "La estancia no cumple el mínimo de noches requerido.";
  if (message.includes("FUERA_DE_HORARIO"))
    return "La hora elegida está fuera del horario disponible.";
  if (message.includes("TELEFONO_REQUERIDO"))
    return "Agrega un teléfono válido para que podamos confirmar.";
  return "No pudimos registrar la reservación. Revisa los datos e inténtalo nuevamente.";
}

export default function MarketplaceExplorer({
  listings,
  yachtCollection,
}: {
  listings: MarketplaceListing[];
  yachtCollection: YachtCollectionData;
}) {
  const [cardFilter, setCardFilter] = useState<"todos" | MarketplaceType | "yates">(
    "todos",
  );
  const [mapFilter, setMapFilter] = useState<"todos" | MarketplaceType>(
    "todos",
  );
  const [selected, setSelected] = useState<MarketplaceListing | null>(null);
  const [booking, setBooking] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    fechaInicio: "",
    fechaFin: "",
    hora: "",
    adultos: 1,
    ninos: 0,
    unidades: 1,
    notas: "",
  });
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    void supabase.auth
      .getUser()
      .then((result: { data: { user: User | null } }) =>
        setUser(result.data.user),
      );
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) =>
        setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  const cardListings = useMemo(
    () =>
      listings.filter(
        (listing) => cardFilter === "todos" || (cardFilter !== "yates" && listing.tipo === cardFilter),
      ),
    [cardFilter, listings],
  );
  const mapListings = useMemo(
    () =>
      listings.filter(
        (listing) => mapFilter === "todos" || listing.tipo === mapFilter,
      ),
    [listings, mapFilter],
  );

  const selectListing = useCallback((listing: MarketplaceListing) => {
    setSelected(listing);
    setBooking(false);
    setImageIndex(0);
    setError("");
    setSuccess("");
  }, []);

  const pictures = useMemo(() => {
    if (!selected) return [fallback];
    return [
      selected.imagen_principal,
      ...(selected.imagenes ?? []),
    ].filter((value): value is string => Boolean(value)).length
      ? [
          selected.imagen_principal,
          ...(selected.imagenes ?? []),
        ].filter((value): value is string => Boolean(value))
      : [fallback];
  }, [selected]);

  const discountedPrice = selected
    ? Number(selected.precio) *
      (1 - Number(selected.descuento ?? 0) / 100)
    : 0;
  const estimate = selected
    ? selected.unidad_precio === "persona"
      ? discountedPrice *
        (form.adultos + form.ninos) *
        (selected.tipo === "restaurante"
          ? 1
          : dateDiff(form.fechaInicio, form.fechaFin))
      : selected.unidad_precio === "reservacion"
        ? discountedPrice
        : discountedPrice *
          dateDiff(form.fechaInicio, form.fechaFin) *
          form.unidades
    : 0;

  function startBooking() {
    if (!selected) return;
    if (!user) {
      window.dispatchEvent(new Event("almare:abrir-autenticacion"));
      return;
    }
    setError("");
    setSuccess("");
    setBooking(true);
  }

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !user) return;
    if (
      selected.dias_no_disponibles?.includes(form.fechaInicio) ||
      (selected.tipo !== "restaurante" &&
        selected.dias_no_disponibles?.some(
          (day) => day >= form.fechaInicio && day < form.fechaFin,
        ))
    ) {
      setError("Una de las fechas elegidas no está disponible.");
      return;
    }
    setSubmitting(true);
    setError("");
    const { data, error: reservationError } = await supabase.rpc(
      "crear_reserva_establecimiento",
      {
        p_establecimiento: selected.id,
        p_fecha_inicio: form.fechaInicio,
        p_fecha_fin:
          selected.tipo === "restaurante" ? null : form.fechaFin || null,
        p_hora: selected.tipo === "restaurante" ? form.hora || null : null,
        p_adultos: form.adultos,
        p_ninos: form.ninos,
        p_unidades:
          selected.tipo === "restaurante" ? 1 : form.unidades,
        p_nombre: form.nombre,
        p_telefono: form.telefono,
        p_notas: form.notas || null,
      },
    );
    setSubmitting(false);
    if (reservationError) {
      setError(rpcError(reservationError.message));
      return;
    }
    const reservation = Array.isArray(data) ? data[0] : data;
    setSuccess(
      `Solicitud registrada${reservation?.folio ? ` con folio ${reservation.folio}` : ""}. El equipo confirmará la disponibilidad.`,
    );
  }

  const cardFilterButtons: Array<["todos" | MarketplaceType | "yates", string]> = [
    ["todos", "Todos"],
    ["hotel", "Hoteles"],
    ["airbnb", "Airbnb"],
    ["restaurante", "Restaurantes"],
    ["yates", "Yates"],
  ];
  const mapFilterButtons: Array<["todos" | MarketplaceType, string]> = [
    ["todos", "Todos"],
    ["hotel", "Hoteles"],
    ["airbnb", "Airbnb"],
    ["restaurante", "Restaurantes"],
  ];

  return (
    <>
      <section
        id="estancias"
        className="scroll-mt-20 bg-alm-beige-light px-5 py-14 dark:bg-[#153f52] md:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[.2em] text-alm-teal">
                Hospedaje y gastronomía
              </p>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <IconBuildingSkyscraper className="text-alm-teal" />
                Vive Acapulco a tu manera
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-alm-beige-mid">
                Hoteles, alojamientos, restaurantes y yates seleccionados, con
                disponibilidad y reservación en un solo lugar.
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar hospedaje y restaurantes"
            >
              {cardFilterButtons.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCardFilter(value)}
                  aria-pressed={cardFilter === value}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    cardFilter === value
                      ? "bg-alm-teal text-white shadow-md"
                      : "border border-alm-beige-mid bg-white text-alm-mid hover:bg-alm-teal/10 dark:bg-alm-dark dark:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {cardFilter === "yates" ? <YachtCollection collection={yachtCollection} embedded /> : cardListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-alm-beige-mid bg-white p-10 text-center dark:border-alm-mid dark:bg-alm-dark">
              <IconBuildingSkyscraper
                className="mx-auto text-alm-teal"
                size={38}
              />
              <h3 className="mt-3 font-black">Próximamente</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-alm-beige-mid">
                El equipo está preparando nuevas opciones para esta categoría.
              </p>
            </div>
          ) : (
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cardListings.map((listing) => {
                const price =
                  Number(listing.precio) *
                  (1 - Number(listing.descuento ?? 0) / 100);
                return (
                  <article
                    key={listing.id}
                    className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-alm-beige-mid bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-alm-mid dark:bg-alm-dark"
                  >
                    <button
                      type="button"
                      onClick={() => selectListing(listing)}
                      className="relative block h-48 w-full shrink-0 overflow-hidden text-left sm:h-52 lg:h-56"
                      aria-label={`Ver detalles de ${listing.nombre}`}
                    >
                      <Image
                        unoptimized
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                        src={listing.imagen_principal || fallback}
                        alt={listing.nombre}
                        className="object-cover transition duration-500 hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-black text-alm-mid shadow">
                        <TypeIcon type={listing.tipo} size={16} />
                        {typeLabel[listing.tipo].slice(0, -1)}
                      </span>
                    </button>
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <h3 className="break-words text-xl font-black">
                        {listing.nombre}
                      </h3>
                      <p className="mt-1 flex items-start gap-1 text-xs text-gray-500 dark:text-alm-beige-mid">
                        <IconMapPin size={15} className="shrink-0" />
                        {listing.direccion}
                      </p>
                      <div className="mt-4 flex min-h-7 flex-wrap content-start gap-1.5">
                        {(listing.amenidades ?? []).slice(0, 3).map((amenity) => (
                          <span
                            key={amenity}
                            className="rounded-full bg-alm-teal/10 px-2.5 py-1 text-[10px] font-bold text-alm-mid dark:text-alm-pastel"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex flex-col gap-4 border-t border-alm-beige-mid pt-4 dark:border-alm-mid sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0">
                          {Number(listing.descuento) > 0 && (
                            <p className="text-xs font-bold text-red-500 line-through">
                              {money.format(Number(listing.precio))}
                            </p>
                          )}
                          <strong
                            className={
                              Number(listing.descuento) > 0
                                ? "text-xl font-black text-red-600"
                                : "text-xl font-black text-alm-mid dark:text-white"
                            }
                          >
                            {money.format(price)}
                          </strong>
                          <span className="block text-[10px] uppercase text-gray-400">
                            {unitLabel[listing.unidad_precio]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectListing(listing)}
                          className="w-full shrink-0 whitespace-nowrap rounded-xl bg-alm-teal px-4 py-2.5 text-xs font-black text-white hover:bg-alm-mid sm:w-auto"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <section
            aria-labelledby="mapa-marketplace-title"
            className="mt-12 overflow-hidden rounded-2xl border border-alm-beige-mid bg-white shadow-lg dark:border-alm-mid dark:bg-alm-dark"
          >
            <div className="bg-alm-beige p-5 dark:bg-[#133545]">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-alm-teal">
                Ubicación
              </p>
              <h3
                id="mapa-marketplace-title"
                className="text-lg font-black text-alm-mid dark:text-white"
              >
                Mapa de hoteles, Airbnb y restaurantes
              </h3>
              <p className="text-xs text-gray-500 dark:text-alm-beige-mid">
                Selecciona un punto para consultar detalles y reservar.
              </p>
            </div>
            <div className="almare-marketplace-map border-t border-alm-beige-mid dark:border-alm-mid">
              <div
                className="flex flex-wrap gap-2 bg-white px-5 py-3 dark:bg-alm-dark"
                role="group"
                aria-label="Filtrar puntos del mapa"
              >
                {mapFilterButtons.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMapFilter(value)}
                    aria-pressed={mapFilter === value}
                    className={`rounded-full px-3 py-2 text-[11px] font-bold transition ${
                      mapFilter === value
                        ? "bg-alm-teal text-white"
                        : "border border-alm-beige-mid bg-white text-alm-mid hover:bg-alm-teal/10 dark:bg-alm-dark dark:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {mapListings.length ? (
                <MarketplaceMap
                  listings={mapListings}
                  onSelect={selectListing}
                />
              ) : (
                <div className="grid h-72 place-items-center px-5 text-center text-sm text-gray-500">
                  No hay puntos publicados en esta categoría.
                </div>
              )}
            </div>
          </section>

        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-alm-dark/85 p-3 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSelected(null)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-detail-title"
            className="grid max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-[#133545] lg:grid-cols-[1.05fr_.95fr]"
          >
            <div className="relative min-h-72 overflow-hidden rounded-t-3xl bg-alm-dark lg:min-h-[650px] lg:rounded-l-3xl lg:rounded-tr-none">
              <Image
                unoptimized
                fill
                sizes="(max-width: 1024px) 100vw, 52vw"
                src={pictures[imageIndex]}
                alt={`${selected.nombre}, fotografía ${imageIndex + 1}`}
                className="object-cover"
              />
              {pictures.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex(
                        (index) =>
                          (index - 1 + pictures.length) % pictures.length,
                      )
                    }
                    aria-label="Fotografía anterior"
                    className="absolute left-4 top-1/2 rounded-full bg-alm-dark/65 p-2 text-white"
                  >
                    <IconChevronLeft />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageIndex((index) => (index + 1) % pictures.length)
                    }
                    aria-label="Fotografía siguiente"
                    className="absolute right-4 top-1/2 rounded-full bg-alm-dark/65 p-2 text-white"
                  >
                    <IconChevronRight />
                  </button>
                  <span className="absolute bottom-4 left-4 rounded-full bg-alm-dark/70 px-3 py-1 text-xs font-bold text-white">
                    {imageIndex + 1} / {pictures.length}
                  </span>
                </>
              )}
            </div>

            <div className="relative p-6 sm:p-8">
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar detalles"
                className="absolute right-5 top-5 rounded-full border border-alm-beige-mid p-2 text-gray-500 hover:bg-alm-beige-light dark:border-alm-mid dark:hover:bg-alm-dark"
              >
                <IconX />
              </button>
              <span className="inline-flex items-center gap-2 rounded-full bg-alm-teal/10 px-3 py-1 text-xs font-black text-alm-teal">
                <TypeIcon type={selected.tipo} size={16} />
                {typeLabel[selected.tipo].slice(0, -1)}
              </span>
              <h2
                id="marketplace-detail-title"
                className="mt-3 pr-12 text-3xl font-black"
              >
                {selected.nombre}
              </h2>
              <p className="mt-2 flex gap-1 text-sm text-gray-500 dark:text-alm-beige-mid">
                <IconMapPin size={18} className="shrink-0" />
                {selected.direccion}
              </p>

              {!booking ? (
                <>
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">
                    {selected.descripcion}
                  </p>
                  {(selected.caracteristicas ?? []).length > 0 && (
                    <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
                      {(selected.caracteristicas ?? []).map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <span className="font-black text-alm-teal">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(selected.amenidades ?? []).length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-black">Amenidades</h3>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(selected.amenidades ?? []).map((amenity) => (
                          <span
                            key={amenity}
                            className="flex items-center gap-2 rounded-xl bg-alm-beige-light px-3 py-2 text-xs font-bold dark:bg-alm-dark"
                          >
                            <span className="text-alm-teal">
                              <AmenityIcon label={amenity} />
                            </span>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 grid gap-3 rounded-2xl border border-alm-beige-mid bg-alm-beige-light p-4 text-xs dark:border-alm-mid dark:bg-alm-dark sm:grid-cols-2">
                    <span className="flex items-center gap-2">
                      <IconUsers className="text-alm-teal" size={18} />
                      Hasta {selected.capacidad_adultos} adultos
                      {selected.capacidad_ninos
                        ? ` y ${selected.capacidad_ninos} niños`
                        : ""}
                    </span>
                    {selected.tipo === "restaurante" ? (
                      <span className="flex items-center gap-2">
                        <IconClock className="text-alm-teal" size={18} />
                        {selected.hora_apertura?.slice(0, 5) || "Horario por confirmar"}{" "}
                        – {selected.hora_cierre?.slice(0, 5) || "cierre"}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <IconCalendarEvent
                          className="text-alm-teal"
                          size={18}
                        />
                        Mínimo {selected.minimo_noches} noche(s)
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex items-end justify-between gap-4">
                    <div>
                      {Number(selected.descuento) > 0 && (
                        <p className="text-sm font-bold text-red-500 line-through">
                          Antes {money.format(Number(selected.precio))}
                        </p>
                      )}
                      <strong
                        className={
                          Number(selected.descuento) > 0
                            ? "text-3xl font-black text-red-600"
                            : "text-3xl font-black text-alm-mid dark:text-white"
                        }
                      >
                        {money.format(discountedPrice)}
                      </strong>
                      <span className="block text-[10px] uppercase text-gray-400">
                        {unitLabel[selected.unidad_precio]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={startBooking}
                      className="rounded-xl bg-alm-teal px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-alm-mid"
                    >
                      {selected.tipo === "restaurante"
                        ? "Reservar mesa"
                        : "Consultar y reservar"}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={reserve} className="mt-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setBooking(false)}
                    className="text-xs font-black text-alm-mid dark:text-alm-pastel"
                  >
                    ← Volver a los detalles
                  </button>
                  <h3 className="text-xl font-black">
                    {selected.tipo === "restaurante"
                      ? "Reserva tu mesa"
                      : "Solicita tu estancia"}
                  </h3>
                  {success ? (
                    <div
                      role="status"
                      className="rounded-2xl bg-emerald-50 p-5 text-sm font-bold text-emerald-700"
                    >
                      {success}
                    </div>
                  ) : (
                    <>
                      {error && (
                        <p
                          role="alert"
                          className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600"
                        >
                          {error}
                        </p>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Nombre completo
                          <input
                            required
                            value={form.nombre}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                nombre: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-alm-beige-mid bg-white px-3 py-2.5 text-sm font-normal normal-case text-alm-dark dark:border-alm-mid dark:bg-alm-dark dark:text-white"
                          />
                        </label>
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Teléfono
                          <input
                            required
                            type="tel"
                            minLength={8}
                            value={form.telefono}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                telefono: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-alm-beige-mid bg-white px-3 py-2.5 text-sm font-normal normal-case text-alm-dark dark:border-alm-mid dark:bg-alm-dark dark:text-white"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          {selected.tipo === "restaurante"
                            ? "Fecha"
                            : "Entrada"}
                          <input
                            required
                            type="date"
                            min={today}
                            value={form.fechaInicio}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                fechaInicio: event.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-alm-beige-mid bg-white px-3 py-2.5 text-sm font-normal text-alm-dark dark:border-alm-mid dark:bg-alm-dark dark:text-white dark:[color-scheme:dark]"
                          />
                        </label>
                        {selected.tipo === "restaurante" ? (
                          <label className="text-[10px] font-black uppercase text-gray-500">
                            Hora
                            <input
                              required
                              type="time"
                              min={selected.hora_apertura?.slice(0, 5)}
                              max={selected.hora_cierre?.slice(0, 5)}
                              value={form.hora}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  hora: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-alm-beige-mid bg-white px-3 py-2.5 text-sm font-normal text-alm-dark dark:border-alm-mid dark:bg-alm-dark dark:text-white dark:[color-scheme:dark]"
                            />
                          </label>
                        ) : (
                          <label className="text-[10px] font-black uppercase text-gray-500">
                            Salida
                            <input
                              required
                              type="date"
                              min={form.fechaInicio || today}
                              value={form.fechaFin}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  fechaFin: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-alm-beige-mid bg-white px-3 py-2.5 text-sm font-normal text-alm-dark dark:border-alm-mid dark:bg-alm-dark dark:text-white dark:[color-scheme:dark]"
                            />
                          </label>
                        )}
                      </div>
                      <div
                        className={`grid gap-3 ${
                          selected.tipo === "restaurante"
                            ? "grid-cols-2"
                            : "grid-cols-3"
                        }`}
                      >
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Adultos
                          <input
                            required
                            type="number"
                            min={1}
                            max={selected.capacidad_adultos}
                            value={form.adultos}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                adultos: Number(event.target.value),
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-alm-beige-mid px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Niños
                          <input
                            type="number"
                            min={0}
                            max={selected.capacidad_ninos}
                            value={form.ninos}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                ninos: Number(event.target.value),
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-alm-beige-mid px-3 py-2.5 text-sm font-normal"
                          />
                        </label>
                        {selected.tipo !== "restaurante" && (
                          <label className="text-[10px] font-black uppercase text-gray-500">
                            Habitaciones
                            <input
                              type="number"
                              min={1}
                              max={selected.capacidad_unidades}
                              value={form.unidades}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  unidades: Number(event.target.value),
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-alm-beige-mid px-3 py-2.5 text-sm font-normal"
                            />
                          </label>
                        )}
                      </div>
                      <label className="block text-[10px] font-black uppercase text-gray-500">
                        Notas para el establecimiento
                        <textarea
                          value={form.notas}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              notas: event.target.value,
                            }))
                          }
                          className="mt-1 h-20 w-full rounded-xl border border-alm-beige-mid px-3 py-2.5 text-sm font-normal normal-case"
                        />
                      </label>
                      <div className="flex items-center justify-between rounded-xl bg-alm-beige-light p-4 dark:bg-alm-dark">
                        <span className="text-xs text-gray-500 dark:text-alm-beige-mid">
                          Total estimado
                        </span>
                        <strong className="text-xl text-alm-teal">
                          {money.format(estimate)}
                        </strong>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-alm-teal py-3.5 text-sm font-black text-white disabled:opacity-50"
                      >
                        {submitting
                          ? "Comprobando disponibilidad..."
                          : "Confirmar solicitud"}
                      </button>
                    </>
                  )}
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
