"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function PageAnalytics() {
  useEffect(() => {
    const key = `almare:pageview:${window.location.pathname}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    const sessionKey = "almare:analytics-session";
    let session = window.sessionStorage.getItem(sessionKey);
    if (!session) { session = crypto.randomUUID(); window.sessionStorage.setItem(sessionKey, session); }
    const dispositivo = window.innerWidth < 640 ? "movil" : window.innerWidth < 1024 ? "tablet" : "escritorio";
    const referencia = document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return "directo"; } })() : "directo";
    void getSupabaseBrowserClient().from("crm_eventos_pagina").insert({ evento: "vista", ruta: window.location.pathname, sesion: session, referencia, dispositivo });
  }, []);
  return null;
}
