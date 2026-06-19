"use client";
import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { IconX } from "@tabler/icons-react";

// EL TRUCO: Renombramos la propiedad a onCloseAction para que Next.js la acepte
export default function AuthForm({
  onCloseAction,
}: {
  onCloseAction: () => void;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-alm-dark/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative">
        {/* Usamos onCloseAction aquí */}
        <button
          onClick={onCloseAction}
          className="absolute top-5 right-5 text-gray-400 hover:text-alm-teal transition"
        >
          <IconX size={24} />
        </button>

        <h2 className="text-2xl font-black text-alm-dark dark:text-white mb-2">
          {isLogin ? "Inicia Sesión" : "Crea tu cuenta"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {isLogin
            ? "Bienvenido de vuelta a Travel Almaré"
            : "Únete para reservar los mejores destinos"}
        </p>

        {errorMsg && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase mb-1 block">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-alm-teal"
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
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-alm-teal"
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
  );
}
