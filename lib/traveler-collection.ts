import type { TravelerCollection, TravelerPackage } from "@/lib/types";

const DEFAULT_PACKAGE_IMAGES: Record<string, string> = {
  escape: "/images/traveler-collection/escape.jpg",
  experience: "/images/traveler-collection/experience.jpg",
  premium: "/images/traveler-collection/premium.jpg",
  signature: "/images/traveler-collection/signature.jpg",
  elite: "/images/traveler-collection/elite.jpg",
};

export const DEFAULT_TRAVELER_COLLECTION: TravelerCollection = {
  contentVersion: 2,
  eyebrow: "Almaré Travel · Experiencias en Acapulco",
  title: "Una colección para distintos perfiles de viajero",
  description: "Elige el nivel de comodidad, privacidad y exclusividad que deseas, manteniendo como base el vuelo, los traslados, las experiencias, el paseo en yate y los alimentos.",
  disclaimer: "Los precios se presentan como referencia comercial y deben confirmarse al momento de cotizar.",
  commercialConditions: [
    "Precios expresados en pesos mexicanos y manejados como ‘desde’.",
    "La tarifa final depende de fechas, disponibilidad, temporada, ciudad de origen, categoría elegida y número de pasajeros.",
    "Los servicios de vuelo, hotel, yate y experiencias deben confirmarse antes de solicitar el pago final.",
    "Las experiencias pueden personalizarse para cumpleaños, aniversarios, viajes románticos, grupos y celebraciones especiales.",
    "Los paquetes Premium, Signature y Elite pueden ajustarse con servicios adicionales de mayor categoría según solicitud del cliente.",
  ],
  packages: [
    {
      id: "escape", level: "Básico", name: "Escape", badge: "Esencial", duration: "3 días / 2 noches", price: 9990, couplePrice: 19980, currency: "MXN", priceNote: "Desde, por persona", tagline: "Todo Acapulco en una escapada.",
      shortDescription: "Una experiencia completa con presupuesto controlado.", description: "Una escapada esencial para disfrutar los imperdibles de Acapulco con vuelo, hospedaje, alimentos, traslados y acompañamiento durante el viaje.", idealFor: "Parejas, amigos y viajeros que buscan una experiencia completa con presupuesto controlado.", lodging: "Estándar · 2 noches", yacht: "Compartido por la Bahía de Acapulco", meals: "Desayuno, comida y cena incluidos", imageUrl: DEFAULT_PACKAGE_IMAGES.escape, accent: "#4a9b8e",
      features: ["Vuelo redondo a Acapulco", "Equipaje personal", "2 noches de hospedaje", "Traslado aeropuerto - hotel - aeropuerto", "Desayuno, comida y cena durante la estancia", "Paseo en yate compartido por la Bahía de Acapulco", "Bebidas sin alcohol durante el paseo", "Visita a La Quebrada", "Recorrido panorámico por la Costera", "Asistencia de Almaré Travel durante el viaje"],
    },
    {
      id: "experience", level: "Plus", name: "Experience", badge: "Más elegido", duration: "4 días / 3 noches", price: 15990, couplePrice: 31980, currency: "MXN", priceNote: "Desde, por persona", tagline: "Vive Acapulco, nosotros nos encargamos del resto.",
      shortDescription: "Mayor comodidad, experiencias especiales y transporte privado.", description: "Una experiencia superior con hotel de mejor categoría, traslados privados, actividades especiales y paseo premium al atardecer.", idealFor: "Viajeros que quieren mayor comodidad, experiencias especiales y transporte privado.", lodging: "Hotel categoría superior · 3 noches", yacht: "Premium compartido al atardecer", meals: "Desayuno, comida y cena incluidos", imageUrl: DEFAULT_PACKAGE_IMAGES.experience, accent: "#2b6b8a",
      features: ["Vuelo redondo", "Equipaje de mano", "3 noches en hotel categoría superior", "Traslados privados aeropuerto - hotel - aeropuerto", "Desayuno, comida y cena", "Paseo en yate premium al atardecer", "Snacks y bebidas a bordo", "Visita a La Quebrada", "Experiencia en Puerto Marqués", "Cena especial frente al mar", "Traslados internos para las experiencias programadas", "Fotografías digitales durante una experiencia", "Atención personalizada de Almaré Travel"],
    },
    {
      id: "premium", level: "Premium", name: "Premium", badge: "Premium", duration: "4 días / 3 noches", price: 27900, couplePrice: 55800, currency: "MXN", priceNote: "Desde, por persona", tagline: "Acapulco como merece vivirse.",
      shortDescription: "Servicio de categoría alta con hotel 5 estrellas y yate privado.", description: "Una experiencia de categoría alta con selección preferente, hospedaje 5 estrellas, gastronomía premium, spa y concierge de Almaré Travel.", idealFor: "Parejas y clientes que buscan servicio de categoría alta sin llegar a una experiencia ultra exclusiva.", lodging: "Hotel 5 estrellas · habitación superior · 3 noches", yacht: "Privado o semiprivado · 4 horas", meals: "Desayunos completos, comidas seleccionadas y cenas premium", imageUrl: DEFAULT_PACKAGE_IMAGES.premium, accent: "#1d4f66",
      features: ["Vuelo redondo con equipaje", "Selección preferente de horario, sujeta a disponibilidad", "Traslado ejecutivo privado desde el aeropuerto", "3 noches en hotel 5 estrellas", "Habitación de categoría superior", "Desayunos completos", "Comidas en restaurantes seleccionados", "Cenas premium", "Yate privado o semiprivado durante 4 horas", "Tabla de quesos, frutas y snacks a bordo", "Bebidas", "Decoración sencilla en yate para ocasión especial", "Experiencia de spa o masaje", "Visita a La Quebrada", "Atardecer en Sinfonía del Mar", "Traslados privados durante las actividades", "Concierge de Almaré Travel vía WhatsApp"],
    },
    {
      id: "signature", level: "Muy Premium", name: "Signature", badge: "Signature", duration: "5 días / 4 noches", price: 49900, couplePrice: 99800, currency: "MXN", priceNote: "Desde, por persona", tagline: "Una experiencia diseñada alrededor de ti.",
      shortDescription: "Privacidad, lujo y atención personalizada para momentos especiales.", description: "Una experiencia de lujo diseñada alrededor del viajero, con suite vista al mar, yate privado, gastronomía seleccionada, spa y concierge personalizado.", idealFor: "Viajes románticos, celebraciones y clientes que valoran privacidad, lujo y atención personalizada.", lodging: "Hotel de lujo · habitación o suite con vista al mar · 4 noches", yacht: "Privado de lujo · 5 horas", meals: "Desayunos premium, restaurantes seleccionados y cena especial", imageUrl: DEFAULT_PACKAGE_IMAGES.signature, accent: "#b68b4c",
      features: ["Vuelo redondo", "Equipaje documentado", "Elección preferente de horarios", "Recepción personalizada en aeropuerto", "Transporte privado premium", "4 noches en hotel de lujo", "Habitación o suite con vista al mar, sujeta a disponibilidad", "Desayunos premium", "Comidas y cenas en restaurantes seleccionados", "Una cena romántica o especial", "Yate privado de lujo durante 5 horas", "Capitán y tripulación", "Alimentos preparados para el paseo", "Bebidas premium seleccionadas", "Decoración especial", "Fotografía durante el paseo", "Experiencia de spa", "Experiencia en playa", "Visita a La Quebrada", "Recorrido privado por lugares emblemáticos", "Traslados privados durante toda la estancia", "Concierge personalizado de Almaré Travel"],
    },
    {
      id: "elite", level: "Ultra Luxury", name: "Elite", badge: "Ultra Luxury", duration: "5 días / 4 noches", price: 69900, couplePrice: 139800, currency: "MXN", priceNote: "Desde, por persona", tagline: "Acapulco sin límites.",
      shortDescription: "Máxima comodidad, exclusividad y personalización sin límites.", description: "La experiencia más exclusiva de Almaré: viaje completamente personalizado, suite de lujo, yate de mayor categoría, gastronomía premium y concierge permanente.", idealFor: "Clientes que buscan máxima comodidad, exclusividad y una experiencia completamente personalizada.", lodging: "Suite de lujo · 4 noches", yacht: "Privado de lujo de mayor categoría · 5 horas", meals: "Todo incluido premium", imageUrl: DEFAULT_PACKAGE_IMAGES.elite, accent: "#9a6d32",
      features: ["Vuelo redondo en categoría preferente disponible", "Equipaje documentado", "Asistencia para check-in", "Recepción personalizada en aeropuerto", "SUV privada premium", "4 noches en suite de lujo", "Desayuno, comida y cena incluidos", "Restaurantes premium", "Cena privada especial", "Yate privado de lujo de mayor categoría", "5 horas de navegación", "Capitán y tripulación", "Mixología a bordo", "Alimentos premium", "Decoración personalizada", "Sesión fotográfica profesional", "Spa o masaje para dos", "Experiencia privada de playa", "Atardecer VIP", "Experiencia nocturna", "Amenidad de bienvenida", "Traslados privados", "Concierge durante todo el viaje", "Itinerario completamente personalizado"],
    },
  ],
};

