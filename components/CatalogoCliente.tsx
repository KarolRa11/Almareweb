"use client";
import { useState, useEffect } from "react";
import {
  IconX,
  IconCalendarEvent,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconMaximize,
} from "@tabler/icons-react";
import { createBrowserClient } from "@supabase/ssr";

const fallbackImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000",
];

export default function CatalogoCliente({ destinos }: { destinos: any[] }) {
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<any | null>(
    null,
  );
  const [isBooking, setIsBooking] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Motores de Carrusel
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [cardImgIndex, setCardImgIndex] = useState(0);
  const [modalImgIndex, setModalImgIndex] = useState(0);
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user));
  }, [supabase]);

  // ANIMACIÓN: Cambia la foto de la tarjeta al pasar el mouse (hover)
  useEffect(() => {
    let interval: any;
    if (hoveredCardId) {
      interval = setInterval(() => setCardImgIndex((prev) => prev + 1), 1200);
    } else {
      setCardImgIndex(0);
    }
    return () => clearInterval(interval);
  }, [hoveredCardId]);

  // ANIMACIÓN: Carrusel automático dentro del modal
  useEffect(() => {
    let interval: any;
    if (destinoSeleccionado && !isBooking && !fullScreenImg) {
      interval = setInterval(() => {
        const totalFotos = destinoSeleccionado.imagenes?.length || 1;
        setModalImgIndex((prev) => (prev + 1) % totalFotos);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [destinoSeleccionado, isBooking, fullScreenImg]);

  const procesarReserva = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return alert("Debes iniciar sesión para reservar.");
    const formData = new FormData(e.currentTarget);
    const pasajeros = Number(formData.get("pasajeros"));
    const total = destinoSeleccionado.precio * pasajeros;

    const { error } = await supabase.from("reservaciones").insert({
      destino_id: destinoSeleccionado.id,
      titulo_destino: destinoSeleccionado.titulo,
      nombre_cliente: formData.get("nombre"),
      email_cliente: formData.get("email"),
      telefono: formData.get("telefono"),
      fecha_viaje: formData.get("fecha"),
      pasajeros,
      total_pagar: total,
    });

    if (!error) setReservaExitosa(true);
  };

  const cerrarTodo = () => {
    setDestinoSeleccionado(null);
    setIsBooking(false);
    setReservaExitosa(false);
    setModalImgIndex(0);
  };

  if (!destinos || destinos.length === 0)
    return <p className="text-gray-500">Actualizando catálogo...</p>;

  return (
    <>
      {/* GRID DE DESTINOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {destinos.map((d) => {
          const fotos =
            d.imagenes && d.imagenes.length > 0
              ? d.imagenes
              : [d.imagen_principal || fallbackImages[0]];
          const imagenActual =
            hoveredCardId === d.id
              ? fotos[cardImgIndex % fotos.length]
              : fotos[0];

          return (
            <div
              key={d.id}
              onMouseEnter={() => setHoveredCardId(d.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              onClick={() => {
                setDestinoSeleccionado(d);
                setModalImgIndex(0);
              }}
              className="group border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-[420px]"
            >
              <div className="h-52 overflow-hidden relative bg-gray-900">
                <img
                  src={imagenActual}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                {fotos.length > 1 && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    {fotos.map((_: any, i: number) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${i === cardImgIndex % fotos.length && hoveredCardId === d.id ? "w-4 bg-white" : "w-1.5 bg-white/40"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <h3 className="text-[18px] font-black text-alm-dark mb-2 group-hover:text-alm-teal transition">
                    {d.titulo}
                  </h3>
                  <p className="text-[13px] text-gray-600 line-clamp-3">
                    {d.descripcion}
                  </p>
                </div>
                <div className="pt-4 border-t flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">
                      Desde
                    </span>
                    <span className="text-[18px] font-black text-alm-mid">
                      ${d.precio}{" "}
                      <span className="text-[10px] font-normal">MXN</span>
                    </span>
                  </div>
                  <button className="bg-alm-teal text-white text-[11px] font-bold px-5 py-2.5 rounded-xl shadow-md group-hover:bg-alm-dark transition-all">
                    Ver Más
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DEL DESTINO CON CARRUSEL ACTIVO */}
      {destinoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-alm-dark/90 backdrop-blur-md transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300">
            <button
              onClick={cerrarTodo}
              className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2.5 rounded-full hover:bg-black transition"
            >
              <IconX size={20} />
            </button>

            {/* SECCIÓN MULTIMEDIA (CARRUSEL) */}
            <div className="w-full md:w-1/2 relative bg-black hidden md:block group">
              <img
                src={
                  destinoSeleccionado.imagenes?.[modalImgIndex] ||
                  destinoSeleccionado.imagen_principal ||
                  fallbackImages[0]
                }
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
              />

              <button
                onClick={() =>
                  setFullScreenImg(
                    destinoSeleccionado.imagenes?.[modalImgIndex] ||
                      destinoSeleccionado.imagen_principal,
                  )
                }
                className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-lg hover:bg-black transition backdrop-blur-sm"
              >
                <IconMaximize size={20} />
              </button>

              {/* Botones de Navegación Manual */}
              {destinoSeleccionado.imagenes?.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setModalImgIndex((prev) =>
                        prev === 0
                          ? destinoSeleccionado.imagenes.length - 1
                          : prev - 1,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black backdrop-blur-sm transition"
                  >
                    <IconChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() =>
                      setModalImgIndex(
                        (prev) =>
                          (prev + 1) % destinoSeleccionado.imagenes.length,
                      )
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black backdrop-blur-sm transition"
                  >
                    <IconChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {destinoSeleccionado.imagenes.map((_: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setModalImgIndex(i)}
                        className={`h-2 rounded-full transition-all shadow-lg ${i === modalImgIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* INFO Y RESERVACIÓN */}
            <div className="w-full md:w-1/2 p-10 flex flex-col overflow-y-auto">
              {!isBooking ? (
                <>
                  <span className="text-alm-teal text-[10px] font-black uppercase tracking-widest mb-3 block">
                    Expedición Confirmada
                  </span>
                  <h2 className="text-4xl font-black text-alm-dark mb-4">
                    {destinoSeleccionado.titulo}
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed text-sm">
                    {destinoSeleccionado.descripcion}
                  </p>

                  <div className="bg-gray-50 p-6 rounded-2xl mb-auto border border-gray-100">
                    <p className="text-xs text-alm-teal font-black uppercase mb-1">
                      Precio por persona
                    </p>
                    <p className="text-5xl font-black text-alm-dark">
                      ${destinoSeleccionado.precio}{" "}
                      <span className="text-base text-gray-400 font-medium">
                        MXN
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      user
                        ? setIsBooking(true)
                        : alert("Debes iniciar sesión para reservar.")
                    }
                    className="mt-8 w-full bg-alm-teal text-white py-4 rounded-xl font-black text-lg hover:bg-alm-mid transition flex justify-center items-center gap-2 shadow-xl shadow-alm-teal/30"
                  >
                    <IconCalendarEvent size={24} />{" "}
                    {user ? "Reservar Ahora" : "Inicia sesión para reservar"}
                  </button>
                </>
              ) : reservaExitosa ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <IconCheck size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-alm-dark mb-2">
                    ¡Reserva Exitosa!
                  </h2>
                  <p className="text-gray-500 mb-8">
                    Tu aventura en {destinoSeleccionado.titulo} ha sido
                    registrada.
                  </p>
                  <button
                    onClick={cerrarTodo}
                    className="w-full bg-gray-100 text-alm-dark py-4 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Regresar al catálogo
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={procesarReserva}
                  className="flex flex-col h-full animate-in slide-in-from-right-8 duration-300"
                >
                  <h2 className="text-2xl font-black text-alm-dark mb-1">
                    Finaliza tu reserva
                  </h2>
                  <p className="text-sm text-alm-teal font-bold mb-6">
                    {destinoSeleccionado.titulo}
                  </p>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        Nombre Completo
                      </label>
                      <input
                        required
                        name="nombre"
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-alm-teal"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Correo
                        </label>
                        <input
                          required
                          name="email"
                          type="email"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-alm-teal"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Teléfono
                        </label>
                        <input
                          required
                          name="telefono"
                          type="tel"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-alm-teal"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Fecha de Viaje
                        </label>
                        <input
                          required
                          name="fecha"
                          type="date"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-alm-teal"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase">
                          Pasajeros
                        </label>
                        <input
                          required
                          name="pasajeros"
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-alm-teal"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBooking(false)}
                      className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-alm-teal text-white py-4 rounded-xl font-black shadow-lg hover:bg-alm-mid"
                    >
                      Confirmar Compra
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA COMPLETA (LIGHTBOX) PARA FOTOS */}
      {fullScreenImg && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-200">
          <button
            onClick={() => setFullScreenImg(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition"
          >
            <IconX size={40} />
          </button>
          <img
            src={fullScreenImg}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
