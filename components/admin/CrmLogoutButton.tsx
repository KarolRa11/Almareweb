"use client";

import { IconLogout } from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function CrmLogoutButton() {
  return <button onClick={async () => { await getSupabaseBrowserClient().auth.signOut(); window.location.href = "/"; }} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><IconLogout size={17} /> Cerrar sesión</button>;
}
