import type { YachtCollection, YachtListing } from "@/lib/types";

export const DEFAULT_YACHT_COLLECTION: YachtCollection = {
  eyebrow: "Navega la bahía",
  title: "Yates",
  description: "Descubre opciones para navegar Acapulco y solicita una cotización personalizada.",
  yachts: [],
};

function cleanYacht(value: unknown): YachtListing | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<YachtListing>;
  if (!item.id || !item.name || !Number.isFinite(Number(item.price))) return null;
  const strings = (input: unknown) => Array.isArray(input) ? input.filter((entry): entry is string => typeof entry === "string") : [];
  return {
    id: String(item.id),
    name: String(item.name),
    description: typeof item.description === "string" ? item.description : "",
    price: Number(item.price),
    currency: typeof item.currency === "string" && item.currency ? item.currency : "MXN",
    priceUnit: typeof item.priceUnit === "string" && item.priceUnit ? item.priceUnit : "por paseo",
    capacity: Math.max(1, Number(item.capacity) || 1),
    duration: typeof item.duration === "string" ? item.duration : null,
    location: typeof item.location === "string" ? item.location : null,
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : null,
    images: strings(item.images),
    amenities: strings(item.amenities),
    features: strings(item.features),
    badge: typeof item.badge === "string" ? item.badge : null,
    active: item.active !== false,
  };
}

export function parseYachtCollection(value: unknown): YachtCollection {
  if (!value || typeof value !== "object") return DEFAULT_YACHT_COLLECTION;
  const input = value as Partial<YachtCollection>;
  return {
    eyebrow: typeof input.eyebrow === "string" ? input.eyebrow : DEFAULT_YACHT_COLLECTION.eyebrow,
    title: typeof input.title === "string" ? input.title : DEFAULT_YACHT_COLLECTION.title,
    description: typeof input.description === "string" ? input.description : DEFAULT_YACHT_COLLECTION.description,
    yachts: Array.isArray(input.yachts) ? input.yachts.map(cleanYacht).filter((item): item is YachtListing => item !== null) : [],
  };
}
