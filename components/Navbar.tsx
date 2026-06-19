"use client";
import { useState, useEffect } from "react";
import {
  IconPlaneDeparture,
  IconUser,
  IconCalendarPlus,
  IconMoon,
  IconX,
} from "@tabler/icons-react";
import { createBrowserClient } from "@supabase/ssr";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const currentUser = data.session?.user;
      setUser(currentUser);
      if (currentUser) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", currentUser.id)
          .single();
        if (perfil && perfil.rol === "admin") setIsAdmin(true);
      }
    });
  }, [supabase]);

  // Si no está logueado, abre el modal. Si es admin, va al panel.
  const handleAccountClick = () => {
    if (!user) {
      setShowAuth(true);
      setIsLogin(true); // Siempre empieza ofreciendo iniciar sesión
      setErrorMsg("");
    } else if (isAdmin) {
      window.location.href = "/admin";
    } else {
      alert("Tus reservaciones están en proceso.");
    }
  };

  async function handleAuthSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    let errorResult = null;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      errorResult = error;
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      errorResult = error;
    }

    if (errorResult) {
      setErrorMsg("Error: Verifica tus credenciales o intenta de nuevo.");
      setLoading(false);
    } else {
      window.location.reload();
    }
  }

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-alm-beige-mid dark:border-gray-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => (window.location.href = "/")}
        >
          <IconPlaneDeparture className="text-alm-teal w-8 h-8" />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] text-alm-teal italic font-serif">
              Travel
            </span>
            <span className="text-[18px] font-medium text-alm-mid tracking-wide">
              ALMARÉ
            </span>
          </div>
        </div>

        <div className="hidden md:flex gap-5 items-center">
          <a className="text-[13px] font-medium text-alm-teal cursor-pointer">
            Inicio
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Destinos
          </a>
          <a className="text-[13px] text-alm-mid dark:text-gray-300 cursor-pointer hover:text-alm-teal transition">
            Paquetes
          </a>
          <IconMoon
            size={18}
            className="text-alm-mid cursor-pointer hover:text-alm-teal transition mx-2"
          />

          <button
            onClick={handleAccountClick}
            className="flex items-center gap-1.5 bg-transparent text-alm-mid dark:text-gray-300 border border-alm-mid dark:border-gray-500 rounded-md px-3.5 py-1.5 text-[13px] hover:bg-alm-beige-light dark:hover:bg-gray-800 transition"
          >
            <IconUser size={16} />{" "}
            {user
              ? isAdmin
                ? "Ir al Panel Admin"
                : "Mi Cuenta"
              : "Iniciar Sesión"}
          </button>

          <button
            onClick={() => window.scrollTo({ top: 500, behavior: "smooth" })}
            className="flex items-center gap-1.5 bg-alm-teal text-white rounded-md px-4 py-1.5 text-[13px] font-medium hover:bg-alm-mid transition"
          >
            <IconCalendarPlus size={16} /> Reservar
          </button>
        </div>
      </nav>

      {showAuth && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alm-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-alm-teal transition"
            >
              <IconX size={24} />
            </button>

            <h2 className="text-2xl font-black text-alm-dark dark:text-white mb-2">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {isLogin
                ? "Accede para gestionar tus reservaciones"
                : "Regístrate gratis para poder reservar"}
            </p>

            {errorMsg && (
              <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                  Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-teal"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-alm-teal"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-alm-teal text-white py-3.5 rounded-xl font-bold hover:bg-alm-mid transition disabled:opacity-50"
              >
                {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarme"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                <span
                  className="text-alm-teal font-bold cursor-pointer hover:underline"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg("");
                  }}
                >
                  {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