function optionalString(value: unknown, fallback: string | null = null) {
  return typeof value === "string" ? value : fallback;
}

function cleanPackage(value: unknown, upgradeFromPdf: boolean): TravelerPackage | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TravelerPackage>;
  if (!item.id || !item.level || !item.name || !Number.isFinite(Number(item.price))) return null;
  const baseline = DEFAULT_TRAVELER_COLLECTION.packages.find((entry) => entry.id === String(item.id));
  const pdfValue = <K extends keyof TravelerPackage>(key: K, fallback: TravelerPackage[K]) => upgradeFromPdf && baseline ? baseline[key] : fallback;
  return {
    id: String(item.id), level: String(item.level), name: String(item.name), price: Number(item.price),
    currency: typeof item.currency === "string" && item.currency ? item.currency : "MXN",
    priceNote: optionalString(item.priceNote, pdfValue("priceNote", null)),
    couplePrice: Number.isFinite(Number(item.couplePrice)) ? Number(item.couplePrice) : pdfValue("couplePrice", null),
    duration: optionalString(item.duration, pdfValue("duration", null)),
    tagline: optionalString(item.tagline, pdfValue("tagline", null)),
    idealFor: optionalString(item.idealFor, pdfValue("idealFor", null)),
    lodging: optionalString(item.lodging, pdfValue("lodging", null)),
    yacht: optionalString(item.yacht, pdfValue("yacht", null)),
    meals: optionalString(item.meals, pdfValue("meals", null)),
    shortDescription: upgradeFromPdf && baseline ? baseline.shortDescription : optionalString(item.shortDescription, "")!,
    description: upgradeFromPdf && baseline ? baseline.description : optionalString(item.description, "")!,
    imageUrl: typeof item.imageUrl === "string" && item.imageUrl ? item.imageUrl : DEFAULT_PACKAGE_IMAGES[String(item.id)] ?? null,
    features: upgradeFromPdf && baseline ? baseline.features : Array.isArray(item.features) ? item.features.filter((feature): feature is string => typeof feature === "string") : [],
    badge: optionalString(item.badge, baseline?.badge ?? null),
    accent: optionalString(item.accent, baseline?.accent ?? null),
  };
}

