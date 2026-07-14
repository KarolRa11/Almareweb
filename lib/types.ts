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
