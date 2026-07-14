"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminIdentity, isCrmStaff } from "@/lib/admin-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Se ignora el error si se intenta setear desde un componente de servidor
          }
        },
      },
    },
  );

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const initialProfile = await supabase.from("perfiles").select("rol,crm_rol").eq("id", authData.user.id).maybeSingle();
  let perfil = initialProfile.data;
  const profileError = initialProfile.error;
  if (profileError?.message.includes("crm_rol")) ({ data: perfil } = await supabase.from("perfiles").select("rol").eq("id", authData.user.id).maybeSingle());

  const admin = isAdminIdentity(authData.user.email, perfil?.rol);
  if (!admin && !isCrmStaff(perfil?.crm_rol)) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta no tiene permisos administrativos." };
  }

  redirect(admin ? "/admin" : "/crm");
}
