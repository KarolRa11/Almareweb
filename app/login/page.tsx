"use client";
import { useActionState } from "react";
import { loginAction } from "@/lib/auth-actions";
import { IconPlaneDeparture, IconMail, IconLock } from "@tabler/icons-react";

export default function Login() {
  // usamos useActionState para manejar la respuesta del servidor sin romper el HTML
  const [state, action, isPending] = useActionState(
    async (prev: any, formData: FormData) => {
      return await loginAction(formData);
    },
    { error: "" },
  );

  return (
    <div className="min-h-screen bg-alm-beige-light dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 border border-alm-beige-mid dark:border-gray-700">
        <div className="flex flex-col items-center mb-8">
          <IconPlaneDeparture className="text-alm-teal w-12 h-12 mb-2" />
          <h1 className="text-2xl font-medium text-alm-dark dark:text-white">
            Travel ALMARÉ
          </h1>
          <p className="text-sm text-alm-teal font-medium mt-1">
            Panel de Acceso
          </p>
        </div>

        <form action={action} className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-alm-mid dark:text-gray-400 uppercase tracking-wide mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <IconMail className="absolute left-3 top-2.5 text-alm-light w-5 h-5" />
              <input
                name="email"
                type="email"
                required
                className="w-full pl-10 pr-3 py-2 border border-alm-beige-mid rounded-lg bg-alm-beige-light dark:bg-gray-700 text-alm-dark dark:text-white outline-none focus:ring-2 focus:ring-alm-teal transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-alm-mid dark:text-gray-400 uppercase tracking-wide mb-1">
              Contraseña
            </label>
            <div className="relative">
              <IconLock className="absolute left-3 top-2.5 text-alm-light w-5 h-5" />
              <input
                name="password"
                type="password"
                required
                className="w-full pl-10 pr-3 py-2 border border-alm-beige-mid rounded-lg bg-alm-beige-light dark:bg-gray-700 text-alm-dark dark:text-white outline-none focus:ring-2 focus:ring-alm-teal transition"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-red-500 text-xs">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-alm-teal text-white rounded-lg py-2.5 font-medium hover:bg-alm-mid transition"
          >
            {isPending ? "Validando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
