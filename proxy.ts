import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminIdentity, isCrmStaff } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/crm")) {
    if (!user) return NextResponse.redirect(new URL("/login", request.url));
    const initialProfile = await supabase.from("perfiles").select("rol,crm_rol").eq("id", user.id).maybeSingle();
    let data = initialProfile.data;
    const error = initialProfile.error;
    if (error?.message.includes("crm_rol")) ({ data } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle());
    const admin = isAdminIdentity(user.email, data?.rol);
    if (request.nextUrl.pathname.startsWith("/admin") && !admin) return NextResponse.redirect(new URL(isCrmStaff(data?.crm_rol) ? "/crm" : "/", request.url));
    if (request.nextUrl.pathname.startsWith("/crm") && !admin && !isCrmStaff(data?.crm_rol)) return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
