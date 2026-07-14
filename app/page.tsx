import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import HomeContent from "@/components/HomeContent";
import type { Banner, Destino } from "@/lib/types";
import { isAdminIdentity, isCrmStaff } from "@/lib/admin-auth";
import { parseSocialLinks } from "@/lib/social-links";
import { parseSiteSettings } from "@/lib/site-settings";
import PageAnalytics from "@/components/PageAnalytics";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const initialProfile = await supabase.from("perfiles").select("rol,crm_rol").eq("id", user.id).maybeSingle();
    let perfil = initialProfile.data;
    if (initialProfile.error?.message.includes("crm_rol")) ({ data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle());
    if (isAdminIdentity(user.email, perfil?.rol)) redirect("/admin");
    if (isCrmStaff(perfil?.crm_rol)) redirect("/crm");
  }
  const [{ data, error }, { data: banners }, { data: contactConfig }, { data: siteConfig }] = await Promise.all([
    supabase.from("destinos").select("*").order("precio", { ascending: true }),
    supabase.from("banners").select("*").order("creado_en", { ascending: false }),
    supabase.from("configuracion").select("valor").eq("clave", "redes_sociales").maybeSingle(),
    supabase.from("configuracion").select("valor").eq("clave", "apariencia_sitio").maybeSingle(),
  ]);

  if (error) console.error("No fue posible cargar destinos:", error.message);
  return <><PageAnalytics /><HomeContent destinos={(data ?? []) as Destino[]} banners={(banners ?? []) as Banner[]} socialLinks={parseSocialLinks(contactConfig?.valor)} initialSiteSettings={parseSiteSettings(siteConfig?.valor)} /></>;
}
