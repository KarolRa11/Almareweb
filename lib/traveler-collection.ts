import type { TravelerCollection, TravelerPackage } from "@/lib/types";

export const DEFAULT_TRAVELER_COLLECTION: TravelerCollection = {
  eyebrow: "Almaré Travel · Experiencias en Acapulco",
  title: "Una colección para distintos perfiles de viajero",
  description: "Elige el nivel de comodidad, privacidad y exclusividad que deseas. Cada experiencia puede adaptarse a tu forma de viajar.",
  disclaimer: "Los precios se presentan como referencia comercial y deben confirmarse al momento de cotizar.",
  packages: [
    { id: "escape", level: "Básico", name: "Escape", price: 9990, currency: "MXN", priceNote: "Precio de referencia", shortDescription: "Una escapada bien planeada con los esenciales de Almaré.", description: "Una propuesta práctica para descubrir Acapulco con una selección cuidada de servicios esenciales y acompañamiento local.", imageUrl: null, features: ["Comodidad esencial", "Experiencia compartida", "Atención Almaré"], badge: "Esencial", accent: "#4a9b8e" },
    { id: "experience", level: "Plus", name: "Experience", price: 15990, currency: "MXN", priceNote: "Precio de referencia", shortDescription: "Más experiencias y flexibilidad para disfrutar cada momento.", description: "Pensado para quienes buscan elevar el viaje con mayor comodidad, una agenda más flexible y experiencias seleccionadas.", imageUrl: null, features: ["Comodidad superior", "Itinerario flexible", "Experiencias seleccionadas"], badge: "Más elegido", accent: "#2b6b8a" },
    { id: "premium", level: "Premium", name: "Premium", price: 27900, currency: "MXN", priceNote: "Precio de referencia", shortDescription: "Servicio personalizado, privacidad y detalles especiales.", description: "Una experiencia refinada con mayor privacidad, traslados seleccionados y atención personalizada durante el viaje.", imageUrl: null, features: ["Atención personalizada", "Mayor privacidad", "Traslados seleccionados"], badge: "Premium", accent: "#1d4f66" },
    { id: "signature", level: "Muy Premium", name: "Signature", price: 49900, currency: "MXN", priceNote: "Precio de referencia", shortDescription: "Una propuesta exclusiva creada alrededor de tus preferencias.", description: "Diseñada para viajeros que desean exclusividad, experiencias privadas y un servicio atento a cada detalle.", imageUrl: null, features: ["Experiencias privadas", "Servicio concierge", "Selección gastronómica"], badge: "Signature", accent: "#b68b4c" },
    { id: "elite", level: "Ultra Luxury", name: "Elite", price: 69900, currency: "MXN", priceNote: "Precio de referencia", shortDescription: "El máximo nivel de exclusividad, privacidad y servicio.", description: "Nuestra colección más exclusiva, con planeación a medida, máxima privacidad y acceso a experiencias extraordinarias.", imageUrl: null, features: ["Planeación a medida", "Máxima privacidad", "Acceso extraordinario"], badge: "Ultra Luxury", accent: "#9a6d32" },
  ],
};

function cleanPackage(value: unknown): TravelerPackage | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TravelerPackage>;
  if (!item.id || !item.level || !item.name || !Number.isFinite(Number(item.price))) return null;
  return {
    id: String(item.id), level: String(item.level), name: String(item.name), price: Number(item.price),
    currency: typeof item.currency === "string" && item.currency ? item.currency : "MXN",
    priceNote: typeof item.priceNote === "string" ? item.priceNote : null,
    shortDescription: typeof item.shortDescription === "string" ? item.shortDescription : "",
    description: typeof item.description === "string" ? item.description : "",
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : null,
    features: Array.isArray(item.features) ? item.features.filter((feature): feature is string => typeof feature === "string") : [],
    badge: typeof item.badge === "string" ? item.badge : null,
    accent: typeof item.accent === "string" ? item.accent : null,
  };
}

export function parseTravelerCollection(value: unknown): TravelerCollection {
  if (!value || typeof value !== "object") return DEFAULT_TRAVELER_COLLECTION;
  const input = value as Partial<TravelerCollection>;
  const packages = Array.isArray(input.packages) ? input.packages.map(cleanPackage).filter((item): item is TravelerPackage => item !== null) : [];
  return {
    eyebrow: typeof input.eyebrow === "string" ? input.eyebrow : DEFAULT_TRAVELER_COLLECTION.eyebrow,
    title: typeof input.title === "string" ? input.title : DEFAULT_TRAVELER_COLLECTION.title,
    description: typeof input.description === "string" ? input.description : DEFAULT_TRAVELER_COLLECTION.description,
    disclaimer: typeof input.disclaimer === "string" ? input.disclaimer : DEFAULT_TRAVELER_COLLECTION.disclaimer,
    packages: packages.length ? packages : DEFAULT_TRAVELER_COLLECTION.packages,
  };
}
