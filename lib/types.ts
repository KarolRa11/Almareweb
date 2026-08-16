export type Destino = {
  id: number | string;
  titulo: string;
  nombre?: string | null;
  descripcion: string;
  precio: number;
  descuento?: number | null;
  imagen_principal?: string | null;
  imagenes?: string[] | null;
  etiquetas?: string[] | null;
  edad_minima?: number | null;
  permite_ninos?: boolean | null;
};

export type Reservacion = {
  id: string;
  usuario_id?: string | null;
  destino_id?: number | string | null;
  titulo_destino: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono?: string | null;
  fecha_viaje: string;
  pasajeros: number;
  total_pagar: number;
  precio_unitario?: number | null;
  creado_en?: string;
  folio?: string;
  estado?: "pendiente" | "confirmada" | "cancelada" | "completada";
  estado_pago?: PaymentStatus;
};

export type PaymentStatus = "pagar" | "pendiente" | "pagado";

export type PaymentSettings = {
  message: string;
};

export type Perfil = {
  id: string;
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  sexo?: "femenino" | "masculino" | "no_binario" | "prefiero_no_decir" | null;
  rol?: "cliente" | "admin";
  crm_rol?: "cliente" | "administrador" | "gerente" | "vendedor" | "soporte" | "marketing" | "lector";
  crm_permisos?: Record<string, boolean> | null;
  activo?: boolean;
  creado_en?: string;
};

export type Banner = { id: string; imagen_url: string; creado_en?: string };

export type SocialNetwork = "whatsapp" | "facebook" | "tiktok" | "instagram" | "email";

export type SocialLink = {
  id: SocialNetwork;
  label: string;
  url: string;
  active: boolean;
  order: number;
};

export type TravelerPackage = {
  id: string;
  level: string;
  name: string;
  price: number;
  currency: string;
  priceNote?: string | null;
  couplePrice?: number | null;
  duration?: string | null;
  tagline?: string | null;
  idealFor?: string | null;
  lodging?: string | null;
  yacht?: string | null;
  meals?: string | null;
  shortDescription: string;
  description: string;
  imageUrl?: string | null;
  features: string[];
  badge?: string | null;
  accent?: string | null;
};

export type TravelerCollection = {
  contentVersion?: number;
  eyebrow: string;
  title: string;
  description: string;
  disclaimer?: string | null;
  commercialConditions?: string[];
  packages: TravelerPackage[];
};

export type YachtListing = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  priceUnit: string;
  capacity: number;
  duration?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  images: string[];
  amenities: string[];
  features: string[];
  badge?: string | null;
  whatsappNumber: string;
  whatsappMessage: string;
  active: boolean;
};

export type YachtCollection = {
  eyebrow: string;
  title: string;
  description: string;
  yachts: YachtListing[];
};

export type SiteSettings = {
  logoUrl: string;
  aboutTitle: string;
  aboutText: string;
  gradientStart: string;
  gradientEnd: string;
  gradientOpacity: number;
  contactPrompt: string;
};

export type ContactRequest = {
  id: string;
  nombre: string;
  telefono: string;
  creado_en: string;
  estado: "nueva" | "contactada";
};

export type MarketplaceType = "hotel" | "airbnb" | "restaurante";
export type MarketplacePriceUnit = "noche" | "persona" | "reservacion";
export type MarketplaceReservationStatus =
  | "pendiente"
  | "confirmada"
  | "cancelada"
  | "completada";

export type MarketplaceListing = {
  id: string;
  tipo: MarketplaceType;
  nombre: string;
  descripcion: string;
  direccion: string;
  latitud: number;
  longitud: number;
  precio: number;
  descuento?: number | null;
  unidad_precio: MarketplacePriceUnit;
  imagen_principal?: string | null;
  imagenes?: string[] | null;
  amenidades?: string[] | null;
  caracteristicas?: string[] | null;
  capacidad_adultos: number;
  capacidad_ninos: number;
  capacidad_unidades: number;
  minimo_noches: number;
  hora_apertura?: string | null;
  hora_cierre?: string | null;
  dias_no_disponibles?: string[] | null;
  activo: boolean;
  destacado: boolean;
  creado_en?: string;
  actualizado_en?: string;
};

export type MarketplaceReservation = {
  id: string;
  folio: string;
  usuario_id?: string | null;
  establecimiento_id: string;
  nombre_establecimiento: string;
  tipo_establecimiento: MarketplaceType;
  nombre_cliente: string;
  email_cliente: string;
  telefono: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  hora?: string | null;
  adultos: number;
  ninos: number;
  unidades: number;
  notas?: string | null;
  precio_unitario: number;
  total_pagar: number;
  estado: MarketplaceReservationStatus;
  estado_pago?: PaymentStatus;
  creado_en?: string;
  actualizado_en?: string;
};
