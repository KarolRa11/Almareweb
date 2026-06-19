"use client";
import { useState } from "react";
import { IconX, IconCalendarEvent, IconCheck } from "@tabler/icons-react";
import { createBrowserClient } from "@supabase/ssr";

const defaultImages = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
];

export default function CatalogoCliente({ destinos }: { destinos: any[] }) {
  const [destinoSeleccionado, setDestinoSeleccionado] = useState<any | null>(
    null,
  );
  const [isBooking, setIsBooking] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cliente de Supabase para el navegador
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const procesarReserva = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
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
      pasajeros: pasajeros,
      total_pagar: total,
    });

    setLoading(false);
    if (!error) {
      setReservaExitosa(true);
    } else {
      alert("Hubo un error al procesar la reserva. Intenta de nuevo.");
    }
  };

  const cerrarModal = () => {
    setDestinoSeleccionado(null);
    setIsBooking(false);
    setReservaExitosa(false);
  };

  if (!destinos || destinos.length === 0)
    return <p className="text-gray-500">Actualizando catálogo...</p>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {destinos.map((d) => (
          <div
            key={d.id}
            onClick={() => setDestinoSeleccionado(d)}
            className="group border border-alm-beige-mid dark:border-gray-700 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col h-[420px]"
          >
            <div className="h-52 overflow-hidden relative bg-gray-200">
              <img
                src={d.imagen_principal || defaultImages[0]}
                alt={d.titulo}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-5 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-[18px] font-black text-alm-dark mb-2">
                  {d.titulo}
                </h3>
                <p className="text-[13px] text-gray-600 line-clamp-3">
                  {d.descripcion}
                </p>
              </div>
              <div className="pt-4 border-t flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-bold">
                    Inversión
                  </span>
                  <span className="text-[18px] font-black text-alm-mid">
                    ${d.precio}{" "}
                    <span className="text-[10px] font-normal">MXN</span>
                  </span>
                </div>
                <button className="bg-alm-teal/10 text-alm-teal text-[11px] font-bold px-4 py-2 rounded-xl group-hover:bg-alm-teal group-hover:text-white transition-all">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {destinoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-alm-dark/80 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row relative">
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black transition"
            >
              <IconX size={20} />
            </button>

            <div className="w-full md:w-1/2 relative bg-gray-200 h-[300px] md:h-auto hidden md:block">
              <img
                src={destinoSeleccionado.imagen_principal || defaultImages[0]}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
              {!isBooking ? (
                <>
                  <span className="text-alm-teal text-xs font-bold uppercase tracking-wide mb-2 block">
                    Experiencia Garantizada
                  </span>
                  <h2 className="text-3xl font-bold text-alm-dark mb-4">
                    {destinoSeleccionado.titulo}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {destinoSeleccionado.descripcion}
                  </p>
                  <div className="bg-gray-50 p-5 rounded-xl mb-8 border border-gray-100">
                    <p className="text-xs text-alm-teal font-bold uppercase mb-1">
                      Precio por persona
                    </p>
                    <p className="text-4xl font-black text-alm-dark">
                      ${destinoSeleccionado.precio}{" "}
                      <span className="text-sm text-gray-500 font-medium">
                        MXN
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBooking(true)}
                    className="mt-auto w-full bg-alm-teal text-white py-4 rounded-xl font-bold text-lg hover:bg-alm-mid transition flex justify-center items-center gap-2 shadow-lg"
                  >
                    <IconCalendarEvent size={24} /> Iniciar Reservación
                  </button>
                </>
              ) : reservaExitosa ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <IconCheck size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-alm-dark mb-2">
                    ¡Reserva Confirmada!
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Hemos recibido tu solicitud para{" "}
                    {destinoSeleccionado.titulo}. Un agente de Travel Almaré te
                    contactará pronto.
                  </p>
                  <button
                    onClick={cerrarModal}
                    className="w-full bg-gray-100 text-alm-dark py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Volver al catálogo
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={procesarReserva}
                  className="flex flex-col h-full"
                >
                  <h2 className="text-2xl font-bold text-alm-dark mb-1">
                    Completa tu reserva
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Destino: {destinoSeleccionado.titulo}
                  </p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Nombre Completo
                      </label>
                      <input
                        required
                        name="nombre"
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Correo
                        </label>
                        <input
                          required
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Teléfono
                        </label>
                        <input
                          required
                          name="telefono"
                          type="tel"
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Fecha de Viaje
                        </label>
                        <input
                          required
                          name="fecha"
                          type="date"
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Pasajeros
                        </label>
                        <input
                          required
                          name="pasajeros"
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBooking(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-alm-teal text-white py-3 rounded-xl font-bold hover:bg-alm-mid shadow-lg disabled:opacity-50"
                    >
                      {loading ? "Procesando..." : "Confirmar y Pagar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
