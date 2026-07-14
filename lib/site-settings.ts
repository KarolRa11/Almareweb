import type { ContactRequest, SiteSettings } from "@/lib/types";

export const SITE_SETTINGS_STORAGE_KEY = "almare:apariencia-sitio";
export const SITE_SETTINGS_UPDATED_EVENT = "almare:apariencia-actualizada";
export const CONTACT_REQUESTS_STORAGE_KEY = "almare:solicitudes-contacto";
export const CONTACT_REQUESTS_UPDATED_EVENT = "almare:solicitudes-actualizadas";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  logoUrl: "",
  aboutTitle: "Quiénes somos",
  aboutText: "Somos una empresa acapulqueña creada para ayudarte a descubrir Acapulco, su cultura, sus paisajes y las experiencias que hacen único a nuestro puerto.",
  gradientStart: "#174f67",
  gradientEnd: "#4da693",
  gradientOpacity: 82,
  contactPrompt: "Nosotros te contactamos",
};

export function parseSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_SITE_SETTINGS };
  const item = value as Partial<SiteSettings>;
  return {
    logoUrl: typeof item.logoUrl === "string" ? item.logoUrl : DEFAULT_SITE_SETTINGS.logoUrl,
    aboutTitle: typeof item.aboutTitle === "string" && item.aboutTitle.trim() ? item.aboutTitle.trim() : DEFAULT_SITE_SETTINGS.aboutTitle,
    aboutText: typeof item.aboutText === "string" && item.aboutText.trim() ? item.aboutText.trim() : DEFAULT_SITE_SETTINGS.aboutText,
    gradientStart: /^#[0-9a-f]{6}$/i.test(item.gradientStart ?? "") ? item.gradientStart! : DEFAULT_SITE_SETTINGS.gradientStart,
    gradientEnd: /^#[0-9a-f]{6}$/i.test(item.gradientEnd ?? "") ? item.gradientEnd! : DEFAULT_SITE_SETTINGS.gradientEnd,
    gradientOpacity: typeof item.gradientOpacity === "number" ? Math.min(100, Math.max(0, item.gradientOpacity)) : DEFAULT_SITE_SETTINGS.gradientOpacity,
    contactPrompt: typeof item.contactPrompt === "string" && item.contactPrompt.trim() ? item.contactPrompt.trim() : DEFAULT_SITE_SETTINGS.contactPrompt,
  };
}

export function readStoredSiteSettings(): SiteSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
    return value ? parseSiteSettings(JSON.parse(value)) : null;
  } catch { return null; }
}

export function storeSiteSettings(settings: SiteSettings) {
  window.localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(SITE_SETTINGS_UPDATED_EVENT));
}

export function readStoredContactRequests(): ContactRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CONTACT_REQUESTS_STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value as ContactRequest[] : [];
  } catch { return []; }
}

export function storeContactRequest(request: ContactRequest) {
  const current = readStoredContactRequests();
  window.localStorage.setItem(CONTACT_REQUESTS_STORAGE_KEY, JSON.stringify([request, ...current.filter((item) => item.id !== request.id)]));
  window.dispatchEvent(new Event(CONTACT_REQUESTS_UPDATED_EVENT));
}

export function hexToRgba(hex: string, opacity: number) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
}
