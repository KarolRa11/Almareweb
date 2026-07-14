import type { SocialLink, SocialNetwork } from "@/lib/types";

export const SOCIAL_LINKS_STORAGE_KEY = "almare:redes-sociales";
export const SOCIAL_LINKS_UPDATED_EVENT = "almare:redes-sociales-actualizadas";

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: "whatsapp", label: "WhatsApp", url: "", active: true, order: 1 },
  { id: "facebook", label: "Facebook", url: "", active: true, order: 2 },
  { id: "tiktok", label: "TikTok", url: "", active: true, order: 3 },
  { id: "instagram", label: "Instagram", url: "", active: true, order: 4 },
  { id: "email", label: "Correo electrónico", url: "mailto:admin@almare.com", active: true, order: 5 },
];

const NETWORKS = new Set<SocialNetwork>(DEFAULT_SOCIAL_LINKS.map((item) => item.id));

export function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item }));

  const configured = new Map<SocialNetwork, Partial<SocialLink>>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Partial<SocialLink>;
    if (candidate.id && NETWORKS.has(candidate.id)) configured.set(candidate.id, candidate);
  }

  return DEFAULT_SOCIAL_LINKS.map((fallback) => {
    const item = configured.get(fallback.id);
    return {
      ...fallback,
      label: typeof item?.label === "string" && item.label.trim() ? item.label.trim() : fallback.label,
      url: typeof item?.url === "string" ? item.url.trim() : fallback.url,
      active: typeof item?.active === "boolean" ? item.active : fallback.active,
      order: typeof item?.order === "number" && Number.isFinite(item.order) ? item.order : fallback.order,
    };
  }).sort((a, b) => a.order - b.order);
}

export function normalizeSocialUrl(id: SocialNetwork, rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) return "";
  if (id === "email") return value.startsWith("mailto:") ? value : `mailto:${value}`;
  if (id === "whatsapp" && /^\+?[\d\s()-]+$/.test(value)) {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export function validateSocialUrl(id: SocialNetwork, url: string): string | null {
  if (!url) return null;
  if (id === "email") {
    const address = url.replace(/^mailto:/i, "");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? null : "Escribe un correo válido.";
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "El enlace debe comenzar con https://";
    return null;
  } catch {
    return "Escribe un enlace válido.";
  }
}

export function readStoredSocialLinks(): SocialLink[] | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SOCIAL_LINKS_STORAGE_KEY);
    return stored ? parseSocialLinks(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function storeSocialLinks(links: SocialLink[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOCIAL_LINKS_STORAGE_KEY, JSON.stringify(links));
  window.dispatchEvent(new Event(SOCIAL_LINKS_UPDATED_EVENT));
}
