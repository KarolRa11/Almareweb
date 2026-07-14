import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { IconPlaneDeparture } from "@tabler/icons-react";
import CrmManager from "@/components/admin/CrmManager";
import CrmLogoutButton from "@/components/admin/CrmLogoutButton";
import { isAdminIdentity, isCrmStaff } from "@/lib/admin-auth";
import type { Perfil, Reservacion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const initialProfile = await supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle();
  let profile = initialProfile.data;
  const error = initialProfile.error;
  if (error?.message.includes("crm_rol")) ({ data: profile } = await supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle());
  const admin = isAdminIdentity(user.email, profile?.rol);
  if (!admin && !isCrmStaff(profile?.crm_rol)) redirect("/");
  const [{ data: profiles }, { data: reservations }] = await Promise.all([
    supabase.from("perfiles").select("*").order("creado_en", { ascending: false }),
    supabase.from("reservaciones").select("*").order("creado_en", { ascending: false }),
  ]);
  const accessRole = admin ? "administrador" : profile?.crm_rol || "lector";
  return <main className="min-h-screen bg-[#edf2f3] text-alm-dark"><header className="sticky top-0 z-40 border-b bg-white/95 px-4 py-3 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4"><Link href={admin ? "/admin" : "/crm"} className="flex items-center gap-2"><IconPlaneDeparture className="text-alm-teal" size={30} /><span><b className="block leading-none">Travel ALMARÉ</b><small className="text-alm-teal">CRM Comercial</small></span></Link><div className="flex items-center gap-3"><span className="hidden text-right sm:block"><b className="block text-sm">{[profile?.nombre, profile?.apellidos].filter(Boolean).join(" ") || user.email}</b><small className="capitalize text-gray-500">{accessRole}</small></span>{admin && <Link href="/admin" className="rounded-xl bg-alm-dark px-4 py-2 text-sm font-bold text-white">Panel administrativo</Link>}<CrmLogoutButton /></div></div></header><div className="mx-auto max-w-[1500px] p-3 md:p-6"><CrmManager perfiles={(profiles || [profile].filter(Boolean)) as Perfil[]} reservaciones={(reservations || []) as Reservacion[]} accessRole={accessRole} /></div></main>;
}
