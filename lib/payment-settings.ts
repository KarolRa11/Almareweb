import type { PaymentSettings, PaymentStatus } from "@/lib/types";

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  message:
    "Nosotros nos pondremos en contacto contigo para efectuar el pago.\n\nAtentamente, Travel Almaré.",
};

export function parsePaymentSettings(value: unknown): PaymentSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_PAYMENT_SETTINGS };
  }
  const item = value as Partial<PaymentSettings>;
  return {
    message:
      typeof item.message === "string" && item.message.trim()
        ? item.message.trim()
        : DEFAULT_PAYMENT_SETTINGS.message,
  };
}

export function normalizePaymentStatus(
  value: unknown,
): PaymentStatus {
  return value === "pendiente" || value === "pagado" ? value : "pagar";
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pagar: "Pagar",
  pendiente: "Pendiente",
  pagado: "Pagado",
};
