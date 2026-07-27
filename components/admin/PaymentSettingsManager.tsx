"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconCreditCard,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  DEFAULT_PAYMENT_SETTINGS,
  parsePaymentSettings,
} from "@/lib/payment-settings";

export default function PaymentSettingsManager() {
  const [message, setMessage] = useState(
    DEFAULT_PAYMENT_SETTINGS.message,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    let active = true;
    void supabase
      .from("configuracion")
      .select("valor")
      .eq("clave", "mensaje_pago")
      .maybeSingle()
      .then(
        ({
          data,
        }: {
          data: { valor: unknown } | null;
        }) => {
        if (!active) return;
        setMessage(parsePaymentSettings(data?.valor).message);
        setLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [supabase]);

  async function save() {
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setNotice({
        type: "error",
        text: "El mensaje de pago no puede quedar vacío.",
      });
      return;
    }
    setSaving(true);
    setNotice(null);
    const { error } = await supabase.from("configuracion").upsert(
      {
        clave: "mensaje_pago",
        valor: { message: cleanMessage },
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: "clave" },
    );
    setNotice(
      error
        ? {
            type: "error",
            text: `No se pudo guardar el mensaje: ${error.message}`,
          }
        : {
            type: "ok",
            text: "Mensaje de pago publicado correctamente.",
          },
    );
    setSaving(false);
  }

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b bg-gray-50 px-4 py-5 md:px-6">
        <h2 className="flex items-center gap-2 font-black">
          <IconCreditCard className="text-alm-teal" size={24} />
          Mensaje para efectuar el pago
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Este texto aparece cuando el cliente consulta el estado de pago de
          una reservación.
        </p>
      </div>
      <div className="p-4 md:p-6">
        <label className="block text-xs font-black uppercase text-gray-500">
          Texto mostrado al cliente
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setNotice(null);
            }}
            disabled={loading}
            rows={4}
            className="mt-2 w-full resize-y rounded-xl border px-4 py-3 text-sm font-normal normal-case leading-relaxed outline-none focus:border-alm-teal focus:ring-2 focus:ring-alm-teal/20 disabled:opacity-60"
          />
        </label>
        {notice && (
          <p
            role="status"
            className={`mt-4 rounded-xl border p-3 text-sm font-bold ${
              notice.type === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {notice.text}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={loading || saving}
            className="flex items-center gap-2 rounded-xl bg-alm-teal px-5 py-3 text-sm font-black text-white hover:bg-alm-mid disabled:opacity-50"
          >
            <IconDeviceFloppy size={19} />
            {saving ? "Guardando…" : "Guardar mensaje"}
          </button>
        </div>
      </div>
    </section>
  );
}
