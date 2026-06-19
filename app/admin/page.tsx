import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  IconUsers,
  IconPlaneDeparture,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconUpload,
  IconMenu2,
  IconLayoutDashboard,
  IconCalendarEvent,
  IconChartBar,
  IconSettings,
  IconLogout,
  IconEdit,
  IconCurrencyDollar,
  IconMapPin,
} from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { edit?: string };
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    },
  );

  // 1. Obtener Datos Reales de Destinos y Reservaciones
  const { data: destinos } = await supabase
    .from("destinos")
    .select("*")
    .order("creado_en", { ascending: false });
  const { data: reservaciones } = await supabase
    .from("reservaciones")
    .select("*");

  const totalDestinos = destinos?.length || 0;

  // 2. CÁLCULO DE MÉTRICAS REALES (Matemáticas del negocio)
  const ventasTotales =
    reservaciones?.reduce((acc, curr) => acc + Number(curr.total_pagar), 0) ||
    0;
  const totalReservas = reservaciones?.length || 0;
  // Calculamos clientes únicos basándonos en el correo electrónico
  const clientesUnicos = new Set(reservaciones?.map((r) => r.email_cliente))
    .size;

  const editId = searchParams?.edit;
  const destinoEnEdicion = editId
    ? destinos?.find((d) => d.id === editId)
    : null;

  async function cerrarSesion() {
    "use server";
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );
    await supabaseServer.auth.signOut();
    redirect("/login");
  }

  async function guardarDestino(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const precio = Number(formData.get("precio"));
    const imagenFile = formData.get("imagen") as File;
    const imagenActual = formData.get("imagen_actual") as string;

    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );

    let imagenUrl = imagenActual;
    if (imagenFile && imagenFile.size > 0) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${imagenFile.name.split(".").pop()}`;
      const { data: uploadData, error } = await supabaseServer.storage
        .from("destinos")
        .upload(`portadas/${fileName}`, imagenFile);
      if (!error && uploadData) {
        imagenUrl = supabaseServer.storage
          .from("destinos")
          .getPublicUrl(uploadData.path).data.publicUrl;
      }
    }

    if (id) {
      await supabaseServer
        .from("destinos")
        .update({
          titulo,
          nombre: titulo,
          descripcion,
          precio,
          imagen_principal: imagenUrl,
        })
        .eq("id", id);
    } else {
      await supabaseServer
        .from("destinos")
        .insert({
          nombre: titulo,
          titulo,
          descripcion,
          precio,
          imagen_principal: imagenUrl || null,
          icono: "IconMapPin",
          color_fondo: "from-alm-teal to-alm-dark",
        });
    }

    revalidatePath("/");
    redirect("/admin");
  }

  async function eliminarDestino(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      },
    );
    await supabaseServer.from("destinos").delete().eq("id", id);
    revalidatePath("/admin");
    revalidatePath("/");
  }

  return (
    <div className="flex h-screen bg-alm-beige-light dark:bg-gray-900 overflow-hidden font-sans">
      {/* BARRA LATERAL (CORREGIDA) */}
      <aside className="w-64 bg-alm-dark flex-col hidden md:flex shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <IconPlaneDeparture className="text-alm-teal w-8 h-8 mr-2" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-alm-teal italic font-serif">
              Travel
            </span>
            <span className="text-[18px] font-bold text-white tracking-wide">
              ALMARÉ
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 bg-alm-teal/20 text-alm-teal rounded-xl font-medium transition"
          >
            <IconLayoutDashboard size={20} /> Dashboard General
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition"
          >
            <IconMapPin size={20} /> Gestión de Destinos
          </a>
          <a
            href="#"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-medium transition"
          >
            <IconCalendarEvent size={20} /> Ver Reservaciones
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action={cerrarSesion}>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-medium transition">
              <IconLogout size={20} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-alm-dark">
              Panel Administrativo
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-alm-dark">Admin Maestro</p>
              <p className="text-xs text-alm-teal">Gerencia Almaré</p>
            </div>
            <div className="w-10 h-10 bg-alm-teal rounded-full flex items-center justify-center text-white font-bold shadow-md">
              AM
            </div>
          </div>
        </header>

        <main className="p-8">
          {/* KPI REALES CONECTADOS A LA BASE DE DATOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-alm-teal">
              <IconCurrencyDollar className="text-alm-teal mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ventas Reales
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                ${ventasTotales.toLocaleString()}{" "}
                <span className="text-sm font-medium text-gray-400">MXN</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-blue-500">
              <IconUsers className="text-blue-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Clientes en Cartera
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {clientesUnicos}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-orange-500">
              <IconCalendarEvent className="text-orange-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Reservaciones
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {totalReservas}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center border-l-4 border-l-purple-500">
              <IconPlaneDeparture className="text-purple-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Destinos Ofertados
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {totalDestinos}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORMULARIO CRUD */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-28">
                <div
                  className={`px-6 py-4 border-b rounded-t-2xl text-white flex items-center justify-between ${destinoEnEdicion ? "bg-orange-500" : "bg-alm-teal"}`}
                >
                  <h2 className="font-bold flex items-center gap-2">
                    {destinoEnEdicion ? (
                      <>
                        <IconEdit size={20} /> Editando Destino
                      </>
                    ) : (
                      <>
                        <IconPlus size={20} /> Nuevo Destino
                      </>
                    )}
                  </h2>
                  {destinoEnEdicion && (
                    <a
                      href="/admin"
                      className="text-xs underline hover:text-white/80"
                    >
                      Cancelar
                    </a>
                  )}
                </div>

                <form
                  action={guardarDestino}
                  className="p-6 space-y-4"
                  encType="multipart/form-data"
                >
                  <input
                    type="hidden"
                    name="id"
                    value={destinoEnEdicion?.id || ""}
                  />
                  <input
                    type="hidden"
                    name="imagen_actual"
                    value={destinoEnEdicion?.imagen_principal || ""}
                  />

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                      Nombre de la Zona
                    </label>
                    <input
                      name="titulo"
                      type="text"
                      defaultValue={destinoEnEdicion?.titulo || ""}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-alm-teal outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                      <IconUpload size={14} />{" "}
                      {destinoEnEdicion?.imagen_principal
                        ? "Cambiar Foto (Opcional)"
                        : "Subir Foto Principal"}
                    </label>
                    <input
                      name="imagen"
                      type="file"
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm cursor-pointer file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-alm-teal file:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                      Atractivos
                    </label>
                    <textarea
                      name="descripcion"
                      defaultValue={destinoEnEdicion?.descripcion || ""}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 h-28 text-sm focus:ring-2 focus:ring-alm-teal outline-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                      Precio Base (MXN)
                    </label>
                    <input
                      name="precio"
                      type="number"
                      defaultValue={destinoEnEdicion?.precio || ""}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-alm-teal outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-3.5 rounded-xl font-bold text-white transition shadow-lg ${destinoEnEdicion ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30" : "bg-alm-teal hover:bg-alm-mid shadow-alm-teal/30"}`}
                  >
                    {destinoEnEdicion
                      ? "Actualizar Destino"
                      : "Guardar y Publicar"}
                  </button>
                </form>
              </div>
            </div>

            {/* LISTADO DE INVENTARIO */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-bold text-alm-dark flex items-center gap-2">
                    <IconPhoto className="text-alm-teal" size={20} /> Inventario
                    Operativo
                  </h2>
                </div>

                <div className="p-6 grid grid-cols-1 gap-4">
                  {totalDestinos === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">
                      No hay destinos registrados en el sistema.
                    </p>
                  )}
                  {destinos?.map((d) => (
                    <div
                      key={d.id}
                      className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-5 items-center shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={
                          d.imagen_principal ||
                          "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=150"
                        }
                        alt={d.titulo}
                        className="w-full sm:w-32 h-24 rounded-lg object-cover bg-gray-100"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-bold text-alm-dark text-lg">
                          {d.titulo}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 pr-4">
                          {d.descripcion}
                        </p>
                        <p className="text-sm font-black text-alm-teal mt-2">
                          ${d.precio} MXN
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <a
                          href={`/admin?edit=${d.id}`}
                          className="flex-1 sm:flex-none p-3 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-xl transition flex justify-center items-center gap-2"
                        >
                          <IconEdit size={20} />{" "}
                          <span className="text-xs font-bold sm:hidden">
                            Editar
                          </span>
                        </a>
                        <form
                          action={eliminarDestino}
                          className="flex-1 sm:flex-none"
                        >
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="w-full p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition flex justify-center items-center gap-2"
                          >
                            <IconTrash size={20} />{" "}
                            <span className="text-xs font-bold sm:hidden">
                              Borrar
                            </span>
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
