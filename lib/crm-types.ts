export type CrmContact = {
  id: string; usuario_id?: string | null; nombre: string; telefono?: string | null; correo?: string | null;
  empresa?: string | null; ubicacion?: string | null; notas?: string | null;
  tipo: "prospecto" | "cliente" | "empresa"; segmento: string; origen: string;
  responsable?: string | null; activo?: boolean; creado_en?: string; actualizado_en?: string; derived?: boolean;
};

export type CrmInteraction = { id: string; contacto_id: string; tipo: "llamada" | "whatsapp" | "correo" | "reunion" | "compra" | "nota"; asunto: string; detalle?: string | null; responsable?: string | null; realizada_en: string; creado_en?: string };
export type CrmStage = "nuevo" | "contactado" | "cotizacion" | "negociacion" | "ganada" | "perdida";
export type CrmOpportunity = { id: string; contacto_id?: string | null; titulo: string; valor: number; etapa: CrmStage; probabilidad: number; cierre_estimado?: string | null; responsable?: string | null; notas?: string | null; creado_en?: string; actualizado_en?: string };
export type CrmTask = { id: string; contacto_id?: string | null; oportunidad_id?: string | null; titulo: string; descripcion?: string | null; vencimiento: string; prioridad: "baja" | "media" | "alta" | "urgente"; estado: "pendiente" | "en_progreso" | "completada" | "cancelada"; responsable?: string | null; creado_en?: string };
export type CrmQuote = { id: string; folio?: string; contacto_id?: string | null; oportunidad_id?: string | null; concepto: string; monto: number; estado: "borrador" | "enviada" | "aceptada" | "rechazada" | "vencida"; valida_hasta?: string | null; notas?: string | null; creado_en?: string };
export type CrmTicket = { id: string; folio?: string; contacto_id?: string | null; asunto: string; descripcion?: string | null; categoria: string; prioridad: "baja" | "media" | "alta" | "urgente"; estado: "abierto" | "en_proceso" | "esperando_cliente" | "resuelto" | "cerrado"; responsable?: string | null; creado_en?: string };
export type CrmCampaign = { id: string; nombre: string; canal: "correo" | "whatsapp" | "facebook" | "instagram" | "tiktok"; segmento: string; asunto?: string | null; mensaje: string; estado: "borrador" | "programada" | "enviada" | "cancelada"; programada_para?: string | null; enviados: number; abiertos: number; conversiones: number; creado_en?: string };
export type CrmAutomation = { id: string; nombre: string; disparador: string; accion: string; canal?: string | null; plantilla?: string | null; activa: boolean; requiere_integracion: boolean; ultima_ejecucion?: string | null };
export type CrmPageEvent = { id: number; evento: string; ruta: string; sesion?: string | null; referencia?: string | null; dispositivo?: string | null; creado_en: string };
export type CrmTab = "resumen" | "clientes" | "embudo" | "actividad" | "ventas" | "soporte" | "marketing" | "equipo";