export function parseTravelerCollection(value: unknown): TravelerCollection {
  if (!value || typeof value !== "object") return DEFAULT_TRAVELER_COLLECTION;
  const input = value as Partial<TravelerCollection>;
  const upgradeFromPdf = Number(input.contentVersion || 0) < 2;
  const packages = Array.isArray(input.packages) ? input.packages.map((item) => cleanPackage(item, upgradeFromPdf)).filter((item): item is TravelerPackage => item !== null) : [];
  return {
    contentVersion: 2,
    eyebrow: typeof input.eyebrow === "string" ? input.eyebrow : DEFAULT_TRAVELER_COLLECTION.eyebrow,
    title: typeof input.title === "string" ? input.title : DEFAULT_TRAVELER_COLLECTION.title,
    description: upgradeFromPdf ? DEFAULT_TRAVELER_COLLECTION.description : typeof input.description === "string" ? input.description : DEFAULT_TRAVELER_COLLECTION.description,
    disclaimer: typeof input.disclaimer === "string" ? input.disclaimer : DEFAULT_TRAVELER_COLLECTION.disclaimer,
    commercialConditions: upgradeFromPdf ? DEFAULT_TRAVELER_COLLECTION.commercialConditions : Array.isArray(input.commercialConditions) ? input.commercialConditions.filter((condition): condition is string => typeof condition === "string") : DEFAULT_TRAVELER_COLLECTION.commercialConditions,
    packages: packages.length ? packages : DEFAULT_TRAVELER_COLLECTION.packages,
  };
}
