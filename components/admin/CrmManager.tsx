"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconActivity,
  IconAddressBook,
  IconAlertCircle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuildingStore,
  IconCalendarDue,
  IconChartFunnel,
  IconCheck,
  IconCurrencyDollar,
  IconFileInvoice,
  IconHeadset,
  IconMailForward,
  IconMessage,
  IconPlus,
  IconRobot,
  IconSearch,
  IconSpeakerphone,
  IconTargetArrow,
  IconTrash,
  IconUserCheck,
  IconUsersGroup,
  IconX,
} from "@tabler/icons-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ContactRequest, Perfil, Reservacion } from "@/lib/types";
import type {
  CrmAutomation,
  CrmCampaign,
  CrmContact,
  CrmInteraction,
  CrmOpportunity,
  CrmPageEvent,
  CrmQuote,
  CrmStage,
  CrmTab,
  CrmTask,
  CrmTicket,
} from "@/lib/crm-types";

const money = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const CRM_STORAGE = "almare:crm-local-v1";
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const STAGES: Array<{
  id: CrmStage;
  label: string;
  probability: number;
  color: string;
}> = [
  {
    id: "nuevo",
    label: "Nuevo prospecto",
    probability: 10,
    color: "bg-sky-500",
  },
  {
    id: "contactado",
    label: "Contactado",
    probability: 25,
    color: "bg-indigo-500",
  },
  {
    id: "cotizacion",
    label: "Cotización",
    probability: 50,
    color: "bg-amber-500",
  },
  {
    id: "negociacion",
    label: "Negociación",
    probability: 75,
    color: "bg-orange-500",
  },
  {
    id: "ganada",
    label: "Venta cerrada",
    probability: 100,
    color: "bg-emerald-500",
  },
];

type LocalData = {
  contactos: CrmContact[];
  interacciones: CrmInteraction[];
  oportunidades: CrmOpportunity[];
  tareas: CrmTask[];
  cotizaciones: CrmQuote[];
  tickets: CrmTicket[];
  campanas: CrmCampaign[];
  automatizaciones: CrmAutomation[];
};
const EMPTY: LocalData = {
  contactos: [],
  interacciones: [],
  oportunidades: [],
  tareas: [],
  cotizaciones: [],
  tickets: [],
  campanas: [],
  automatizaciones: [],
};

