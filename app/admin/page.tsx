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
  IconLayoutDashboard,
  IconCalendarEvent,
  IconLogout,
  IconEdit,
  IconCurrencyDollar,
  IconMapPin,
  IconX,
} from "@tabler/icons-react";

export const dynamic = "force-dynamic";

// Blindaje contra errores de Next.js al leer parámetros de la URL
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: any;
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

  const { data: destinos } = await supabase
    .from("destinos")
    .select("*")
    .order("precio", { ascending: true });
  const { data: reservaciones } = await supabase
    .from("reservaciones")
    .select("*");

  const totalDestinos = destinos?.length || 0;
  // Tipado estricto (acc: number, curr: any) para evitar el error "Implicit Any" de TypeScript
  const ventasTotales =
    reservaciones?.reduce(
      (acc: number, curr: any) => acc + Number(curr.total_pagar || 0),
      0,
    ) || 0;
  const totalReservas = reservaciones?.length || 0;
  const clientesUnicos = new Set(
    reservaciones?.map((r: any) => r.email_cliente),
  ).size;

  // Resolución segura de parámetros para evitar advertencias en consola
  const resolvedParams = await Promise.resolve(searchParams);
  const editId = resolvedParams?.edit;
  const destinoEnEdicion =
    editId && destinos ? destinos.find((d: any) => d.id === editId) : null;

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
    redirect("/");
  }

  async function guardarDestino(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const titulo = formData.get("titulo") as string;
    const descripcion = formData.get("descripcion") as string;
    const precio = Number(formData.get("precio"));

    // Tipado seguro (as unknown as File[]) para evitar choques de FormData
    const imagenPrincipalFile = formData.get("imagen_principal") as File | null;
    const carruselFiles = formData.getAll(
      "imagenes_carrusel",
    ) as unknown as File[];

    const imagenActual = formData.get("imagen_actual") as string;
    const carruselActual = formData.get("carrusel_actual") as string;

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
    if (imagenPrincipalFile && imagenPrincipalFile.size > 0) {
      const ext = imagenPrincipalFile.name.split(".").pop();
      const fileName = `principal-${Date.now()}.${ext}`;
      const { data } = await supabaseServer.storage
        .from("destinos")
        .upload(`portadas/${fileName}`, imagenPrincipalFile);
      if (data) {
        imagenUrl = supabaseServer.storage
          .from("destinos")
          .getPublicUrl(data.path).data.publicUrl;
      }
    }

    // Prevención de cuelgues si el JSON.parse falla
    let arrayImagenes: string[] = [];
    try {
      if (carruselActual) arrayImagenes = JSON.parse(carruselActual);
    } catch (e) {
      arrayImagenes = [];
    }

    let nuevasFotosSubidas = false;
    const nuevasUrls: string[] = [];

    for (const file of carruselFiles) {
      if (file && file.size > 0) {
        nuevasFotosSubidas = true;
        const ext = file.name.split(".").pop();
        const fileName = `carrusel-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
        const { data } = await supabaseServer.storage
          .from("destinos")
          .upload(`portadas/${fileName}`, file);
        if (data) {
          nuevasUrls.push(
            supabaseServer.storage.from("destinos").getPublicUrl(data.path).data
              .publicUrl,
          );
        }
      }
    }

    // .filter(Boolean) asegura que no se guarden espacios nulos o rotos en el carrusel
    if (nuevasFotosSubidas) {
      arrayImagenes = [imagenUrl, ...nuevasUrls].filter(Boolean);
    } else if (imagenUrl && !arrayImagenes.includes(imagenUrl)) {
      arrayImagenes = [imagenUrl, ...arrayImagenes].filter(Boolean);
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
          imagenes: arrayImagenes,
        })
        .eq("id", id);
    } else {
      await supabaseServer
        .from("destinos")
        .insert({
          titulo,
          nombre: titulo,
          descripcion,
          precio,
          imagen_principal: imagenUrl,
          imagenes: arrayImagenes,
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
    redirect("/admin");
  }

  return (
    <div className="flex h-screen bg-alm-beige-light font-sans relative">
      {/* MODAL DE EDICIÓN FLOTANTE */}
      {destinoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-alm-dark/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-orange-500 text-white px-8 py-5 flex items-center justify-between z-10">
              <h2 className="text-xl font-black flex items-center gap-2">
                <IconEdit size={24} /> Editando: {destinoEnEdicion.titulo}
              </h2>
              <a
                href="/admin"
                className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition"
              >
                <IconX size={20} />
              </a>
            </div>

            <form action={guardarDestino} className="p-8 space-y-6">
              <input type="hidden" name="id" value={destinoEnEdicion.id} />
              <input
                type="hidden"
                name="imagen_actual"
                value={destinoEnEdicion.imagen_principal || ""}
              />
              <input
                type="hidden"
                name="carrusel_actual"
                value={JSON.stringify(destinoEnEdicion.imagenes || [])}
              />

              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase mb-2 block">
                  Nombre del Destino
                </label>
                <input
                  name="titulo"
                  type="text"
                  defaultValue={destinoEnEdicion.titulo}
                  required
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-gray-50 rounded-2xl border border-gray-200">
                <div>
                  <label className="text-[11px] font-bold text-alm-teal uppercase mb-2 flex items-center gap-1">
                    <IconUpload size={16} /> 1. Foto Principal
                  </label>
                  <input
                    name="imagen_principal"
                    type="file"
                    accept="image/*"
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-alm-teal file:text-white cursor-pointer hover:file:bg-alm-mid"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-orange-500 uppercase mb-2 flex items-center gap-1">
                    <IconPhoto size={16} /> 2. Fotos Extra (Carrusel)
                  </label>
                  <input
                    name="imagenes_carrusel"
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white cursor-pointer hover:file:bg-orange-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Sube 2 o más fotos a la vez.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase mb-2 block">
                  Atractivos y Descripción
                </label>
                <textarea
                  name="descripcion"
                  defaultValue={destinoEnEdicion.descripcion}
                  required
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 h-32 outline-none focus:ring-2 focus:ring-orange-500"
                ></textarea>
              </div>
              <div>
                <label className="text-[12px] font-bold text-gray-500 uppercase mb-2 block">
                  Precio Base (MXN)
                </label>
                <input
                  name="precio"
                  type="number"
                  defaultValue={destinoEnEdicion.precio}
                  required
                  className="w-full px-5 py-3 border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-black text-white text-lg bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 transition-all"
              >
                Actualizar Destino
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BARRA LATERAL */}
      <aside className="w-64 bg-alm-dark flex-col hidden md:flex shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-white/10">
          <IconPlaneDeparture className="text-alm-teal w-8 h-8 mr-2" />
          <div className="flex flex-col leading-none">
            <span className="text-[11px] text-alm-teal italic">Travel</span>
            <span className="text-[18px] font-bold text-white tracking-wide">
              ALMARÉ
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 bg-alm-teal/20 text-alm-teal rounded-xl font-bold transition"
          >
            <IconLayoutDashboard size={20} /> Dashboard General
          </a>
          <a
            href="/admin"
            className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl font-bold transition"
          >
            <IconMapPin size={20} /> Gestión de Destinos
          </a>
        </nav>
        <div className="p-4 border-t border-white/10">
          <form action={cerrarSesion}>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-bold transition">
              <IconLogout size={20} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-black text-alm-dark">
            Panel Administrativo
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-alm-dark">Admin Supremo</p>
              <p className="text-xs text-alm-teal">Gerencia Almaré</p>
            </div>
            <div className="w-10 h-10 bg-alm-teal rounded-full flex items-center justify-center text-white font-bold shadow-md">
              AM
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-alm-teal">
              <IconCurrencyDollar className="text-alm-teal mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Ventas Reales
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                ${ventasTotales.toLocaleString()}{" "}
                <span className="text-sm text-gray-400">MXN</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
              <IconUsers className="text-blue-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Clientes
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {clientesUnicos}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-orange-500">
              <IconCalendarEvent className="text-orange-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Reservaciones
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {totalReservas}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-purple-500">
              <IconPlaneDeparture className="text-purple-500 mb-2" size={28} />
              <h3 className="text-xs font-bold text-gray-500 uppercase">
                Destinos
              </h3>
              <p className="text-2xl font-black text-alm-dark">
                {totalDestinos}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-28">
                <div className="px-6 py-4 border-b rounded-t-2xl text-white bg-alm-teal flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <IconPlus size={20} /> Nuevo Destino
                  </h2>
                </div>

                <form action={guardarDestino} className="p-6 space-y-5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                      Nombre del Destino
                    </label>
                    <input
                      name="titulo"
                      type="text"
                      required
                      className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-alm-teal"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-alm-teal uppercase mb-1 flex items-center gap-1">
                        <IconUpload size={14} /> 1. Foto Principal (Portada)
                      </label>
                      <input
                        name="imagen_principal"
                        type="file"
                        accept="image/*"
                        required
                        className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-alm-teal file:text-white cursor-pointer"
                      />
                    </div>
                    <div className="border-t pt-3">
                      <label className="text-[11px] font-bold text-alm-mid uppercase mb-1 flex items-center gap-1">
                        <IconPhoto size={14} /> 2. Fotos Extras (Carrusel)
                      </label>
                      <input
                        name="imagenes_carrusel"
                        type="file"
                        accept="image/*"
                        multiple
                        className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-alm-mid file:text-white cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                      Atractivos
                    </label>
                    <textarea
                      name="descripcion"
                      required
                      className="w-full px-4 py-3 border rounded-xl bg-gray-50 h-24 text-sm outline-none focus:ring-2 focus:ring-alm-teal"
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                      Precio (MXN)
                    </label>
                    <input
                      name="precio"
                      type="number"
                      required
                      className="w-full px-4 py-3 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-alm-teal"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-black text-white text-lg bg-alm-teal hover:bg-alm-mid shadow-xl shadow-alm-teal/30 transition-all"
                  >
                    Crear y Publicar
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-black text-alm-dark flex items-center gap-2">
                    <IconPhoto className="text-alm-teal" size={24} /> Inventario
                    Operativo
                  </h2>
                </div>

                <div className="p-6 grid grid-cols-1 gap-5">
                  {destinos?.map((d: any) => (
                    <div
                      key={d.id}
                      className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-6 items-center shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative w-full sm:w-40 h-28 rounded-xl overflow-hidden shadow-inner">
                        <img
                          src={
                            d.imagen_principal ||
                            "https://via.placeholder.com/150"
                          }
                          alt={d.titulo}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
                          <IconPhoto size={12} /> {d.imagenes?.length || 1}
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-black text-alm-dark text-xl">
                          {d.titulo}
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {d.descripcion}
                        </p>
                        <p className="text-lg font-black text-alm-teal mt-2">
                          ${d.precio}{" "}
                          <span className="text-xs font-medium">MXN</span>
                        </p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                        <a
                          href={`/admin?edit=${d.id}`}
                          className="flex-1 sm:flex-none p-4 text-orange-500 bg-orange-50 hover:bg-orange-500 hover:text-white rounded-xl transition-all flex justify-center items-center shadow-sm"
                        >
                          <IconEdit size={22} />
                        </a>
                        <form
                          action={eliminarDestino}
                          className="flex-1 sm:flex-none"
                        >
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="w-full p-4 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-all flex justify-center items-center shadow-sm"
                          >
                            <IconTrash size={22} />
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
