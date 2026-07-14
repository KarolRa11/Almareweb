import type { Destino } from "@/lib/types";

export const DESTINATION_RULES_STORAGE_KEY = "almare:reglas-destinos";
export const DESTINATION_RULES_UPDATED_EVENT = "almare:reglas-destinos-actualizadas";

type DestinationRules = Pick<Destino, "etiquetas" | "edad_minima" | "permite_ninos">;

function readMap(): Record<string, DestinationRules> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(DESTINATION_RULES_STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

export function storeDestinationRules(id: string | number, rules: DestinationRules) {
  const current = readMap();
  current[String(id)] = rules;
  window.localStorage.setItem(DESTINATION_RULES_STORAGE_KEY, JSON.stringify(current));
  window.dispatchEvent(new Event(DESTINATION_RULES_UPDATED_EVENT));
}

export function mergeStoredDestinationRules(destinos: Destino[]): Destino[] {
  const stored = readMap();
  return destinos.map((destino) => ({ ...destino, ...stored[String(destino.id)] }));
}

export function destinationPolicy(destino: Destino) {
  if (Number(destino.edad_minima || 0) >= 18) return "Solo para mayores de 18 años";
  if (destino.permite_ninos === false) return "No se admiten niños";
  return "Los niños a partir de 3 años cuentan como pasajero";
}