function localRead(): LocalData {
  if (typeof window === "undefined") return EMPTY;
  try {
    return {
      ...EMPTY,
      ...JSON.parse(localStorage.getItem(CRM_STORAGE) || "{}"),
    };
  } catch {
    return EMPTY;
  }
}
function pct(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
function inPeriod(value: string | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return date >= start && date < end;
}

function Metric({
  title,
  value,
  change,
  icon,
  helper,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  helper: string;
}) {
  const positive = change >= 0;
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-alm-teal/10 text-alm-teal">
          {icon}
        </span>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black ${positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}
        >
          {positive ? (
            <IconArrowUpRight size={15} />
          ) : (
            <IconArrowDownRight size={15} />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <p className="mt-1 text-2xl font-black text-alm-dark">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </article>
  );
}

export default function CrmManager({
  perfiles,
  reservaciones,
  accessRole = "administrador",
}: {
  perfiles: Perfil[];
  reservaciones: Reservacion[];
  accessRole?: string;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [tab, setTab] = useState<CrmTab>("resumen");
  const [contactos, setContactos] = useState<CrmContact[]>([]);
  const [interacciones, setInteracciones] = useState<CrmInteraction[]>([]);
  const [oportunidades, setOportunidades] = useState<CrmOpportunity[]>([]);
  const [tareas, setTareas] = useState<CrmTask[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CrmQuote[]>([]);
  const [tickets, setTickets] = useState<CrmTicket[]>([]);
  const [campanas, setCampanas] = useState<CrmCampaign[]>([]);
  const [automatizaciones, setAutomatizaciones] = useState<CrmAutomation[]>([]);
  const [eventos, setEventos] = useState<CrmPageEvent[]>([]);
  const [solicitudes, setSolicitudes] = useState<ContactRequest[]>([]);
  const [equipo, setEquipo] = useState(perfiles);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState<
    | "contacto"
    | "interaccion"
    | "oportunidad"
    | "tarea"
    | "cotizacion"
    | "ticket"
    | "campana"
    | null
  >(null);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(
    null,
  );
  const [prefillContact, setPrefillContact] = useState<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      const tables = [
        "crm_contactos",
        "crm_interacciones",
        "crm_oportunidades",
        "crm_tareas",
        "crm_cotizaciones",
        "crm_tickets",
        "crm_campanas",
        "crm_automatizaciones",
        "crm_eventos_pagina",
      ] as const;
      const [results, requestsResult] = await Promise.all([
        Promise.all(
          tables.map((name) =>
            supabase
              .from(name)
              .select("*")
              .order("creado_en", { ascending: false })
              .limit(name === "crm_eventos_pagina" ? 2000 : 500),
          ),
        ),
        supabase
          .from("solicitudes_contacto")
          .select("*")
          .order("creado_en", { ascending: false })
          .limit(500),
      ]);
      if (!active) return;
      const local = localRead();
      const missing = results.some(
        (result) =>
          result.error?.message.includes("schema cache") ||
          result.error?.message.includes("does not exist"),
      );
      setSchemaReady(!missing);
      setContactos((results[0].data || local.contactos) as CrmContact[]);
      setInteracciones(
        (results[1].data || local.interacciones) as CrmInteraction[],
      );
      setOportunidades(
        (results[2].data || local.oportunidades) as CrmOpportunity[],
      );
      setTareas((results[3].data || local.tareas) as CrmTask[]);
      setCotizaciones((results[4].data || local.cotizaciones) as CrmQuote[]);
      setTickets((results[5].data || local.tickets) as CrmTicket[]);
      setCampanas((results[6].data || local.campanas) as CrmCampaign[]);
      const defaultAutomations: CrmAutomation[] = [
        {
          id: "auto-lead",
          nombre: "Seguimiento de nuevo prospecto",
          disparador: "prospecto_creado",
          accion: "Crear tarea en 24 horas",
          activa: true,
          requiere_integracion: false,
        },
        {
          id: "auto-quote",
          nombre: "Confirmación de cotización",
          disparador: "cotizacion_enviada",
          accion: "Enviar correo de confirmación",
          canal: "correo",
          activa: false,
          requiere_integracion: true,
        },
        {
          id: "auto-ticket",
          nombre: "Asignar ticket urgente",
          disparador: "ticket_urgente",
          accion: "Crear tarea prioritaria",
          activa: true,
          requiere_integracion: false,
        },
        {
          id: "auto-trip",
          nombre: "Recordatorio de viaje",
          disparador: "viaje_48h",
          accion: "Enviar recordatorio",
          canal: "whatsapp",
          activa: false,
          requiere_integracion: true,
        },
      ];
      setAutomatizaciones(
        (results[7].data?.length
          ? results[7].data
          : local.automatizaciones.length
            ? local.automatizaciones
            : defaultAutomations) as CrmAutomation[],
      );
      setEventos((results[8].data || []) as CrmPageEvent[]);
      setSolicitudes((requestsResult.data || []) as ContactRequest[]);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (loading) return;
    localStorage.setItem(
      CRM_STORAGE,
      JSON.stringify({
        contactos,
        interacciones,
        oportunidades,
        tareas,
        cotizaciones,
        tickets,
        campanas,
        automatizaciones,
      } satisfies LocalData),
    );
  }, [
    automatizaciones,
    campanas,
    contactos,
    cotizaciones,
    interacciones,
    loading,
    oportunidades,
    tareas,
    tickets,
  ]);

  const contactosDerivados = useMemo(() => {
    const known = new Set(
      contactos.map((c) => c.correo?.toLowerCase()).filter(Boolean),
    );
    const map = new Map<string, CrmContact>();
    reservaciones.forEach((r) => {
      const key = r.email_cliente.toLowerCase();
      if (!known.has(key) && !map.has(key))
        map.set(key, {
          id: `reserva:${key}`,
          usuario_id: r.usuario_id,
          nombre: r.nombre_cliente,
          correo: r.email_cliente,
          telefono: r.telefono,
          tipo: "cliente",
          segmento: "viajeros",
          origen: "reservacion",
          creado_en: r.creado_en,
          derived: true,
        });
    });
    solicitudes.forEach((request) => {
      const phoneKey = request.telefono.replace(/\D/g, "");
      if (
        ![...contactos, ...map.values()].some(
          (c) => c.telefono?.replace(/\D/g, "") === phoneKey,
        )
      )
        map.set(`solicitud:${request.id}`, {
          id: `solicitud:${request.id}`,
          nombre: request.nombre,
          telefono: request.telefono,
          tipo: "prospecto",
          segmento: "solicitud de llamada",
          origen: "pagina_web",
          creado_en: request.creado_en,
          notas: `Solicitud de contacto: ${request.estado}`,
          derived: true,
        });
    });
    return [...contactos, ...map.values()];
  }, [contactos, reservaciones, solicitudes]);

  const interaccionesVisibles = useMemo(() => {
    const purchases: CrmInteraction[] = reservaciones.map((r) => ({
      id: `compra:${r.id}`,
      contacto_id:
        contactosDerivados.find(
          (c) => c.correo?.toLowerCase() === r.email_cliente.toLowerCase(),
        )?.id || "",
      tipo: "compra",
      asunto: `Reservación ${r.folio || r.titulo_destino}`,
      detalle: `${r.titulo_destino} · ${r.pasajeros} pasajero(s) · ${money.format(Number(r.total_pagar))}`,
      realizada_en: r.creado_en || `${r.fecha_viaje}T12:00:00`,
      creado_en: r.creado_en,
    }));
    return [...interacciones, ...purchases].sort(
      (a, b) =>
        new Date(b.realizada_en).getTime() - new Date(a.realizada_en).getTime(),
    );
  }, [contactosDerivados, interacciones, reservaciones]);

  const filteredContacts = contactosDerivados.filter((c) =>
    `${c.nombre} ${c.correo || ""} ${c.telefono || ""} ${c.empresa || ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const contactName = (id?: string | null) =>
    contactosDerivados.find((c) => c.id === id)?.nombre || "Sin contacto";
  const current = new Date();
  const startCurrent = new Date(current);
  startCurrent.setDate(current.getDate() - 30);
  const startPrevious = new Date(startCurrent);
  startPrevious.setDate(startPrevious.getDate() - 30);
  const validSales = reservaciones.filter(
    (r) => r.estado === "confirmada" || r.estado === "completada",
  );
  const salesCurrent = validSales
    .filter((r) => inPeriod(r.creado_en, startCurrent, current))
    .reduce((s, r) => s + Number(r.total_pagar), 0);
  const salesPrevious = validSales
    .filter((r) => inPeriod(r.creado_en, startPrevious, startCurrent))
    .reduce((s, r) => s + Number(r.total_pagar), 0);
  const clientsCurrent = perfiles.filter((p) =>
    inPeriod(p.creado_en, startCurrent, current),
  ).length;
  const clientsPrevious = perfiles.filter((p) =>
    inPeriod(p.creado_en, startPrevious, startCurrent),
  ).length;
  const viewsCurrent = eventos.filter(
    (e) => e.evento === "vista" && inPeriod(e.creado_en, startCurrent, current),
  ).length;
  const viewsPrevious = eventos.filter(
    (e) =>
      e.evento === "vista" &&
      inPeriod(e.creado_en, startPrevious, startCurrent),
  ).length;
  const won = oportunidades.filter((o) => o.etapa === "ganada").length;
  const conversion = oportunidades.length
    ? Math.round((won / oportunidades.length) * 100)
    : 0;
  const pendingTasks = tareas
    .filter((t) => t.estado === "pendiente" || t.estado === "en_progreso")
    .sort(
      (a, b) =>
        new Date(a.vencimiento).getTime() - new Date(b.vencimiento).getTime(),
    );
  const pipelineValue = oportunidades
    .filter((o) => !["ganada", "perdida"].includes(o.etapa))
    .reduce((sum, o) => sum + (Number(o.valor) * o.probabilidad) / 100, 0);

  async function persist(
    table: string,
    row: Record<string, unknown>,
    action: "insert" | "update" = "insert",
  ) {
    const result =
      action === "insert"
        ? await supabase.from(table).insert(row)
        : await supabase.from(table).update(row).eq("id", row.id);
    if (
      result.error &&
      !result.error.message.includes("schema cache") &&
      !result.error.message.includes("does not exist")
    )
      setNotice(`No se pudo guardar en la nube: ${result.error.message}`);
    else if (!result.error) setNotice("Cambios guardados correctamente.");
    return !result.error;
  }
  async function ensureContact(id: string): Promise<string> {
    const item = contactosDerivados.find((c) => c.id === id);
    if (!item?.derived) return id;
    const created: CrmContact = { ...item, id: uid(), derived: false };
    delete created.usuario_id;
    const { derived: _derived, ...cloudContact } = created;
    void _derived;
    await persist(
      "crm_contactos",
      cloudContact as unknown as Record<string, unknown>,
    );
    setContactos((all) => [created, ...all]);
    return created.id;
  }
  function openCreate(kind: typeof create, contactId = "") {
    if (!canWrite) { setNotice("Tu rol permite consultar el CRM, pero no modificar registros."); return; }
    setPrefillContact(contactId);
    setCreate(kind);
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) || "").trim();
    if (create === "contacto") {
      const row: CrmContact = {
        id: uid(),
        nombre: value("nombre"),
        telefono: value("telefono"),
        correo: value("correo"),
        empresa: value("empresa"),
        ubicacion: value("ubicacion"),
        notas: value("notas"),
        tipo: value("tipo") as CrmContact["tipo"],
        segmento: value("segmento") || "general",
        origen: value("origen") || "manual",
        creado_en: now(),
      };
      setContactos((all) => [row, ...all]);
      await persist("crm_contactos", row as unknown as Record<string, unknown>);
      if (
        automatizaciones.some(
          (a) => a.activa && a.disparador === "prospecto_creado",
        )
      ) {
        const task: CrmTask = {
          id: uid(),
          contacto_id: row.id,
          titulo: "Primer seguimiento",
          descripcion:
            "Contactar al nuevo prospecto dentro de las primeras 24 horas.",
          vencimiento: new Date(Date.now() + 86400000).toISOString(),
          prioridad: "alta",
          estado: "pendiente",
          creado_en: now(),
        };
        setTareas((all) => [task, ...all]);
        await persist("crm_tareas", task as unknown as Record<string, unknown>);
      }
    }
    if (create === "interaccion") {
      const contactId = await ensureContact(value("contacto_id"));
      const row: CrmInteraction = {
        id: uid(),
        contacto_id: contactId,
        tipo: value("tipo") as CrmInteraction["tipo"],
        asunto: value("asunto"),
        detalle: value("detalle"),
        realizada_en: value("realizada_en") || now(),
        creado_en: now(),
      };
      setInteracciones((all) => [row, ...all]);
      await persist(
        "crm_interacciones",
        row as unknown as Record<string, unknown>,
      );
    }
    if (create === "oportunidad") {
      const contactId = value("contacto_id")
        ? await ensureContact(value("contacto_id"))
        : null;
      const stage = value("etapa") as CrmStage;
      const row: CrmOpportunity = {
        id: uid(),
        contacto_id: contactId,
        titulo: value("titulo"),
        valor: Number(form.get("valor")),
        etapa: stage,
        probabilidad: STAGES.find((s) => s.id === stage)?.probability || 10,
        cierre_estimado: value("cierre_estimado") || null,
        notas: value("notas"),
        creado_en: now(),
      };
      setOportunidades((all) => [row, ...all]);
      await persist(
        "crm_oportunidades",
        row as unknown as Record<string, unknown>,
      );
    }
    if (create === "tarea") {
      const contactId = value("contacto_id")
        ? await ensureContact(value("contacto_id"))
        : null;
      const row: CrmTask = {
        id: uid(),
        contacto_id: contactId,
        titulo: value("titulo"),
        descripcion: value("descripcion"),
        vencimiento: value("vencimiento"),
        prioridad: value("prioridad") as CrmTask["prioridad"],
        estado: "pendiente",
        creado_en: now(),
      };
      setTareas((all) => [row, ...all]);
      await persist("crm_tareas", row as unknown as Record<string, unknown>);
    }
    if (create === "cotizacion") {
      const contactId = value("contacto_id")
        ? await ensureContact(value("contacto_id"))
        : null;
      const row: CrmQuote = {
        id: uid(),
        folio: `COT-${Date.now().toString().slice(-8)}`,
        contacto_id: contactId,
        concepto: value("concepto"),
        monto: Number(form.get("monto")),
        estado: "borrador",
        valida_hasta: value("valida_hasta") || null,
        notas: value("notas"),
        creado_en: now(),
      };
      setCotizaciones((all) => [row, ...all]);
      await persist(
        "crm_cotizaciones",
        row as unknown as Record<string, unknown>,
      );
    }
    if (create === "ticket") {
      const contactId = value("contacto_id")
        ? await ensureContact(value("contacto_id"))
        : null;
      const priority = value("prioridad") as CrmTicket["prioridad"];
      const row: CrmTicket = {
        id: uid(),
        folio: `TKT-${Date.now().toString().slice(-8)}`,
        contacto_id: contactId,
        asunto: value("asunto"),
        descripcion: value("descripcion"),
        categoria: value("categoria"),
        prioridad: priority,
        estado: "abierto",
        creado_en: now(),
      };
      setTickets((all) => [row, ...all]);
      await persist("crm_tickets", row as unknown as Record<string, unknown>);
      if (
        priority === "urgente" &&
        automatizaciones.some(
          (a) => a.activa && a.disparador === "ticket_urgente",
        )
      ) {
        const task: CrmTask = {
          id: uid(),
          contacto_id: contactId,
          titulo: `Resolver ticket urgente: ${row.asunto}`,
          vencimiento: new Date(Date.now() + 7200000).toISOString(),
          prioridad: "urgente",
          estado: "pendiente",
          creado_en: now(),
        };
        setTareas((all) => [task, ...all]);
        await persist("crm_tareas", task as unknown as Record<string, unknown>);
      }
    }
    if (create === "campana") {
      const scheduled = value("programada_para") || null;
      const row: CrmCampaign = {
        id: uid(),
        nombre: value("nombre"),
        canal: value("canal") as CrmCampaign["canal"],
        segmento: value("segmento") || "todos",
        asunto: value("asunto"),
        mensaje: value("mensaje"),
        estado: scheduled ? "programada" : "borrador",
        programada_para: scheduled,
        enviados: 0,
        abiertos: 0,
        conversiones: 0,
        creado_en: now(),
      };
      setCampanas((all) => [row, ...all]);
      await persist("crm_campanas", row as unknown as Record<string, unknown>);
    }
    setCreate(null);
    setPrefillContact("");
  }

  async function updateStage(item: CrmOpportunity, etapa: CrmStage) {
    if (!canWrite) { setNotice("No tienes permiso para modificar oportunidades."); return; }
    const probabilidad =
      etapa === "perdida"
        ? 0
        : STAGES.find((s) => s.id === etapa)?.probability || item.probabilidad;
    const next = { ...item, etapa, probabilidad, actualizado_en: now() };
    setOportunidades((all) => all.map((o) => (o.id === item.id ? next : o)));
    await persist(
      "crm_oportunidades",
      next as unknown as Record<string, unknown>,
      "update",
    );
  }
  async function completeTask(item: CrmTask) {
    if (!canWrite) { setNotice("No tienes permiso para modificar tareas."); return; }
    const next = {
      ...item,
      estado:
        item.estado === "completada"
          ? ("pendiente" as const)
          : ("completada" as const),
    };
    setTareas((all) => all.map((t) => (t.id === item.id ? next : t)));
    await persist(
      "crm_tareas",
      next as unknown as Record<string, unknown>,
      "update",
    );
  }
  async function updateQuote(item: CrmQuote, estado: CrmQuote["estado"]) {
    if (!canWrite) { setNotice("No tienes permiso para modificar cotizaciones."); return; }
    const next = { ...item, estado };
    setCotizaciones((all) => all.map((q) => (q.id === item.id ? next : q)));
    await persist(
      "crm_cotizaciones",
      next as unknown as Record<string, unknown>,
      "update",
    );
  }
  async function updateTicket(item: CrmTicket, estado: CrmTicket["estado"]) {
    if (!canWrite) { setNotice("No tienes permiso para modificar tickets."); return; }
    const next = { ...item, estado };
    setTickets((all) => all.map((t) => (t.id === item.id ? next : t)));
    await persist(
      "crm_tickets",
      next as unknown as Record<string, unknown>,
      "update",
    );
  }
  async function toggleAutomation(item: CrmAutomation) {
    if (!canWrite) { setNotice("No tienes permiso para modificar automatizaciones."); return; }
    const next = { ...item, activa: !item.activa };
    setAutomatizaciones((all) => all.map((a) => (a.id === item.id ? next : a)));
    if (!item.id.startsWith("auto-"))
      await persist(
        "crm_automatizaciones",
        next as unknown as Record<string, unknown>,
        "update",
      );
  }
  async function updateTeamRole(
    profile: Perfil,
    crm_rol: NonNullable<Perfil["crm_rol"]>,
  ) {
    setEquipo((all) =>
      all.map((p) => (p.id === profile.id ? { ...p, crm_rol } : p)),
    );
    const { error } = await supabase
      .from("perfiles")
      .update({ crm_rol })
      .eq("id", profile.id);
    setNotice(
      error
        ? "El rol quedó guardado localmente. Ejecuta la migración CRM para persistirlo."
        : "Permisos del colaborador actualizados.",
    );
  }
  function downloadQuote(item: CrmQuote) {
    const text = [
      `TRAVEL ALMARÉ`,
      `COTIZACIÓN ${item.folio || item.id}`,
      "",
      `Cliente: ${contactName(item.contacto_id)}`,
      `Concepto: ${item.concepto}`,
      `Monto: ${money.format(item.monto)} MXN`,
      `Válida hasta: ${item.valida_hasta || "Por confirmar"}`,
      `Estado: ${item.estado}`,
      "",
      item.notas || "",
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.folio || "cotizacion"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function removeContact(item: CrmContact) {
    if (!canWrite) { setNotice("No tienes permiso para eliminar contactos."); return; }
    if (!confirm(`¿Eliminar a ${item.nombre} del CRM?`)) return;
    setContactos((all) => all.filter((c) => c.id !== item.id));
    if (!item.derived)
      await supabase.from("crm_contactos").delete().eq("id", item.id);
    setSelectedContact(null);
  }

  const nav: Array<{
    id: CrmTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: "resumen", label: "Resumen", icon: <IconActivity size={18} /> },
    {
      id: "clientes",
      label: "Clientes",
      icon: <IconAddressBook size={18} />,
      badge: contactosDerivados.length,
    },
    {
      id: "embudo",
      label: "Embudo",
      icon: <IconChartFunnel size={18} />,
      badge: oportunidades.length,
    },
    {
      id: "actividad",
      label: "Actividad",
      icon: <IconCalendarDue size={18} />,
      badge: pendingTasks.length,
    },
    {
      id: "ventas",
      label: "Cotizaciones",
      icon: <IconFileInvoice size={18} />,
    },
    {
      id: "soporte",
      label: "Soporte",
      icon: <IconHeadset size={18} />,
      badge: tickets.filter((t) => !["resuelto", "cerrado"].includes(t.estado))
        .length,
    },
    {
      id: "marketing",
      label: "Marketing",
      icon: <IconSpeakerphone size={18} />,
    },
    {
      id: "equipo",
      label: "Equipo y permisos",
      icon: <IconUsersGroup size={18} />,
    },
  ];
  const tabAccess: Record<CrmTab, string[]> = {
    resumen: ["administrador", "gerente", "vendedor", "soporte", "marketing", "lector"],
    clientes: ["administrador", "gerente", "vendedor", "soporte", "marketing", "lector"],
    embudo: ["administrador", "gerente", "vendedor", "lector"],
    actividad: ["administrador", "gerente", "vendedor", "soporte", "lector"],
    ventas: ["administrador", "gerente", "vendedor", "lector"],
    soporte: ["administrador", "gerente", "soporte", "lector"],
    marketing: ["administrador", "gerente", "marketing", "lector"],
    equipo: ["administrador", "gerente"],
  };
  const visibleNav = nav.filter((item) => tabAccess[item.id].includes(accessRole));
  const canWrite = accessRole !== "lector";

  if (loading)
    return (
      <section
        id="crm"
        className="mb-8 rounded-3xl border bg-white p-10 text-center"
      >
        <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-alm-teal/20 border-t-alm-teal" />
        <p className="mt-4 font-bold text-gray-500">Preparando CRM…</p>
      </section>
    );

  return (
    <section
      id="crm"
      className="mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-[#f7f9fa] shadow-sm"
    >
      <header className="border-b bg-white px-5 py-5 md:px-7">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-alm-teal">
              Centro de relaciones y ventas
            </p>
            <h2 className="mt-1 text-2xl font-black text-alm-dark">
              CRM Travel Almaré
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Clientes, oportunidades, tareas, servicio y campañas en un solo
              lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          {canWrite && <><button onClick={() => openCreate("contacto")} className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"><IconPlus size={18} /> Nuevo prospecto</button><button onClick={() => openCreate("tarea")} className="flex items-center gap-2 rounded-xl border border-alm-mid px-4 py-2.5 text-sm font-black text-alm-mid"><IconCalendarDue size={18} /> Nueva tarea</button></>}
          </div>
        </div>
        {!schemaReady && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <IconAlertCircle className="mt-0.5 shrink-0" size={18} />
            <span>
              <b>Modo local activo.</b> El CRM funciona en este navegador;
              ejecuta la migración 005 para compartir y respaldar los datos en
              Supabase.
            </span>
          </div>
        )}
        {notice && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-alm-teal/10 p-3 text-sm font-semibold text-alm-mid">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Cerrar aviso">
              <IconX size={17} />
            </button>
          </div>
        )}
      </header>
      <div className="border-b bg-white px-3 py-2">
        <nav className="flex gap-1 overflow-x-auto">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${tab === item.id ? "bg-alm-dark text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              {item.icon}
              {item.label}
              {item.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] ${tab === item.id ? "bg-white/20" : "bg-gray-100"}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 md:p-6">
        {tab === "resumen" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                title="Ventas confirmadas"
                value={money.format(salesCurrent)}
                change={pct(salesCurrent, salesPrevious)}
                icon={<IconCurrencyDollar />}
                helper="Últimos 30 días vs. periodo anterior"
              />
              <Metric
                title="Personas registradas"
                value={String(perfiles.length)}
                change={pct(clientsCurrent, clientsPrevious)}
                icon={<IconUserCheck />}
                helper={`${clientsCurrent} registros nuevos este periodo`}
              />
              <Metric
                title="Visitas a la página"
                value={String(viewsCurrent)}
                change={pct(viewsCurrent, viewsPrevious)}
                icon={<IconActivity />}
                helper="Sesiones registradas en los últimos 30 días"
              />
              <Metric
                title="Conversión del embudo"
                value={`${conversion}%`}
                change={0}
                icon={<IconTargetArrow />}
                helper={`${won} oportunidades ganadas de ${oportunidades.length}`}
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <article className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black">Embudo comercial</h3>
                    <p className="text-xs text-gray-500">
                      Valor ponderado activo: {money.format(pipelineValue)}
                    </p>
                  </div>
                  <button
                    onClick={() => setTab("embudo")}
                    className="text-xs font-bold text-alm-teal"
                  >
                    Ver embudo
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                  {STAGES.map((stage) => {
                    const items = oportunidades.filter(
                      (o) => o.etapa === stage.id,
                    );
                    return (
                      <div key={stage.id} className="rounded-xl bg-gray-50 p-3">
                        <span
                          className={`block h-1.5 rounded-full ${stage.color}`}
                        />
                        <p className="mt-3 text-xl font-black">
                          {items.length}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-gray-500">
                          {stage.label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-alm-mid">
                          {money.format(
                            items.reduce((s, o) => s + Number(o.valor), 0),
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
              <article className="rounded-2xl border bg-white p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">Próximas tareas</h3>
                  <button
                    onClick={() => setTab("actividad")}
                    className="text-xs font-bold text-alm-teal"
                  >
                    Ver todas
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => void completeTask(task)}
                      className="flex w-full items-start gap-3 rounded-xl border p-3 text-left hover:bg-gray-50"
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${task.estado === "completada" ? "bg-emerald-500 text-white" : "border-gray-300"}`}
                      >
                        {task.estado === "completada" && (
                          <IconCheck size={13} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <b className="block truncate text-sm">{task.titulo}</b>
                        <span className="text-xs text-gray-500">
                          {new Date(task.vencimiento).toLocaleString("es-MX", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </span>
                    </button>
                  ))}
                  {pendingTasks.length === 0 && (
                    <p className="rounded-xl bg-gray-50 p-5 text-center text-sm text-gray-400">
                      No hay tareas pendientes.
                    </p>
                  )}
                </div>
              </article>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-2xl border bg-white p-5">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Pipeline estimado
                </p>
                <p className="mt-1 text-2xl font-black text-alm-mid">
                  {money.format(pipelineValue)}
                </p>
              </article>
              <article className="rounded-2xl border bg-white p-5">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Tickets abiertos
                </p>
                <p className="mt-1 text-2xl font-black text-alm-mid">
                  {
                    tickets.filter(
                      (t) => !["resuelto", "cerrado"].includes(t.estado),
                    ).length
                  }
                </p>
              </article>
              <article className="rounded-2xl border bg-white p-5">
                <p className="text-xs font-bold uppercase text-gray-400">
                  Campañas activas
                </p>
                <p className="mt-1 text-2xl font-black text-alm-mid">
                  {campanas.filter((c) => c.estado === "programada").length}
                </p>
              </article>
            </div>
          </div>
        )}

        {tab === "clientes" && (
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative max-w-md flex-1">
                <IconSearch
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, correo, teléfono o empresa"
                  className="w-full rounded-xl border bg-white py-2.5 pl-10 pr-3 text-sm"
                />
              </label>
              <button
                onClick={() => openCreate("contacto")}
                className="flex items-center justify-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
              >
                <IconPlus size={18} /> Registrar contacto
              </button>
            </div>
            <div className="grid gap-3">
              {filteredContacts.map((contact) => (
                <article
                  key={contact.id}
                  className="flex flex-col gap-4 rounded-2xl border bg-white p-4 md:flex-row md:items-center"
                >
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alm-teal/15 font-black text-alm-teal">
                      {contact.nombre.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <b className="block truncate">{contact.nombre}</b>
                      <span className="block truncate text-xs text-gray-500">
                        {contact.correo || "Sin correo"} ·{" "}
                        {contact.telefono || "Sin teléfono"}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-black uppercase text-sky-700">
                      {contact.tipo}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black uppercase text-gray-600">
                      {contact.segmento}
                    </span>
                    <button
                      onClick={() => openCreate("interaccion", contact.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-bold"
                    >
                      Registrar interacción
                    </button>
                    <button
                      onClick={() => openCreate("oportunidad", contact.id)}
                      className="rounded-lg bg-alm-dark px-3 py-2 text-xs font-bold text-white"
                    >
                      Crear oportunidad
                    </button>
                  </div>
                </article>
              ))}
              {filteredContacts.length === 0 && (
                <p className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-400">
                  No hay contactos que coincidan.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "embudo" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Embudo de oportunidades</h3>
                <p className="text-sm text-gray-500">
                  Arrastra el proceso cambiando la etapa de cada oportunidad.
                </p>
              </div>
              <button
                onClick={() => openCreate("oportunidad")}
                className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
              >
                <IconPlus size={18} /> Oportunidad
              </button>
            </div>
            <div className="grid gap-4 xl:grid-cols-5">
              {STAGES.map((stage) => (
                <section
                  key={stage.id}
                  className="min-h-60 rounded-2xl bg-gray-100 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-black uppercase">
                      <i
                        className={`h-2.5 w-2.5 rounded-full ${stage.color}`}
                      />
                      {stage.label}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">
                      {oportunidades.filter((o) => o.etapa === stage.id).length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {oportunidades
                      .filter((o) => o.etapa === stage.id)
                      .map((opp) => (
                        <article
                          key={opp.id}
                          className="rounded-xl border bg-white p-3 shadow-sm"
                        >
                          <b className="block text-sm">{opp.titulo}</b>
                          <p className="mt-1 text-xs text-gray-500">
                            {contactName(opp.contacto_id)}
                          </p>
                          <p className="mt-3 font-black text-alm-mid">
                            {money.format(opp.valor)}
                          </p>
                          <select
                            value={opp.etapa}
                            onChange={(e) =>
                              void updateStage(opp, e.target.value as CrmStage)
                            }
                            className="mt-3 w-full rounded-lg border px-2 py-1.5 text-xs font-bold"
                          >
                            {[
                              ...STAGES,
                              {
                                id: "perdida" as CrmStage,
                                label: "Perdida",
                                probability: 0,
                                color: "",
                              },
                            ].map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </article>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {tab === "actividad" && (
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-2xl border bg-white">
              <header className="flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="font-black">Tareas y recordatorios</h3>
                  <p className="text-xs text-gray-500">
                    Seguimientos pendientes del equipo
                  </p>
                </div>
                <button
                  onClick={() => openCreate("tarea")}
                  className="rounded-lg bg-alm-teal p-2 text-white"
                  aria-label="Nueva tarea"
                >
                  <IconPlus size={18} />
                </button>
              </header>
              <div className="divide-y">
                {tareas.map((task) => (
                  <article key={task.id} className="flex items-start gap-3 p-4">
                    <button
                      onClick={() => void completeTask(task)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${task.estado === "completada" ? "border-emerald-500 bg-emerald-500 text-white" : "border-gray-300"}`}
                      aria-label="Cambiar estado de tarea"
                    >
                      {task.estado === "completada" && <IconCheck size={15} />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b
                          className={
                            task.estado === "completada"
                              ? "text-gray-400 line-through"
                              : ""
                          }
                        >
                          {task.titulo}
                        </b>
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-black uppercase ${task.prioridad === "urgente" ? "bg-red-100 text-red-600" : task.prioridad === "alta" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {task.prioridad}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {contactName(task.contacto_id)} ·{" "}
                        {new Date(task.vencimiento).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </article>
                ))}
                {tareas.length === 0 && (
                  <p className="p-8 text-center text-sm text-gray-400">
                    Crea el primer recordatorio.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border bg-white">
              <header className="flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="font-black">Historial de interacciones</h3>
                  <p className="text-xs text-gray-500">
                    Llamadas, mensajes, reuniones y compras
                  </p>
                </div>
                <button
                  onClick={() => openCreate("interaccion")}
                  className="rounded-lg bg-alm-teal p-2 text-white"
                  aria-label="Nueva interacción"
                >
                  <IconPlus size={18} />
                </button>
              </header>
              <div className="divide-y">
                {interaccionesVisibles.map((item) => (
                  <article key={item.id} className="flex gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-alm-teal/10 text-alm-teal">
                      <IconMessage size={18} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <b>{item.asunto}</b>
                        <span className="text-[10px] font-black uppercase text-alm-teal">
                          {item.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {contactName(item.contacto_id)} ·{" "}
                        {new Date(item.realizada_en).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      {item.detalle && (
                        <p className="mt-2 text-sm text-gray-600">
                          {item.detalle}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
                {interaccionesVisibles.length === 0 && (
                  <p className="p-8 text-center text-sm text-gray-400">
                    Aún no hay interacciones registradas.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === "ventas" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">
                  Cotizaciones y propuestas
                </h3>
                <p className="text-sm text-gray-500">
                  Control comercial desde borrador hasta aceptación.
                </p>
              </div>
              <button
                onClick={() => openCreate("cotizacion")}
                className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
              >
                <IconPlus size={18} /> Cotización
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="p-4">Folio</th>
                    <th className="p-4">Cliente / concepto</th>
                    <th className="p-4">Vigencia</th>
                    <th className="p-4 text-right">Monto</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cotizaciones.map((q) => (
                    <tr key={q.id}>
                      <td className="p-4 font-black text-alm-mid">
                        {q.folio || q.id.slice(0, 8)}
                      </td>
                      <td className="p-4">
                        <b className="block">{contactName(q.contacto_id)}</b>
                        <span className="text-xs text-gray-500">
                          {q.concepto}
                        </span>
                      </td>
                      <td className="p-4">{q.valida_hasta || "Sin límite"}</td>
                      <td className="p-4 text-right font-black">
                        {money.format(q.monto)}
                      </td>
                      <td className="p-4">
                        <select
                          value={q.estado}
                          onChange={(e) =>
                            void updateQuote(
                              q,
                              e.target.value as CrmQuote["estado"],
                            )
                          }
                          className="rounded-lg border px-2 py-1.5 text-xs font-bold"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="enviada">Enviada</option>
                          <option value="aceptada">Aceptada</option>
                          <option value="rechazada">Rechazada</option>
                          <option value="vencida">Vencida</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => downloadQuote(q)}
                          className="rounded-lg border px-3 py-2 text-xs font-bold"
                        >
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cotizaciones.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-gray-400"
                      >
                        No hay cotizaciones registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "soporte" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Atención y soporte</h3>
                <p className="text-sm text-gray-500">
                  Dudas, quejas y solicitudes con seguimiento.
                </p>
              </div>
              <button
                onClick={() => openCreate("ticket")}
                className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
              >
                <IconPlus size={18} /> Ticket
              </button>
            </div>
            <div className="grid gap-3">
              {tickets.map((ticket) => (
                <article
                  key={ticket.id}
                  className="flex flex-col gap-4 rounded-2xl border bg-white p-4 md:flex-row md:items-center"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${ticket.prioridad === "urgente" ? "bg-red-100 text-red-600" : "bg-alm-teal/10 text-alm-teal"}`}
                  >
                    <IconHeadset />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b>{ticket.asunto}</b>
                      <span className="text-[10px] font-black uppercase text-gray-400">
                        {ticket.folio}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {contactName(ticket.contacto_id)} · {ticket.categoria} ·
                      prioridad {ticket.prioridad}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {ticket.descripcion}
                    </p>
                  </div>
                  <select
                    value={ticket.estado}
                    onChange={(e) =>
                      void updateTicket(
                        ticket,
                        e.target.value as CrmTicket["estado"],
                      )
                    }
                    className="rounded-xl border px-3 py-2 text-xs font-bold"
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="esperando_cliente">Esperando cliente</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                </article>
              ))}
              {tickets.length === 0 && (
                <p className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-400">
                  No hay tickets de soporte.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === "marketing" && (
          <div className="space-y-6">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Campañas de marketing</h3>
                  <p className="text-sm text-gray-500">
                    Promociones segmentadas por canal y audiencia.
                  </p>
                </div>
                <button
                  onClick={() => openCreate("campana")}
                  className="flex items-center gap-2 rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-black text-white"
                >
                  <IconPlus size={18} /> Campaña
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {campanas.map((campaign) => (
                  <article
                    key={campaign.id}
                    className="rounded-2xl border bg-white p-5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-alm-teal/10 text-alm-teal">
                        <IconMailForward />
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black uppercase">
                        {campaign.estado}
                      </span>
                    </div>
                    <h4 className="mt-4 font-black">{campaign.nombre}</h4>
                    <p className="text-xs text-gray-500">
                      {campaign.canal} · segmento {campaign.segmento}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {campaign.mensaje}
                    </p>
                    <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                      <div>
                        <b className="block">{campaign.enviados}</b>
                        <span className="text-[9px] uppercase text-gray-400">
                          Enviados
                        </span>
                      </div>
                      <div>
                        <b className="block">{campaign.abiertos}</b>
                        <span className="text-[9px] uppercase text-gray-400">
                          Abiertos
                        </span>
                      </div>
                      <div>
                        <b className="block">{campaign.conversiones}</b>
                        <span className="text-[9px] uppercase text-gray-400">
                          Ventas
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
                {campanas.length === 0 && (
                  <p className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-400 md:col-span-2 xl:col-span-3">
                    Aún no hay campañas.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <IconRobot />
                </span>
                <div>
                  <h3 className="font-black">Automatizaciones</h3>
                  <p className="text-xs text-gray-500">
                    Reglas internas activas e integraciones externas pendientes.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {automatizaciones.map((auto) => (
                  <article
                    key={auto.id}
                    className="flex items-center gap-3 rounded-xl border p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm">{auto.nombre}</b>
                      <p className="text-xs text-gray-500">
                        Cuando: {auto.disparador.replaceAll("_", " ")} →{" "}
                        {auto.accion}
                      </p>
                      {auto.requiere_integracion && (
                        <span className="mt-1 inline-block text-[10px] font-bold text-amber-600">
                          Requiere conectar proveedor de {auto.canal}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => void toggleAutomation(auto)}
                      role="switch"
                      aria-checked={auto.activa}
                      className={`relative h-7 w-12 rounded-full transition ${auto.activa ? "bg-alm-teal" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${auto.activa ? "left-6" : "left-1"}`}
                      />
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "WhatsApp",
                  "Enlaces configurados",
                  "bg-emerald-100 text-emerald-700",
                ],
                [
                  "Correo",
                  "Proveedor SMTP pendiente",
                  "bg-amber-100 text-amber-700",
                ],
                [
                  "Redes sociales",
                  "Enlaces conectados",
                  "bg-sky-100 text-sky-700",
                ],
                ["Pagos", "Pasarela pendiente", "bg-gray-100 text-gray-600"],
              ].map(([name, status, color]) => (
                <article key={name} className="rounded-2xl border bg-white p-4">
                  <IconBuildingStore className="text-alm-teal" />
                  <b className="mt-3 block">{name}</b>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-black ${color}`}
                  >
                    {status}
                  </span>
                </article>
              ))}
            </section>
          </div>
        )}

        {tab === "equipo" && (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section className="rounded-2xl border bg-white">
              <header className="border-b p-5">
                <h3 className="font-black">Usuarios y permisos</h3>
                <p className="text-sm text-gray-500">
                  Asigna responsabilidades sin compartir acceso innecesario.
                </p>
              </header>
              <div className="divide-y">
                {equipo.map((profile) => (
                  <article
                    key={profile.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-alm-teal/10 font-black text-alm-teal">
                      {`${profile.nombre || "U"}${profile.apellidos || ""}`
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b className="block truncate">
                        {[profile.nombre, profile.apellidos]
                          .filter(Boolean)
                          .join(" ") || "Usuario"}
                      </b>
                      <p className="text-xs text-gray-500">
                        {profile.rol === "admin"
                          ? "Administrador del sistema"
                          : "Cuenta registrada"}
                      </p>
                    </div>
                    <select
                      value={
                        profile.crm_rol ||
                        (profile.rol === "admin" ? "administrador" : "cliente")
                      }
                      onChange={(e) =>
                        void updateTeamRole(
                          profile,
                          e.target.value as NonNullable<Perfil["crm_rol"]>,
                        )
                      }
                      className="rounded-xl border px-3 py-2 text-xs font-bold"
                    >
                      <option value="cliente">Cliente (sin CRM)</option>
                      <option value="lector">Solo lectura</option>
                      <option value="vendedor">Ventas</option>
                      <option value="soporte">Soporte</option>
                      <option value="marketing">Marketing</option>
                      <option value="gerente">Gerente</option>
                      <option value="administrador">Administrador</option>
                    </select>
                  </article>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border bg-white p-5">
              <h3 className="font-black">Matriz de acceso</h3>
              <p className="mt-1 text-sm text-gray-500">
                Los permisos se aplican al publicar la migración CRM.
              </p>
              <div className="mt-5 space-y-3">
                {[
                  ["Administrador", "Todo el CRM y configuración"],
                  ["Gerente", "Reportes, ventas y equipo"],
                  ["Ventas", "Clientes, embudo y cotizaciones"],
                  ["Soporte", "Clientes, tareas y tickets"],
                  ["Marketing", "Segmentos y campañas"],
                  ["Solo lectura", "Consulta sin modificaciones"],
                ].map(([role, access]) => (
                  <div key={role} className="rounded-xl bg-gray-50 p-3">
                    <b className="text-sm">{role}</b>
                    <p className="text-xs text-gray-500">{access}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {selectedContact && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-alm-dark/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setSelectedContact(null)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-contact-title"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              onClick={() => setSelectedContact(null)}
              aria-label="Cerrar ficha CRM"
              className="absolute right-5 top-5 rounded-full border p-2 text-gray-500"
            >
              <IconX />
            </button>
            <p className="text-xs font-black uppercase tracking-[.18em] text-alm-teal">
              Ficha 360° del cliente
            </p>
            <h3
              id="crm-contact-title"
              className="mt-1 pr-12 text-2xl font-black"
            >
              {selectedContact.nombre}
            </h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-5 text-sm">
                <h4 className="font-black">Datos de contacto</h4>
                <dl className="mt-4 grid gap-3">
                  <div>
                    <dt className="text-xs font-bold uppercase text-gray-400">
                      Correo
                    </dt>
                    <dd>{selectedContact.correo || "No registrado"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-gray-400">
                      Teléfono
                    </dt>
                    <dd>{selectedContact.telefono || "No registrado"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-gray-400">
                      Empresa / ubicación
                    </dt>
                    <dd>
                      {selectedContact.empresa || "Particular"} ·{" "}
                      {selectedContact.ubicacion || "Sin ubicación"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-gray-400">
                      Segmento / origen
                    </dt>
                    <dd>
                      {selectedContact.segmento} · {selectedContact.origen}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase text-gray-400">
                      Notas
                    </dt>
                    <dd>{selectedContact.notas || "Sin notas"}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl border p-5">
                <h4 className="font-black">Resumen comercial</h4>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-alm-teal/10 p-3">
                    <b className="text-xl">
                      {
                        oportunidades.filter(
                          (o) => o.contacto_id === selectedContact.id,
                        ).length
                      }
                    </b>
                    <p className="text-[10px] uppercase text-gray-500">
                      Oportunidades
                    </p>
                  </div>
                  <div className="rounded-xl bg-alm-teal/10 p-3">
                    <b className="text-xl">
                      {
                        interaccionesVisibles.filter(
                          (i) => i.contacto_id === selectedContact.id,
                        ).length
                      }
                    </b>
                    <p className="text-[10px] uppercase text-gray-500">
                      Interacciones
                    </p>
                  </div>
                  <div className="rounded-xl bg-alm-teal/10 p-3">
                    <b className="text-xl">
                      {
                        reservaciones.filter(
                          (r) =>
                            r.email_cliente.toLowerCase() ===
                            selectedContact.correo?.toLowerCase(),
                        ).length
                      }
                    </b>
                    <p className="text-[10px] uppercase text-gray-500">
                      Reservaciones
                    </p>
                  </div>
                  <div className="rounded-xl bg-alm-teal/10 p-3">
                    <b className="text-xl">
                      {
                        tickets.filter(
                          (t) => t.contacto_id === selectedContact.id,
                        ).length
                      }
                    </b>
                    <p className="text-[10px] uppercase text-gray-500">
                      Tickets
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
              <button
                onClick={() => {
                  setSelectedContact(null);
                  openCreate("interaccion", selectedContact.id);
                }}
                className="rounded-xl bg-alm-teal px-4 py-2.5 text-sm font-bold text-white"
              >
                Registrar interacción
              </button>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  openCreate("oportunidad", selectedContact.id);
                }}
                className="rounded-xl bg-alm-dark px-4 py-2.5 text-sm font-bold text-white"
              >
                Crear oportunidad
              </button>
              <button
                onClick={() => {
                  setSelectedContact(null);
                  openCreate("ticket", selectedContact.id);
                }}
                className="rounded-xl border px-4 py-2.5 text-sm font-bold"
              >
                Abrir ticket
              </button>
              {!selectedContact.derived && (
                <button
                  onClick={() => void removeContact(selectedContact)}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600"
                >
                  <IconTrash size={17} /> Eliminar
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {create && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-alm-dark/80 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setCreate(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-create-title"
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              onClick={() => setCreate(null)}
              aria-label="Cerrar formulario CRM"
              className="absolute right-5 top-5 rounded-full border p-2 text-gray-500"
            >
              <IconX />
            </button>
            <p className="text-xs font-black uppercase tracking-[.18em] text-alm-teal">
              Nuevo registro
            </p>
            <h3
              id="crm-create-title"
              className="mt-1 text-2xl font-black capitalize"
            >
              {create}
            </h3>
            <form
              onSubmit={submitCreate}
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              {create === "contacto" && (
                <>
                  <Field name="nombre" label="Nombre completo" required wide />
                  <Field name="telefono" label="Teléfono" type="tel" />
                  <Field name="correo" label="Correo" type="email" />
                  <Field name="empresa" label="Empresa" />
                  <Field name="ubicacion" label="Ubicación" />
                  <Select
                    name="tipo"
                    label="Tipo"
                    options={[
                      ["prospecto", "Prospecto"],
                      ["cliente", "Cliente"],
                      ["empresa", "Empresa"],
                    ]}
                  />
                  <Field
                    name="segmento"
                    label="Segmento"
                    placeholder="Familias, lujo, aventura…"
                  />
                  <Select
                    name="origen"
                    label="Origen"
                    options={[
                      ["manual", "Manual"],
                      ["web", "Página web"],
                      ["whatsapp", "WhatsApp"],
                      ["redes", "Redes sociales"],
                      ["referido", "Referido"],
                    ]}
                  />
                  <TextArea name="notas" label="Notas" wide />
                </>
              )}
              {create === "interaccion" && (
                <>
                  <ContactSelect
                    contacts={contactosDerivados}
                    defaultValue={prefillContact}
                    required
                  />
                  <Select
                    name="tipo"
                    label="Tipo"
                    options={[
                      ["llamada", "Llamada"],
                      ["whatsapp", "WhatsApp"],
                      ["correo", "Correo"],
                      ["reunion", "Reunión"],
                      ["compra", "Compra"],
                      ["nota", "Nota"],
                    ]}
                  />
                  <Field name="asunto" label="Asunto" required wide />
                  <Field
                    name="realizada_en"
                    label="Fecha y hora"
                    type="datetime-local"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                  />
                  <TextArea name="detalle" label="Detalle" wide />
                </>
              )}
              {create === "oportunidad" && (
                <>
                  <ContactSelect
                    contacts={contactosDerivados}
                    defaultValue={prefillContact}
                  />
                  <Field name="titulo" label="Nombre de oportunidad" required />
                  <Field
                    name="valor"
                    label="Valor estimado (MXN)"
                    type="number"
                    required
                  />
                  <Select
                    name="etapa"
                    label="Etapa inicial"
                    options={STAGES.slice(0, 4).map((s) => [s.id, s.label])}
                  />
                  <Field
                    name="cierre_estimado"
                    label="Cierre estimado"
                    type="date"
                  />
                  <TextArea name="notas" label="Notas" wide />
                </>
              )}
              {create === "tarea" && (
                <>
                  <ContactSelect
                    contacts={contactosDerivados}
                    defaultValue={prefillContact}
                  />
                  <Field name="titulo" label="Tarea" required />
                  <Field
                    name="vencimiento"
                    label="Fecha y hora límite"
                    type="datetime-local"
                    required
                  />
                  <Select
                    name="prioridad"
                    label="Prioridad"
                    options={[
                      ["baja", "Baja"],
                      ["media", "Media"],
                      ["alta", "Alta"],
                      ["urgente", "Urgente"],
                    ]}
                  />
                  <TextArea name="descripcion" label="Descripción" wide />
                </>
              )}
              {create === "cotizacion" && (
                <>
                  <ContactSelect
                    contacts={contactosDerivados}
                    defaultValue={prefillContact}
                  />
                  <Field name="concepto" label="Concepto" required />
                  <Field
                    name="monto"
                    label="Monto (MXN)"
                    type="number"
                    required
                  />
                  <Field name="valida_hasta" label="Válida hasta" type="date" />
                  <TextArea name="notas" label="Condiciones y notas" wide />
                </>
              )}
              {create === "ticket" && (
                <>
                  <ContactSelect
                    contacts={contactosDerivados}
                    defaultValue={prefillContact}
                  />
                  <Field name="asunto" label="Asunto" required />
                  <Select
                    name="categoria"
                    label="Categoría"
                    options={[
                      ["consulta", "Consulta"],
                      ["queja", "Queja"],
                      ["cambio", "Cambio"],
                      ["cancelacion", "Cancelación"],
                      ["pago", "Pago"],
                      ["otro", "Otro"],
                    ]}
                  />
                  <Select
                    name="prioridad"
                    label="Prioridad"
                    options={[
                      ["baja", "Baja"],
                      ["media", "Media"],
                      ["alta", "Alta"],
                      ["urgente", "Urgente"],
                    ]}
                  />
                  <TextArea
                    name="descripcion"
                    label="Descripción"
                    required
                    wide
                  />
                </>
              )}
              {create === "campana" && (
                <>
                  <Field
                    name="nombre"
                    label="Nombre de campaña"
                    required
                    wide
                  />
                  <Select
                    name="canal"
                    label="Canal"
                    options={[
                      ["correo", "Correo"],
                      ["whatsapp", "WhatsApp"],
                      ["facebook", "Facebook"],
                      ["instagram", "Instagram"],
                      ["tiktok", "TikTok"],
                    ]}
                  />
                  <Field
                    name="segmento"
                    label="Segmento"
                    placeholder="Todos, familias, lujo…"
                  />
                  <Field name="asunto" label="Asunto" wide />
                  <Field
                    name="programada_para"
                    label="Programar para"
                    type="datetime-local"
                  />
                  <TextArea name="mensaje" label="Mensaje" required wide />
                </>
              )}
              <div className="mt-2 flex gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setCreate(null)}
                  className="rounded-xl bg-gray-100 px-5 py-3 font-bold text-gray-600"
                >
                  Cancelar
                </button>
                <button className="flex-1 rounded-xl bg-alm-teal py-3 font-black text-white">
                  Guardar registro
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  wide,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  wide?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label
      className={`text-[11px] font-bold uppercase text-gray-500 ${wide ? "sm:col-span-2" : ""}`}
    >
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={type === "number" ? 0 : undefined}
        className="mt-1 w-full rounded-xl border px-4 py-3 text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-alm-teal"
      />
    </label>
  );
}
function TextArea({
  name,
  label,
  required,
  wide,
}: {
  name: string;
  label: string;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <label
      className={`text-[11px] font-bold uppercase text-gray-500 ${wide ? "sm:col-span-2" : ""}`}
    >
      {label}
      <textarea
        name={name}
        required={required}
        className="mt-1 h-24 w-full rounded-xl border px-4 py-3 text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-alm-teal"
      />
    </label>
  );
}
function Select({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: string[][];
}) {
  return (
    <label className="text-[11px] font-bold uppercase text-gray-500">
      {label}
      <select
        name={name}
        className="mt-1 w-full rounded-xl border px-4 py-3 text-sm font-normal normal-case outline-none focus:ring-2 focus:ring-alm-teal"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
function ContactSelect({
  contacts,
  defaultValue,
  required,
}: {
  contacts: CrmContact[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="text-[11px] font-bold uppercase text-gray-500">
      Contacto
      <select
        name="contacto_id"
        required={required}
        defaultValue={defaultValue || ""}
        className="mt-1 w-full rounded-xl border px-4 py-3 text-sm font-normal normal-case"
      >
        <option value="">Sin contacto</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
            {c.correo ? ` · ${c.correo}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
