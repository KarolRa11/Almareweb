"use client";

import { useMemo, useState } from "react";
import { IconLock, IconPlaneDeparture } from "@tabler/icons-react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function RestablecerContrasena() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    const data = new FormData(e.currentTarget); const password = String(data.get("password")); const confirmation = String(data.get("confirmation"));
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); setLoading(false); return; }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError("El enlace expiró o no es válido. Solicita uno nuevo."); else setMessage("Contraseña actualizada. Ya puedes volver e iniciar sesión.");
    setLoading(false);
  }
  return <main className="flex min-h-screen items-center justify-center bg-alm-beige-light p-4 dark:bg-alm-dark"><section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl dark:bg-[#133545]"><Link href="/" className="mb-7 flex items-center gap-2 font-black text-alm-mid dark:text-white"><IconPlaneDeparture className="text-alm-teal" /> Travel ALMARÉ</Link><IconLock className="mb-3 text-alm-teal" size={34} /><h1 className="text-2xl font-black">Nueva contraseña</h1><p className="mt-1 text-sm text-gray-500 dark:text-alm-beige-mid">Elige una contraseña segura para tu cuenta.</p>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}{message ? <><p className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p><Link href="/" className="mt-5 block rounded-xl bg-alm-teal py-3 text-center font-bold text-white">Volver al inicio</Link></> : <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-xs font-bold uppercase text-gray-500">Nueva contraseña<input name="password" type="password" minLength={8} required className="mt-1 w-full rounded-xl border px-4 py-3 dark:border-alm-mid dark:bg-transparent" /></label><label className="block text-xs font-bold uppercase text-gray-500">Confirmar contraseña<input name="confirmation" type="password" minLength={8} required className="mt-1 w-full rounded-xl border px-4 py-3 dark:border-alm-mid dark:bg-transparent" /></label><button disabled={loading} className="w-full rounded-xl bg-alm-teal py-3 font-black text-white disabled:opacity-50">{loading ? "Actualizando..." : "Guardar contraseña"}</button></form>}</section></main>;
}
