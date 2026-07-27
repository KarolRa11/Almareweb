"use client";
import { useState, useEffect, useMemo } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import SocialLinksManager from "@/components/admin/SocialLinksManager";
import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
import CrmManager from "@/components/admin/CrmManager";
import MarketplaceManager from "@/components/admin/MarketplaceManager";
import PaymentSettingsManager from "@/components/admin/PaymentSettingsManager";
import type { Banner, Destino, PaymentStatus, Perfil, Reservacion } from "@/lib/types";
import { normalizePaymentStatus, PAYMENT_STATUS_LABEL } from "@/lib/payment-settings";
import { destinationPolicy, mergeStoredDestinationRules, storeDestinationRules } from "@/lib/destination-rules";
import Image from "next/image";
import {
  IconUsers,
  IconPlaneDeparture,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconUpload,
  IconLayoutDashboard,
  IconCalendarEvent,
  IconLogout,
  IconEdit,
  IconCurrencyDollar,
  IconX,
  IconAlertTriangle,
  IconSlideshow,
  IconTicket,
  IconSearch,
  IconDownload,
  IconRefresh,
  IconMenu2,
  IconBuildingSkyscraper,
} from "@tabler/icons-react";

export default function AdminDashboard() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reservacion | null>(null);

  const [destinoEnEdicion, setDestinoEnEdicion] = useState<Destino | null>(null);
  const [destinoABorrar, setDestinoABorrar] = useState<number | string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busquedaReserva, setBusquedaReserva] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const cargarDatos = async () => {
    const [destinosResult, reservacionesResult, bannersResult, perfilesResult] = await Promise.all([
      supabase.from("destinos").select("*").order("precio", { ascending: true }),
      supabase.from("reservaciones").select("*").order("creado_en", { ascending: false }),
      supabase.from("banners").select("*").order("creado_en", { ascending: false }),
      supabase.from("perfiles").select("*").order("creado_en", { ascending: false }),
    ]);
    const firstError = destinosResult.error || reservacionesResult.error || bannersResult.error || perfilesResult.error;
    if (firstError) setNotice({ type: "error", text: `No se pudieron cargar todos los datos: ${firstError.message}` });
    setDestinos(mergeStoredDestinationRules((destinosResult.data || []) as Destino[]));
    setReservaciones((reservacionesResult.data || []) as Reservacion[]);
    setBanners((bannersResult.data || []) as Banner[]);
    setPerfiles((perfilesResult.data || []) as Perfil[]);
    setLoading(false);
    setRefreshing(false);
  };

  const reservasVisibles = useMemo(() => {
    const term = busquedaReserva.trim().toLocaleLowerCase("es");
    return reservaciones.filter((reserva) => {
      const textMatch = !term || `${reserva.folio || ""} ${reserva.nombre_cliente} ${reserva.email_cliente} ${reserva.titulo_destino}`.toLocaleLowerCase("es").includes(term);
      return textMatch && (!filtroFecha || reserva.fecha_viaje === filtroFecha);
    });
  }, [busquedaReserva, filtroFecha, reservaciones]);

  const perfilSeleccionado = useMemo(() => {
    if (!reservaSeleccionada?.usuario_id) return null;
    return perfiles.find((perfil) => perfil.id === reservaSeleccionada.usuario_id) ?? null;
  }, [perfiles, reservaSeleccionada]);

  function calcularEdad(fecha?: string | null) {
    if (!fecha) return null;
    const nacimiento = new Date(`${fecha}T12:00:00`);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    if (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate())) edad -= 1;
    return edad;
  }

  async function actualizarEstadoReserva(reserva: Reservacion, estado: Reservacion["estado"]) {
    const { error } = await supabase.from("reservaciones").update({ estado }).eq("id", reserva.id);
    if (error) setNotice({ type: "error", text: `No se pudo actualizar la reservación: ${error.message}` });
    else {
      setNotice({ type: "ok", text: `Reservación marcada como ${estado}.` });
      setReservaSeleccionada((current) => current ? { ...current, estado } : current);
      await cargarDatos();
    }
  }

  async function actualizarEstadoPagoReserva(
    reserva: Reservacion,
    estadoPago: PaymentStatus,
  ) {
    const { error } = await supabase
      .from("reservaciones")
      .update({ estado_pago: estadoPago })
      .eq("id", reserva.id);
    if (error) {
      setNotice({
        type: "error",
        text: `No se pudo actualizar el pago: ${error.message}`,
      });
      return;
    }
    setNotice({
      type: "ok",
      text: `Pago marcado como ${PAYMENT_STATUS_LABEL[estadoPago].toLocaleLowerCase("es")}.`,
    });
    setReservaSeleccionada((current) =>
      current ? { ...current, estado_pago: estadoPago } : current,
    );
    await cargarDatos();
  }

  async function eliminarReserva(reserva: Reservacion) {
    if (!window.confirm(`¿Eliminar definitivamente la reservación ${reserva.folio || reserva.id}? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("reservaciones").delete().eq("id", reserva.id);
    if (error) setNotice({ type: "error", text: `No se pudo eliminar la reservación: ${error.message}` });
    else {
      setNotice({ type: "ok", text: "Reservación eliminada definitivamente." });
      setReservaSeleccionada(null);
      await cargarDatos();
    }
  }

  function exportarReservas() {
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = reservasVisibles.map((r) => [r.folio || r.id, r.nombre_cliente, r.email_cliente, r.telefono, r.titulo_destino, r.fecha_viaje, r.pasajeros, r.total_pagar, PAYMENT_STATUS_LABEL[normalizePaymentStatus(r.estado_pago)], r.estado || "registrada"]);
    const csv = [["Folio", "Cliente", "Correo", "Teléfono", "Destino", "Fecha", "Pasajeros", "Total MXN", "Pago", "Estado"], ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `reservaciones-almare-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void cargarDatos(), 0);
    return () => window.clearTimeout(timer);
    // cargarDatos solo se ejecuta al montar; el cliente es estable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const subirBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingBanner(true);
    const file = e.target.files[0];
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setNotice({ type: "error", text: "El banner debe ser una imagen de máximo 8 MB." });
      setUploadingBanner(false); e.target.value = ""; return;
    }
    const ext = file.name.split(".").pop();
    const { data, error } = await supabase.storage
      .from("destinos")
      .upload(`banners/banner-${Date.now()}.${ext}`, file);

    if (data) {
      const url = supabase.storage.from("destinos").getPublicUrl(data.path)
        .data.publicUrl;
      const { error: insertError } = await supabase.from("banners").insert({ imagen_url: url });
      if (insertError) setNotice({ type: "error", text: `La imagen subió, pero el banner no pudo registrarse: ${insertError.message}` });
      else { setNotice({ type: "ok", text: "Banner publicado correctamente." }); await cargarDatos(); }
    } else {
      setNotice({ type: "error", text: `No se pudo subir el banner: ${error?.message || "error inesperado"}` });
    }
    setUploadingBanner(false);
  };

  const borrarBanner = async (id: string) => {
    if (window.confirm("¿Seguro que deseas quitar esta foto del inicio?")) {
      const banner = banners.find((item) => item.id === id);
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) setNotice({ type: "error", text: `No se pudo eliminar el banner: ${error.message}` });
      else {
        if (banner?.imagen_url.includes("/storage/v1/object/public/destinos/")) {
          const path = decodeURIComponent(banner.imagen_url.split("/storage/v1/object/public/destinos/")[1]);
          await supabase.storage.from("destinos").remove([path]);
        }
        setNotice({ type: "ok", text: "Banner eliminado correctamente." });
        await cargarDatos();
      }
    }
  };

  const guardarDestino = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const isEdit = !!destinoEnEdicion;

    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const precio = Number(formData.get("precio"));
    const descuento = Number(formData.get("descuento") || 0);
    const etiquetas = String(formData.get("etiquetas") || "Familiar").split(",").map((item) => item.trim()).filter(Boolean);
    const edad_minima = Math.max(0, Number(formData.get("edad_minima") || 0));
    const permite_ninos = String(formData.get("permite_ninos") || "true") === "true";

    let imagenUrl = destinoEnEdicion?.imagen_principal || "";
    const imagenPrincipalFile = formData.get("imagen_principal") as File;
    if (imagenPrincipalFile && imagenPrincipalFile.size > 0) {
      if (!imagenPrincipalFile.type.startsWith("image/") || imagenPrincipalFile.size > 8 * 1024 * 1024) {
        setNotice({ type: "error", text: "La portada debe ser una imagen de máximo 8 MB." }); setSaving(false); return;
      }
      const ext = imagenPrincipalFile.name.split(".").pop();
      const { data, error: uploadError } = await supabase.storage
        .from("destinos")
        .upload(`portadas/principal-${Date.now()}.${ext}`, imagenPrincipalFile);
      if (uploadError) { setNotice({ type: "error", text: `No se pudo subir la portada: ${uploadError.message}` }); setSaving(false); return; }
      if (data)
        imagenUrl = supabase.storage.from("destinos").getPublicUrl(data.path)
          .data.publicUrl;
    }

    let arrayImagenes = destinoEnEdicion?.imagenes || [];
    const carruselFiles = formData.getAll("imagenes_carrusel") as File[];
    let nuevasFotosSubidas = false;
    const nuevasUrls: string[] = [];

    for (const file of carruselFiles) {
      if (file && file.size > 0) {
        if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
          setNotice({ type: "error", text: "Cada fotografía del carrusel debe pesar máximo 8 MB." }); setSaving(false); return;
        }
        nuevasFotosSubidas = true;
        const ext = file.name.split(".").pop();
        const { data, error: uploadError } = await supabase.storage
          .from("destinos")
          .upload(
            `portadas/carrusel-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`,
            file,
          );
        if (uploadError) { setNotice({ type: "error", text: `No se pudo subir una fotografía: ${uploadError.message}` }); setSaving(false); return; }
        if (data)
          nuevasUrls.push(
            supabase.storage.from("destinos").getPublicUrl(data.path).data
              .publicUrl,
          );
      }
    }

    if (nuevasFotosSubidas)
      arrayImagenes = [imagenUrl, ...nuevasUrls].filter(Boolean);
    else if (imagenUrl && !arrayImagenes.includes(imagenUrl))
      arrayImagenes = [imagenUrl, ...arrayImagenes].filter(Boolean);

    const datosDestino = {
      titulo, nombre: titulo, descripcion, precio, descuento, etiquetas, edad_minima, permite_ninos,
      imagen_principal: imagenUrl, imagenes: arrayImagenes,
    };
    let mutationError: PostgrestError | null = null;
    if (isEdit) {
      const result = await supabase
        .from("destinos")
        .update(datosDestino)
        .eq("id", destinoEnEdicion.id);
      mutationError = result.error;
    } else {
      const result = await supabase
        .from("destinos")
        .insert(datosDestino);
      mutationError = result.error;
    }
    if (mutationError && ["descuento", "etiquetas", "edad_minima", "permite_ninos"].some((column) => mutationError?.message.includes(column))) {
      const { descuento: _descuento, etiquetas: _etiquetas, edad_minima: _edad, permite_ninos: _ninos, ...compatible } = datosDestino;
      void _descuento; void _etiquetas; void _edad; void _ninos;
      const retry = isEdit
        ? await supabase.from("destinos").update(compatible).eq("id", destinoEnEdicion!.id)
        : await supabase.from("destinos").insert(compatible);
      mutationError = retry.error;
    }
    if (mutationError) setNotice({ type: "error", text: `No se pudo guardar: ${mutationError.message}` });
    else {
      let savedId = destinoEnEdicion?.id;
      if (!savedId) {
        const { data } = await supabase.from("destinos").select("id").eq("titulo", titulo).order("id", { ascending: false }).limit(1).maybeSingle();
        savedId = data?.id;
      }
      if (savedId) storeDestinationRules(savedId, { etiquetas, edad_minima, permite_ninos });
      setNotice({ type: "ok", text: isEdit ? "Destino actualizado correctamente." : "Destino publicado correctamente." });
      if (isEdit) setDestinoEnEdicion(null); else (e.target as HTMLFormElement).reset();
      await cargarDatos();
    }
    setSaving(false);
  };

  const confirmarEliminacion = async () => {
    if (!destinoABorrar) return;
    const { error } = await supabase.from("destinos").delete().eq("id", destinoABorrar);
    if (error) setNotice({ type: "error", text: "No se puede eliminar este destino. Puede tener reservaciones o viajes relacionados." });
    else { setNotice({ type: "ok", text: "Destino eliminado correctamente." }); await cargarDatos(); }
    setDestinoABorrar(null);
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-alm-beige-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-alm-teal"></div>
      </div>
    );

  return (
    <div className="flex h-screen bg-alm-beige-light font-sans relative text-alm-dark">
      {/* MODAL DE ADVERTENCIA */}
      {destinoABorrar && (
        <div className="fixed inset-0 z-[100] bg-alm-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center p-8">
            <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <IconAlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">¿Eliminar Destino?</h2>
            <p className="text-gray-500 mb-8 text-sm">
              Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDestinoABorrar(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminacion}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 flex justify-center items-center gap-2"
              >
                <IconTrash size={20} /> Borrar
              </button>
            </div>
          </div>
        </div>
      )}

      {reservaSeleccionada && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-alm-dark/80 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setReservaSeleccionada(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="reservation-detail-title" className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8">
            <button type="button" onClick={() => setReservaSeleccionada(null)} aria-label="Cerrar detalle" className="absolute right-5 top-5 rounded-full border p-2 text-gray-500 hover:bg-gray-50"><IconX /></button>
            <p className="text-xs font-black uppercase tracking-[.18em] text-alm-teal">Ficha de cliente y reservación</p>
            <h2 id="reservation-detail-title" className="mt-1 pr-12 text-2xl font-black">{reservaSeleccionada.nombre_cliente}</h2>
            <p className="text-sm text-gray-500">Folio: {reservaSeleccionada.folio || reservaSeleccionada.id}</p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border bg-gray-50 p-5">
                <h3 className="flex items-center gap-2 font-black text-alm-mid"><IconUsers size={20} /> Datos del cliente</h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Nombre completo</dt><dd className="font-bold">{[perfilSeleccionado?.nombre, perfilSeleccionado?.apellidos].filter(Boolean).join(" ") || reservaSeleccionada.nombre_cliente}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Correo</dt><dd>{reservaSeleccionada.email_cliente}</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Teléfono</dt><dd>{perfilSeleccionado?.telefono || reservaSeleccionada.telefono || "No registrado"}</dd></div>
                  <div className="grid grid-cols-2 gap-3"><div><dt className="text-xs font-bold uppercase text-gray-400">Nacimiento</dt><dd>{perfilSeleccionado?.fecha_nacimiento ? new Date(`${perfilSeleccionado.fecha_nacimiento}T12:00:00`).toLocaleDateString("es-MX") : "No registrado"}</dd></div><div><dt className="text-xs font-bold uppercase text-gray-400">Edad</dt><dd>{calcularEdad(perfilSeleccionado?.fecha_nacimiento) ?? "No registrada"}</dd></div></div>
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Sexo</dt><dd>{{ femenino: "Femenino", masculino: "Masculino", no_binario: "No binario", prefiero_no_decir: "Prefiere no decir" }[perfilSeleccionado?.sexo || "prefiero_no_decir"]}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border p-5">
                <h3 className="flex items-center gap-2 font-black text-alm-mid"><IconTicket size={20} /> Datos de la reservación</h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Destino</dt><dd className="font-bold">{reservaSeleccionada.titulo_destino}</dd></div>
                  <div className="grid grid-cols-2 gap-3"><div><dt className="text-xs font-bold uppercase text-gray-400">Fecha de viaje</dt><dd>{new Date(`${reservaSeleccionada.fecha_viaje}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" })}</dd></div><div><dt className="text-xs font-bold uppercase text-gray-400">Pasajeros</dt><dd>{reservaSeleccionada.pasajeros}</dd></div></div>
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Total</dt><dd className="text-xl font-black text-alm-teal">${Number(reservaSeleccionada.total_pagar).toLocaleString("es-MX")} MXN</dd></div>
                  <div><dt className="text-xs font-bold uppercase text-gray-400">Estado</dt><dd><span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-black uppercase ${reservaSeleccionada.estado === "cancelada" ? "bg-red-100 text-red-600" : reservaSeleccionada.estado === "confirmada" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{reservaSeleccionada.estado || "pendiente"}</span></dd></div>
                  <label className="block text-xs font-bold uppercase text-gray-400">Estado del pago
                    <select
                      value={normalizePaymentStatus(reservaSeleccionada.estado_pago)}
                      onChange={(event) => void actualizarEstadoPagoReserva(reservaSeleccionada, event.target.value as PaymentStatus)}
                      className="mt-1 block w-full rounded-xl border bg-white px-3 py-2 text-sm font-bold normal-case text-alm-dark"
                    >
                      <option value="pagar">Pagar</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                    </select>
                  </label>
                </dl>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
              <button type="button" onClick={() => actualizarEstadoReserva(reservaSeleccionada, "confirmada")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white">Confirmar</button>
              <button type="button" onClick={() => actualizarEstadoReserva(reservaSeleccionada, "cancelada")} className="rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-700">Cancelar</button>
              <button type="button" onClick={() => actualizarEstadoReserva(reservaSeleccionada, "completada")} className="rounded-xl bg-alm-mid px-4 py-2.5 text-sm font-bold text-white">Marcar completada</button>
              <button type="button" onClick={() => eliminarReserva(reservaSeleccionada)} className="ml-auto flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white"><IconTrash size={18} /> Eliminar definitivamente</button>
            </div>
          </section>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {destinoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-alm-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            <div className="sticky top-0 bg-alm-teal text-white px-8 py-5 flex items-center justify-between z-10 shadow-md">
              <h2 className="text-xl font-black flex items-center gap-2">
                <IconEdit size={24} /> Editando: {destinoEnEdicion.titulo}
              </h2>
              <button
                onClick={() => setDestinoEnEdicion(null)}
                className="p-2 bg-white/20 rounded-full hover:bg-white/40"
              >
                <IconX size={20} />
              </button>
            </div>
            <form onSubmit={guardarDestino} className="p-8 space-y-6">
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase block mb-1">
                  Nombre
                </label>
                <input
                  name="titulo"
                  defaultValue={destinoEnEdicion.titulo}
                  required
                  className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-alm-teal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-bold text-gray-500 uppercase block mb-1">
                    Precio (MXN)
                  </label>
                  <input
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={destinoEnEdicion.precio}
                    required
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-alm-teal"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-orange-500 uppercase block mb-1">
                    Descuento (%)
                  </label>
                  <input
                    name="descuento"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={destinoEnEdicion.descuento || 0}
                    className="w-full px-4 py-3 border border-orange-200 rounded-xl bg-orange-50 text-orange-600 font-bold outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="text-[12px] font-bold uppercase text-gray-500">Categorías
                  <input name="etiquetas" defaultValue={(destinoEnEdicion.etiquetas || ["Familiar"]).join(", ")} placeholder="Familiar, aventura" className="mt-1 w-full rounded-xl border px-4 py-3 font-normal normal-case" />
                </label>
                <label className="text-[12px] font-bold uppercase text-gray-500">Edad mínima
                  <input name="edad_minima" type="number" min="0" max="99" defaultValue={destinoEnEdicion.edad_minima || 0} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal" />
                </label>
                <label className="text-[12px] font-bold uppercase text-gray-500">Admite niños
                  <select name="permite_ninos" defaultValue={destinoEnEdicion.permite_ninos === false ? "false" : "true"} className="mt-1 w-full rounded-xl border px-4 py-3 font-normal normal-case"><option value="true">Sí</option><option value="false">No</option></select>
                </label>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase block mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  defaultValue={destinoEnEdicion.descripcion}
                  required
                  className="w-full px-4 py-3 border rounded-xl h-32 outline-none focus:ring-2 focus:ring-alm-teal"
                ></textarea>
              </div>
              <div className="rounded-xl border bg-gray-50 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase text-alm-mid">Actualizar fotografías (opcional)</p>
                <label className="mb-3 block text-[11px] font-bold uppercase text-gray-500">Nueva portada<input name="imagen_principal" type="file" accept="image/*" className="mt-1 block w-full text-xs" /></label>
                <label className="block text-[11px] font-bold uppercase text-gray-500">Reemplazar carrusel<input name="imagenes_carrusel" type="file" accept="image/*" multiple className="mt-1 block w-full text-xs" /></label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl font-black text-white text-lg bg-alm-teal hover:bg-alm-mid disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Actualizar Destino"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR CONECTADO */}
      <aside className="w-64 bg-alm-dark flex-col hidden md:flex shadow-2xl z-20">
        <div
          className="h-20 flex items-center px-6 border-b border-white/10 cursor-pointer"
          onClick={() => (window.location.href = "/")}
        >
          <IconPlaneDeparture className="text-alm-teal w-8 h-8 mr-2" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-alm-teal italic">Travel</span>
            <span className="text-[18px] font-bold text-white tracking-wide">
              ALMARÉ
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <a href="#resumen" className="w-full flex items-center gap-3 px-4 py-3 bg-alm-teal text-white rounded-xl font-bold shadow-md">
            <IconLayoutDashboard size={20} /> Dashboard General
          </a>
          <a href="#crm" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconUsers size={20} /> CRM Clientes</a>
          <a href="#banners" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconSlideshow size={20} /> Banners</a>
          <a href="#apariencia" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconEdit size={20} /> Marca y apariencia</a>
          <a href="#contacto" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconUsers size={20} /> Contacto</a>
          <a href="#marketplace" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconBuildingSkyscraper size={20} /> Hospedaje y restaurantes</a>
          <a href="#inventario" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconPhoto size={20} /> Inventario</a>
          <a href="#reservaciones" className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 rounded-xl font-bold"><IconTicket size={20} /> Reservaciones</a>
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={cerrarSesion}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-bold transition"
          >
            <IconLogout size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="min-h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
          <button onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 md:hidden" aria-label="Abrir menú administrativo"><IconMenu2 /></button>
          <h2 className="text-xl font-black text-alm-dark">
            Panel Administrativo
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">Admin Supremo</p>
              <p className="text-xs text-alm-teal">Gerencia Almaré</p>
            </div>
            <div className="w-10 h-10 bg-alm-teal rounded-full flex items-center justify-center text-white font-bold">
              AM
            </div>
          </div>
        </header>
        {mobileMenu && <nav className="sticky top-20 z-10 grid grid-cols-2 gap-2 border-b bg-alm-dark p-3 text-sm font-bold text-white md:hidden">{[["Resumen","#resumen"],["CRM","#crm"],["Banners","#banners"],["Apariencia","#apariencia"],["Contacto","#contacto"],["Hospedaje","#marketplace"],["Inventario","#inventario"],["Reservas","#reservaciones"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMobileMenu(false)} className="rounded-lg bg-white/10 px-3 py-2 text-center">{label}</a>)}</nav>}

        <main id="resumen" className="scroll-mt-24 p-4 md:p-8">
          {notice && <div role="status" className={`mb-6 flex items-center justify-between rounded-xl border p-4 text-sm font-bold ${notice.type === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}><span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Cerrar aviso"><IconX size={18} /></button></div>}
          {/* MÉTRICAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-alm-teal">
              <IconCurrencyDollar className="text-alm-teal mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Ventas Reales
              </h3>
              <p className="text-2xl font-black">
                $
                {reservaciones
                  .filter((reserva) => reserva.estado === "confirmada" || reserva.estado === "completada")
                  .reduce((a, b) => a + Number(b.total_pagar || 0), 0)
                  .toLocaleString()}{" "}
                <span className="text-sm text-gray-400">MXN</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <IconUsers className="text-blue-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Clientes Únicos
              </h3>
              <p className="text-2xl font-black">
                {new Set(reservaciones.map((r) => r.email_cliente)).size}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-orange-500">
              <IconCalendarEvent className="text-orange-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Reservaciones
              </h3>
              <p className="text-2xl font-black">{reservaciones.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
              <IconPlaneDeparture className="text-purple-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Destinos
              </h3>
              <p className="text-2xl font-black">{destinos.length}</p>
            </div>
          </div>

          <CrmManager perfiles={perfiles} reservaciones={reservaciones} />

          {/* BANNERS */}
          <div id="banners" className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-black flex items-center gap-2">
                <IconSlideshow className="text-alm-teal" size={24} /> Banners de
                Inicio
              </h2>
              <label className="bg-alm-teal text-white px-5 py-2 rounded-xl text-sm font-bold cursor-pointer hover:bg-alm-mid transition flex gap-2">
                <IconUpload size={18} />{" "}
                {uploadingBanner ? "Subiendo..." : "Subir Foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={subirBanner}
                  disabled={uploadingBanner}
                />
              </label>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="relative group rounded-xl overflow-hidden h-28 border"
                >
                  <Image
                    unoptimized
                    fill
                    sizes="20vw"
                    src={b.imagen_url}
                    alt="Banner de inicio"
                    className="object-cover"
                  />
                  <button
                    onClick={() => borrarBanner(b.id)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"
                  >
                    <IconTrash size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* INVENTARIO Y NUEVO DESTINO */}
          <div className="mb-8"><SiteSettingsManager /></div>
          <div className="mb-8"><SocialLinksManager /></div>
          <MarketplaceManager />

          <div id="inventario" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-1 bg-white rounded-2xl border p-6 shadow-sm">
              <h2 className="font-bold flex items-center gap-2 mb-6 text-alm-teal">
                <IconPlus size={20} /> Nuevo Destino
              </h2>
              <form onSubmit={guardarDestino} className="space-y-4">
                <input
                  name="titulo"
                  placeholder="Nombre del destino"
                  required
                  className="w-full p-3 border rounded-xl text-sm outline-none focus:border-alm-teal"
                />
                <div className="p-3 bg-gray-50 rounded-xl border">
                  <label className="text-[10px] font-bold text-alm-teal uppercase block mb-1">
                    1. Portada
                  </label>
                  <input
                    name="imagen_principal"
                    type="file"
                    accept="image/*"
                    required
                    className="w-full text-xs"
                  />
                  <label className="text-[10px] font-bold text-alm-mid uppercase block mt-3 mb-1">
                    2. Carrusel
                  </label>
                  <input
                    name="imagenes_carrusel"
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full text-xs"
                  />
                </div>
                <textarea
                  name="descripcion"
                  placeholder="Atractivos"
                  required
                  className="w-full p-3 border rounded-xl text-sm h-20 outline-none focus:border-alm-teal"
                ></textarea>
                <div className="flex gap-2">
                  <input
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Precio"
                    required
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:border-alm-teal"
                  />
                  <input
                    name="descuento"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="% Desc"
                    defaultValue="0"
                    className="w-full p-3 border rounded-xl text-sm outline-none text-orange-600 bg-orange-50 focus:border-orange-500"
                  />
                </div>
                <input name="etiquetas" defaultValue="Familiar" placeholder="Categorías: Familiar, aventura" className="w-full rounded-xl border p-3 text-sm outline-none focus:border-alm-teal" />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500">Edad mínima<input name="edad_minima" type="number" min="0" max="99" defaultValue="0" className="mt-1 w-full rounded-xl border p-3 text-sm font-normal" /></label>
                  <label className="text-[10px] font-bold uppercase text-gray-500">Admite niños<select name="permite_ninos" defaultValue="true" className="mt-1 w-full rounded-xl border p-3 text-sm font-normal normal-case"><option value="true">Sí</option><option value="false">No</option></select></label>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full p-3 bg-alm-teal text-white font-bold rounded-xl"
                >
                  {saving ? "Guardando..." : "Publicar"}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h2 className="font-black flex gap-2">
                  <IconPhoto className="text-alm-teal" /> Inventario Operativo
                </h2>
              </div>
              <div className="p-6 grid gap-4">
                {destinos.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row gap-4 items-center p-4 border rounded-xl hover:shadow-md transition"
                  >
                    <Image
                      unoptimized
                      width={96}
                      height={96}
                      src={d.imagen_principal || ""}
                      alt={d.titulo}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{d.titulo}</h3>
                      {Number(d.descuento) > 0 ? <div><p className="text-sm font-bold text-red-500"><span className="line-through">Antes: ${Number(d.precio).toLocaleString("es-MX")}</span><span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs">-{d.descuento}%</span></p><p className="text-lg font-black text-red-600">Ahora: ${(Number(d.precio) * (1 - Number(d.descuento) / 100)).toLocaleString("es-MX")} MXN</p></div> : <p className="font-black text-alm-teal">${Number(d.precio).toLocaleString("es-MX")} MXN</p>}
                      <div className="mt-2 flex flex-wrap gap-1">{(d.etiquetas || ["Familiar"]).map((tag) => <span key={tag} className="rounded-full bg-alm-teal/10 px-2 py-1 text-[10px] font-bold text-alm-mid">{tag}</span>)}</div>
                      <p className={`mt-1 text-xs font-semibold ${d.permite_ninos === false || Number(d.edad_minima) >= 18 ? "text-red-600" : "text-gray-500"}`}>{destinationPolicy(d)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDestinoEnEdicion(d)}
                        aria-label={`Editar ${d.titulo}`}
                        title={`Editar ${d.titulo}`}
                        className="p-3 bg-orange-50 text-orange-500 rounded-lg"
                      >
                        <IconEdit size={20} />
                      </button>
                      <button
                        onClick={() => setDestinoABorrar(d.id)}
                        aria-label={`Eliminar ${d.titulo}`}
                        title={`Eliminar ${d.titulo}`}
                        className="p-3 bg-red-50 text-red-500 rounded-lg"
                      >
                        <IconTrash size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <PaymentSettingsManager />

          {/* NUEVA SECCIÓN: GESTIÓN DE RESERVACIONES */}
          <div id="reservaciones" className="scroll-mt-24 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-5 border-b bg-gray-50 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <h2 className="font-black flex items-center gap-2">
                <IconTicket className="text-alm-teal" size={24} /> Gestión de
                Reservaciones
              </h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative"><IconSearch className="absolute left-3 top-2.5 text-gray-400" size={18} /><input value={busquedaReserva} onChange={(e) => setBusquedaReserva(e.target.value)} placeholder="Folio, cliente o destino" className="w-full rounded-lg border bg-white py-2 pl-10 pr-3 text-sm sm:w-64" /></label>
                <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm" />
                <button onClick={() => { setRefreshing(true); void cargarDatos(); }} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold disabled:opacity-50"><IconRefresh className={refreshing ? "animate-spin" : ""} size={18} /> Actualizar</button>
                <button onClick={exportarReservas} disabled={reservasVisibles.length === 0} className="flex items-center justify-center gap-2 rounded-lg bg-alm-teal px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><IconDownload size={18} /> Exportar</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-alm-beige-light/50 text-xs uppercase text-alm-dark">
                  <tr>
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Destino</th>
                    <th className="px-6 py-4 font-bold">Fecha Viaje</th>
                    <th className="px-6 py-4 font-bold text-center">
                      Pasajeros
                    </th>
                    <th className="px-6 py-4 font-bold text-right">
                      Total (MXN)
                    </th>
                    <th className="px-6 py-4 font-bold">Pago</th>
                    <th className="px-6 py-4 font-bold">Estado</th>
                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservasVisibles.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        {reservaciones.length === 0 ? "Aún no hay reservaciones registradas." : "No hay resultados para estos filtros."}
                      </td>
                    </tr>
                  )}
                  {reservasVisibles.map((res) => (
                    <tr key={res.id} onClick={() => setReservaSeleccionada(res)} className="cursor-pointer hover:bg-gray-50 transition" title="Abrir ficha completa">
                      <td className="px-6 py-4">
                        <p className="font-bold text-alm-dark">
                          {res.nombre_cliente}
                        </p>
                        <p className="text-xs text-alm-teal">
                          {res.email_cliente}
                        </p>
                        <p className="text-xs text-gray-400">{res.telefono}</p>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {res.titulo_destino}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(`${res.fecha_viaje}T12:00:00`).toLocaleDateString("es-MX")}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {res.pasajeros}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-alm-teal">
                        ${Number(res.total_pagar).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={normalizePaymentStatus(res.estado_pago)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            void actualizarEstadoPagoReserva(
                              res,
                              event.target.value as PaymentStatus,
                            );
                          }}
                          aria-label={`Estado de pago de ${res.nombre_cliente}`}
                          className="rounded-lg border px-2 py-2 text-xs font-bold"
                        >
                          <option value="pagar">Pagar</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="pagado">Pagado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${res.estado === "cancelada" ? "bg-red-100 text-red-600" : res.estado === "confirmada" ? "bg-emerald-100 text-emerald-700" : res.estado === "completada" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{res.estado || "pendiente"}</span></td>
                      <td className="px-6 py-4 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); setReservaSeleccionada(res); }} className="rounded-lg border border-alm-mid px-3 py-2 text-xs font-bold text-alm-mid">Ver ficha</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
