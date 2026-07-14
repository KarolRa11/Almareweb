"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandWhatsapp,
  IconCalendarPlus,
  IconExternalLink,
  IconLogout,
  IconMail,
  IconMenu2,
  IconMoon,
  IconPlaneDeparture,
  IconQrcode,
  IconSun,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  Reservacion,
  SiteSettings,
  SocialLink,
  SocialNetwork,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import {
  readStoredSocialLinks,
  SOCIAL_LINKS_STORAGE_KEY,
  SOCIAL_LINKS_UPDATED_EVENT,
} from "@/lib/social-links";
import { isCrmStaff } from "@/lib/admin-auth";

function ContactIcon({ id }: { id: SocialNetwork }) {
  if (id === "whatsapp") return <IconBrandWhatsapp size={25} />;
  if (id === "facebook") return <IconBrandFacebook size={25} />;
  if (id === "tiktok") return <IconBrandTiktok size={25} />;
  if (id === "instagram") return <IconBrandInstagram size={25} />;
  return <IconMail size={25} />;
}

export default function Navbar({
  socialLinks,
  siteSettings,
}: {
  socialLinks: SocialLink[];
  siteSettings: SiteSettings;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [displayLinks, setDisplayLinks] = useState(socialLinks);
  const [login, setLogin] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [reservas, setReservas] = useState<Reservacion[]>([]);
  const [accountMessage, setAccountMessage] = useState("");
  const [qrLink, setQrLink] = useState<SocialLink | null>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  useEffect(() => {
    const syncStoredLinks = () => {
      const stored = readStoredSocialLinks();
      setDisplayLinks(stored ?? socialLinks);
    };
    const timer = window.setTimeout(syncStoredLinks, 0);
    const syncStorageEvent = (event: StorageEvent) => {
      if (event.key === SOCIAL_LINKS_STORAGE_KEY) syncStoredLinks();
    };
    window.addEventListener("storage", syncStorageEvent);
    window.addEventListener(SOCIAL_LINKS_UPDATED_EVENT, syncStoredLinks);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", syncStorageEvent);
      window.removeEventListener(SOCIAL_LINKS_UPDATED_EVENT, syncStoredLinks);
    };
  }, [socialLinks]);

  function toggleTheme() {
    const shouldUseDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", shouldUseDark);
    document.documentElement.classList.toggle("light", !shouldUseDark);
    setTheme(shouldUseDark ? "dark" : "light");
  }

  useEffect(() => {
    async function syncUser(nextUser: User | null) {
      setUser(nextUser);
      setAdmin(false);
      if (nextUser) {
        const initialProfile = await supabase
          .from("perfiles")
          .select("rol,crm_rol")
          .eq("id", nextUser.id)
          .maybeSingle();
        let data = initialProfile.data;
        if (initialProfile.error?.message.includes("crm_rol"))
          ({ data } = await supabase
            .from("perfiles")
            .select("rol")
            .eq("id", nextUser.id)
            .maybeSingle());
        const isAdmin = data?.rol === "admin";
        setAdmin(isAdmin);
        if (isAdmin) router.replace("/admin");
        else if (isCrmStaff(data?.crm_rol)) router.replace("/crm");
      }
    }
    void supabase.auth
      .getUser()
      .then((result: { data: { user: User | null } }) =>
        syncUser(result.data.user),
      );
    const { data } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        void syncUser(session?.user ?? null);
      },
    );
    return () => data.subscription.unsubscribe();
  }, [router, supabase]);

  async function openAccount() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (admin) {
      window.location.href = "/admin";
      return;
    }
    const { data } = await supabase
      .from("reservaciones")
      .select("*")
      .eq("email_cliente", user.email)
      .order("creado_en", { ascending: false });
    setReservas((data ?? []) as Reservacion[]);
    setAccountMessage("");
    setAccountOpen(true);
  }

  async function authenticate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirmation = String(form.get("confirmacion") || password);
    if (!login && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    const result = login
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              nombre: String(form.get("nombre") || "").trim(),
              apellidos: String(form.get("apellidos") || "").trim(),
              telefono: String(form.get("telefono") || "").trim(),
              fecha_nacimiento: String(form.get("fecha_nacimiento") || ""),
              sexo: String(form.get("sexo") || "prefiero_no_decir"),
            },
          },
        });
    if (result.error) setError(getAuthErrorMessage(result.error.message));
    else if (!login && !result.data.session)
      setMessage("Cuenta creada. Revisa tu correo para confirmarla.");
    else if (login) window.location.assign("/");
    else setAuthOpen(false);
    setLoading(false);
  }
  async function recoverPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(
      new FormData(e.currentTarget).get("recoveryEmail") || "",
    ).trim();
    setLoading(true);
    setError("");
    setMessage("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/restablecer-contrasena` },
    );
    if (resetError)
      setError("No fue posible enviar el enlace de recuperación.");
    else
      setMessage(
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
      );
    setLoading(false);
  }
  function descargarComprobante(reserva: Reservacion) {
    const content = [
      "TRAVEL ALMARÉ",
      "COMPROBANTE DE RESERVACIÓN",
      "",
      `Folio: ${reserva.folio || reserva.id}`,
      `Cliente: ${reserva.nombre_cliente}`,
      `Destino: ${reserva.titulo_destino}`,
      `Fecha de viaje: ${new Date(`${reserva.fecha_viaje}T12:00:00`).toLocaleDateString("es-MX", { dateStyle: "long" })}`,
      `Pasajeros: ${reserva.pasajeros}`,
      `Total: $${Number(reserva.total_pagar).toLocaleString("es-MX")} MXN`,
      `Estado: ${reserva.estado || "registrada"}`,
      "",
      "Este comprobante confirma el registro de la solicitud. No representa un pago aprobado.",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `comprobante-${reserva.folio || reserva.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function signOut() {
    await supabase.auth.signOut();
    setAccountOpen(false);
  }
  async function cancelarReserva(reserva: Reservacion) {
    if (
      !user?.email ||
      !window.confirm(
        `¿Deseas cancelar la reservación de ${reserva.titulo_destino}?`,
      )
    )
      return;
    setAccountMessage("");
    const { error: cancelError } = await supabase
      .from("reservaciones")
      .update({ estado: "cancelada" })
      .eq("id", reserva.id)
      .eq("email_cliente", user.email);
    if (cancelError)
      setAccountMessage(
        "No fue posible cancelar la reservación. Comunícate con Travel Almaré indicando tu folio.",
      );
    else {
      setReservas((current) =>
        current.map((item) =>
          item.id === reserva.id ? { ...item, estado: "cancelada" } : item,
        ),
      );
      setAccountMessage(
        "Tu reservación fue cancelada. El equipo recibió la actualización.",
      );
    }
  }
  const link =
    "text-sm font-semibold text-alm-mid transition hover:text-alm-teal dark:text-alm-beige-light";

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-alm-beige-mid bg-white/95 px-5 py-3 backdrop-blur dark:border-alm-mid dark:bg-[#102f3e]/95">
        <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between">
          <a
            href="#inicio"
            className="flex items-center gap-2"
            aria-label="Travel Almaré, inicio"
          >
            {siteSettings.logoUrl ? (
              <Image
                unoptimized
                src={siteSettings.logoUrl}
                alt="Icono de Travel Almaré"
                width={42}
                height={36}
                className="h-9 w-11 object-contain"
              />
            ) : (
              <IconPlaneDeparture className="text-alm-teal" size={34} />
            )}
            <span className="leading-none">
              <i className="block font-serif text-xs text-alm-teal">Travel</i>
              <b className="text-lg tracking-wide text-alm-mid dark:text-white">
                ALMARÉ
              </b>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="absolute left-1/2 hidden -translate-x-1/2 rounded-lg px-2 py-2 text-sm font-bold text-alm-mid transition hover:bg-alm-beige-light hover:text-alm-teal lg:block dark:text-alm-beige-light dark:hover:bg-alm-mid/30"
          >
            {siteSettings.aboutTitle}
          </button>
          <div className="hidden items-center gap-3 md:flex">
            <a href="#inicio" className={link}>
              Inicio
            </a>
            <a href="#destinos" className={link}>
              Destinos
            </a>
            <a href="#paquetes" className={link}>
              Paquetes
            </a>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className={link}
            >
              Contacto
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Cambiar tema"
              className="rounded-lg p-2 text-alm-mid hover:bg-alm-beige-light dark:text-alm-pastel dark:hover:bg-alm-mid/30"
            >
              {resolvedTheme === "dark" ? (
                <IconSun size={19} />
              ) : (
                <IconMoon size={19} />
              )}
            </button>
            <button
              onClick={openAccount}
              className="flex items-center gap-1.5 rounded-lg border border-alm-mid px-3.5 py-2 text-xs font-bold text-alm-mid hover:bg-alm-beige-light dark:text-white"
            >
              <IconUser size={17} />{" "}
              {user ? (admin ? "Panel admin" : "Mi cuenta") : "Iniciar sesión"}
            </button>
            <a
              href="#destinos"
              className="flex items-center gap-1.5 rounded-lg bg-alm-teal px-4 py-2 text-xs font-bold text-white hover:bg-alm-mid"
            >
              <IconCalendarPlus size={17} /> Reservar
            </a>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-alm-mid md:hidden dark:text-white"
            aria-label="Abrir menú"
          >
            {mobileOpen ? <IconX /> : <IconMenu2 />}
          </button>
        </div>
        {mobileOpen && (
          <div className="mx-auto mt-3 grid w-full max-w-6xl gap-2 border-t border-alm-beige-mid pt-3 md:hidden dark:border-alm-mid">
            {[
              ["Inicio", "#inicio"],
              ["Destinos", "#destinos"],
              ["Paquetes", "#paquetes"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-bold hover:bg-alm-beige-light dark:hover:bg-alm-mid/20"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setAboutOpen(true);
              }}
              className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-alm-beige-light dark:hover:bg-alm-mid/20"
            >
              {siteSettings.aboutTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setContactOpen(true);
              }}
              className="rounded-lg px-3 py-2 text-left text-sm font-bold hover:bg-alm-beige-light dark:hover:bg-alm-mid/20"
            >
              Contacto
            </button>
            <div className="flex gap-2">
              <button
                onClick={openAccount}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-alm-mid py-2 text-sm font-bold"
              >
                <IconUser size={18} /> Mi cuenta
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg border border-alm-mid px-4"
                aria-label="Cambiar tema"
              >
                {resolvedTheme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
            </div>
          </div>
        )}
      </nav>

      {aboutOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-alm-dark/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setAboutOpen(false)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="about-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:bg-[#133545] sm:p-10"
          >
            <button
              type="button"
              onClick={() => setAboutOpen(false)}
              aria-label="Cerrar Quiénes somos"
              className="absolute right-6 top-6 rounded-full border border-alm-beige-mid p-2 text-gray-500 transition hover:bg-alm-beige-light dark:border-alm-mid dark:hover:bg-alm-dark"
            >
              <IconX />
            </button>
            <div className="pr-14">
              <p className="text-xs font-black uppercase tracking-[.2em] text-alm-teal">
                Travel Almaré
              </p>
              <h2
                id="about-title"
                className="mt-2 text-3xl font-black sm:text-4xl"
              >
                {siteSettings.aboutTitle}
              </h2>
            </div>
          <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-alm-teal to-alm-mid text-white">
              {siteSettings.logoUrl ? (
                <Image
                  unoptimized
                  src={siteSettings.logoUrl}
                  alt="Icono de Travel Almaré"
                  width={72}
                  height={72}
                  className="h-16 w-16 object-contain"
                />
              ) : (
                <IconPlaneDeparture size={48} />
              )}
            </div>
            <p className="mt-7 whitespace-pre-line text-lg leading-relaxed text-gray-600 dark:text-alm-beige-mid">
              {siteSettings.aboutText}
            </p>
            <div className="mt-8 rounded-2xl bg-alm-beige-light p-5 text-sm font-semibold text-alm-mid dark:bg-alm-dark dark:text-alm-pastel">
              Empresa local · Experiencias en Acapulco · Atención personalizada
            </div>
          </section>
        </div>
      )}

      {contactOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-alm-dark/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setContactOpen(false);
              setQrLink(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-title"
            className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#133545] sm:p-9"
          >
            <button
              type="button"
              onClick={() => {
                setContactOpen(false);
                setQrLink(null);
              }}
              aria-label="Cerrar contacto"
              className="absolute right-5 top-5 rounded-full border border-alm-beige-mid p-2 text-gray-500 transition hover:bg-alm-beige-light dark:border-alm-mid dark:hover:bg-alm-dark"
            >
              <IconX />
            </button>
            <div className="pr-14">
              <p className="text-xs font-black uppercase tracking-[.2em] text-alm-teal">
                Estamos para ayudarte
              </p>
              <h2 id="contact-title" className="mt-1 text-3xl font-black">
                Contacto
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-alm-beige-mid">
                Abre el enlace directamente o escanea su código QR desde tu
                teléfono.
              </p>
            </div>
            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_260px]">
              <div className="grid content-start gap-3 sm:grid-cols-2">
                {displayLinks
                  .filter((item) => item.active)
                  .map((item) =>
                    item.url ? (
                      <article
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-alm-beige-mid p-4 transition hover:border-alm-teal dark:border-alm-mid"
                      >
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-alm-teal/15 text-alm-teal">
                          <ContactIcon id={item.id} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block truncate">{item.label}</b>
                          <span className="flex flex-wrap gap-2 pt-1">
                            <a
                              href={item.url}
                              target={
                                item.id === "email" ? undefined : "_blank"
                              }
                              rel={
                                item.id === "email"
                                  ? undefined
                                  : "noopener noreferrer"
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-alm-mid hover:text-alm-teal dark:text-alm-pastel"
                            >
                              Abrir <IconExternalLink size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => setQrLink(item)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-alm-teal"
                            >
                              <IconQrcode size={15} /> Ver QR
                            </button>
                          </span>
                        </span>
                      </article>
                    ) : (
                      <div
                        key={item.id}
                        aria-disabled="true"
                        className="flex items-center gap-3 rounded-2xl border border-dashed border-alm-beige-mid p-4 opacity-60 dark:border-alm-mid"
                      >
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-alm-dark">
                          <ContactIcon id={item.id} />
                        </span>
                        <span>
                          <b className="block">{item.label}</b>
                          <span className="text-xs text-gray-500">
                            Pendiente de configurar
                          </span>
                        </span>
                      </div>
                    ),
                  )}
              </div>
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-alm-beige-light p-5 text-center dark:bg-alm-dark">
                {qrLink?.url ? (
                  <>
                    <div className="rounded-2xl bg-white p-3">
                      <QRCodeSVG
                        value={qrLink.url}
                        size={164}
                        level="M"
                        includeMargin
                      />
                    </div>
                    <b className="mt-3">{qrLink.label}</b>
                    <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">
                      Escanea para abrir el enlace oficial.
                    </p>
                  </>
                ) : (
                  <>
                    <IconQrcode size={58} className="text-alm-teal" />
                    <b className="mt-3">Código QR</b>
                    <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">
                      Selecciona “Ver QR” en una red social.
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {authOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-alm-dark/85 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setAuthOpen(false)
          }
        >
          <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#133545]">
            <button
              onClick={() => setAuthOpen(false)}
              aria-label="Cerrar"
              className="absolute right-5 top-5 text-gray-400"
            >
              <IconX />
            </button>
            <h2 className="text-2xl font-black">
              {recovering
                ? "Recuperar contraseña"
                : login
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-alm-beige-mid">
              {recovering
                ? "Te enviaremos un enlace seguro para elegir una nueva contraseña."
                : login
                  ? "Accede para reservar y consultar tus viajes."
                  : "Regístrate para comenzar tu próxima aventura."}
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
              >
                {error}
              </p>
            )}
            {message && (
              <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {message}
              </p>
            )}
            {recovering ? (
              <form onSubmit={recoverPassword} className="mt-5 space-y-4">
                <label className="block text-[11px] font-bold uppercase text-gray-500">
                  Correo electrónico
                  <input
                    name="recoveryEmail"
                    type="email"
                    required
                    autoComplete="email"
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm dark:border-alm-mid"
                  />
                </label>
                <button
                  disabled={loading}
                  className="w-full rounded-xl bg-alm-teal py-3.5 font-black text-white disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar enlace"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecovering(false);
                    setError("");
                    setMessage("");
                  }}
                  className="w-full text-sm font-bold text-alm-mid dark:text-alm-pastel"
                >
                  Volver al inicio de sesión
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={authenticate} className="mt-5 space-y-4">
                  {!login && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block text-[11px] font-bold uppercase text-gray-500">
                          Nombre
                          <input
                            name="nombre"
                            required
                            minLength={2}
                            autoComplete="given-name"
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-3 text-sm dark:border-alm-mid"
                          />
                        </label>
                        <label className="block text-[11px] font-bold uppercase text-gray-500">
                          Apellidos
                          <input
                            name="apellidos"
                            required
                            minLength={2}
                            autoComplete="family-name"
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-3 text-sm dark:border-alm-mid"
                          />
                        </label>
                      </div>
                      <label className="block text-[11px] font-bold uppercase text-gray-500">
                        Teléfono
                        <input
                          name="telefono"
                          type="tel"
                          required
                          minLength={8}
                          autoComplete="tel"
                          className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm dark:border-alm-mid"
                        />
                      </label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-[11px] font-bold uppercase text-gray-500">
                          Fecha de nacimiento
                          <input
                            name="fecha_nacimiento"
                            type="date"
                            required
                            max={new Date().toISOString().slice(0, 10)}
                            autoComplete="bday"
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-3 text-sm dark:border-alm-mid"
                          />
                        </label>
                        <label className="block text-[11px] font-bold uppercase text-gray-500">
                          Sexo
                          <select
                            name="sexo"
                            required
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-3 text-sm dark:border-alm-mid"
                          >
                            <option value="">Selecciona</option>
                            <option value="femenino">Femenino</option>
                            <option value="masculino">Masculino</option>
                            <option value="no_binario">No binario</option>
                            <option value="prefiero_no_decir">
                              Prefiero no decir
                            </option>
                          </select>
                        </label>
                      </div>
                    </>
                  )}
                  <label className="block text-[11px] font-bold uppercase text-gray-500">
                    Correo electrónico
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid"
                    />
                  </label>
                  <label className="block text-[11px] font-bold uppercase text-gray-500">
                    Contraseña
                    <input
                      name="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete={login ? "current-password" : "new-password"}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-alm-teal dark:border-alm-mid"
                    />
                  </label>
                  {!login && (
                    <label className="block text-[11px] font-bold uppercase text-gray-500">
                      Confirmar contraseña
                      <input
                        name="confirmacion"
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-4 py-3 text-sm dark:border-alm-mid"
                      />
                    </label>
                  )}
                  <button
                    disabled={loading}
                    className="w-full rounded-xl bg-alm-teal py-3.5 font-black text-white disabled:opacity-50"
                  >
                    {loading
                      ? "Procesando..."
                      : login
                        ? "Entrar"
                        : "Registrarme"}
                  </button>
                </form>
                {login && (
                  <button
                    onClick={() => {
                      setRecovering(true);
                      setError("");
                      setMessage("");
                    }}
                    disabled={loading}
                    className="mt-4 w-full text-center text-sm font-semibold text-alm-mid dark:text-alm-pastel"
                  >
                    Olvidé mi contraseña
                  </button>
                )}
                <button
                  onClick={() => {
                    setLogin(!login);
                    setError("");
                    setMessage("");
                  }}
                  className="mt-4 w-full text-center text-sm font-bold text-alm-teal"
                >
                  {login
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {accountOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-alm-dark/85 p-4 backdrop-blur-sm">
          <div className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl dark:bg-[#133545]">
            <button
              onClick={() => setAccountOpen(false)}
              aria-label="Cerrar"
              className="absolute right-5 top-5 text-gray-400"
            >
              <IconX />
            </button>
            <h2 className="text-2xl font-black">Mi cuenta</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-alm-beige-mid">
              {user?.email}
            </p>
            {accountMessage && (
              <p
                role="status"
                className="mt-4 rounded-xl bg-alm-teal/10 p-3 text-sm font-semibold text-alm-mid dark:text-alm-pastel"
              >
                {accountMessage}
              </p>
            )}
            <h3 className="mb-3 mt-7 font-black">Mis reservaciones</h3>
            {reservas.length === 0 ? (
              <p className="rounded-xl bg-alm-beige-light p-5 text-sm text-gray-500 dark:bg-alm-dark dark:text-alm-beige-mid">
                Aún no tienes reservaciones.
              </p>
            ) : (
              <div className="space-y-3">
                {reservas.map((r) => {
                  const canCancel =
                    !r.estado ||
                    r.estado === "pendiente" ||
                    r.estado === "confirmada";
                  return (
                    <article
                      key={r.id}
                      className="rounded-xl border border-alm-beige-mid p-4 dark:border-alm-mid"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black">{r.titulo_destino}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${r.estado === "cancelada" ? "bg-red-100 text-red-600" : r.estado === "completada" ? "bg-blue-100 text-blue-700" : r.estado === "confirmada" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {r.estado || "pendiente"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-alm-beige-mid">
                            Folio: {r.folio || r.id}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-alm-beige-mid">
                            {new Date(
                              `${r.fecha_viaje}T12:00:00`,
                            ).toLocaleDateString("es-MX", {
                              dateStyle: "long",
                            })}{" "}
                            · {r.pasajeros} pasajero(s)
                          </p>
                        </div>
                        <strong className="text-alm-teal">
                          ${Number(r.total_pagar).toLocaleString("es-MX")} MXN
                        </strong>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => descargarComprobante(r)}
                          className="rounded-lg border border-alm-mid px-3 py-2 text-xs font-bold text-alm-mid dark:text-alm-pastel"
                        >
                          Descargar comprobante
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => cancelarReserva(r)}
                            className="rounded-lg border border-red-300 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                          >
                            Cancelar reservación
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
            <p className="mt-5 text-xs text-gray-500 dark:text-alm-beige-mid">
              Las reservaciones registradas quedan pendientes de confirmación
              del equipo. Un comprobante no acredita un pago.
            </p>
            <button
              onClick={signOut}
              className="mt-6 flex items-center gap-2 text-sm font-bold text-red-500"
            >
              <IconLogout size={18} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  );
}
