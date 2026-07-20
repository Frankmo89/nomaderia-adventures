// Zod schemas del contrato JSONB v1 de itinerarios (ADR-018).
// Espejan los tipos de @/types/itinerary. Tolerantes con datos legacy:
// passthrough() en objetos y todos los extras opcionales, para que validar
// contenido existente nunca lo rechace por campos desconocidos.
import { z } from "zod";
import type { BlockExtra, BlockTipo, ContentV1, ItBlock } from "@/types/itinerary";

export const blockTipoSchema = z.enum([
  "ruta", "comida", "alojamiento", "traslado",
  "tip_seguridad", "permiso", "costo", "nota",
]);

export const blockExtraSchema = z
  .object({
    distancia_km: z.number().nullable().optional(),
    desnivel_m: z.number().nullable().optional(),
    apto_principiante: z.boolean().optional(),
    trail_id: z.string().nullable().optional(),
    duracion: z.string().nullable().optional(),
    modo: z.enum(["auto", "shuttle", "caminar", "vuelo"]).nullable().optional(),
    origen: z.string().nullable().optional(),
    destino: z.string().nullable().optional(),
    reservado: z.boolean().optional(),
    confirmacion_ref: z.string().nullable().optional(),
    campground_id: z.string().nullable().optional(),
  })
  .passthrough();

export const bloqueSchema = z
  .object({
    id: z.string().min(1),
    tipo: blockTipoSchema,
    titulo: z.string().min(1),
    contenido_md: z.string().nullable().optional(),
    horario: z.string().nullable().optional(),
    precio_usd: z.number().nullable().optional(),
    precio_nota: z.string().nullable().optional(),
    fuente_url: z.string().nullable().optional(),
    afiliado_url: z.string().nullable().optional(),
    verify_flag: z.string().nullable().optional(),
    extra: blockExtraSchema.nullable().optional(),
  })
  .passthrough();

export const diaSchema = z
  .object({
    dia: z.number().int().min(1),
    titulo: z.string(),
    bloques: z.array(bloqueSchema),
    fecha: z.string().nullable().optional(),
  })
  .passthrough();

export const contentV1Schema = z
  .object({
    version: z.literal(1),
    parque: z.string().optional(),
    hero_image_url: z.string().optional(),
    dias: z.array(diaSchema),
  })
  .passthrough();

// ─── Form schema del builder (inline edit — RHF) ─────────────────────────────
// Nivel formulario: numéricos como string (inputs), switches como boolean.
// La conversión a bloque v1 valida con bloqueSchema al final.

export const bloqueFormSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  contenido_md: z.string().optional(),
  horario: z.string().optional(),
  precio_usd: z.string().optional(),
  precio_nota: z.string().optional(),
  fuente_url: z.string().optional(),
  afiliado_url: z.string().optional(),
  verify_flag_on: z.boolean(),
  // ruta
  distancia_km: z.string().optional(),
  desnivel_m: z.string().optional(),
  apto_principiante: z.boolean(),
  // traslado / vuelo
  duracion: z.string().optional(),
  modo: z.string().optional(),
  origen: z.string().optional(),
  destino: z.string().optional(),
  // alojamiento
  reservado: z.boolean(),
  confirmacion_ref: z.string().optional(),
});

export type BloqueFormValues = z.infer<typeof bloqueFormSchema>;

export function bloqueToFormValues(block: ItBlock): BloqueFormValues {
  return {
    titulo: block.titulo,
    contenido_md: block.contenido_md ?? "",
    horario: block.horario ?? "",
    precio_usd: block.precio_usd != null ? String(block.precio_usd) : "",
    precio_nota: block.precio_nota ?? "",
    fuente_url: block.fuente_url ?? "",
    afiliado_url: block.afiliado_url ?? "",
    verify_flag_on: block.verify_flag != null,
    distancia_km: block.extra?.distancia_km != null ? String(block.extra.distancia_km) : "",
    desnivel_m: block.extra?.desnivel_m != null ? String(block.extra.desnivel_m) : "",
    apto_principiante: block.extra?.apto_principiante ?? false,
    duracion: block.extra?.duracion ?? "",
    modo: block.extra?.modo ?? "",
    origen: block.extra?.origen ?? "",
    destino: block.extra?.destino ?? "",
    reservado: block.extra?.reservado ?? false,
    confirmacion_ref: block.extra?.confirmacion_ref ?? "",
  };
}

const MODO_VALUES = ["auto", "shuttle", "caminar", "vuelo"] as const;
type ModoVal = (typeof MODO_VALUES)[number];
const isModo = (v: string): v is ModoVal =>
  (MODO_VALUES as readonly string[]).includes(v);

/**
 * Construye un bloque v1 desde los valores del formulario. Preserva campos
 * `extra` desconocidos del bloque existente (tolerancia del contrato) y
 * valida el resultado con bloqueSchema antes de devolverlo.
 */
export function formValuesToBloque(
  tipo: BlockTipo,
  values: BloqueFormValues,
  existing?: ItBlock | null,
  extraOverrides?: Partial<BlockExtra>,
): ItBlock {
  const today = new Date().toISOString().slice(0, 10);

  let extraFields: Partial<BlockExtra> = {};
  if (tipo === "ruta") {
    extraFields = {
      distancia_km: values.distancia_km ? Number(values.distancia_km) : null,
      desnivel_m: values.desnivel_m ? Number(values.desnivel_m) : null,
      apto_principiante: values.apto_principiante,
    };
  } else if (tipo === "traslado") {
    extraFields = {
      duracion: values.duracion || null,
      modo: values.modo && isModo(values.modo) ? values.modo : null,
      origen: values.origen || null,
      destino: values.destino || null,
    };
  } else if (tipo === "alojamiento") {
    extraFields = {
      reservado: values.reservado,
      confirmacion_ref: values.confirmacion_ref || null,
    };
  }

  const mergedExtra: BlockExtra | null =
    Object.keys(extraFields).length > 0 || existing?.extra || extraOverrides
      ? { ...(existing?.extra ?? {}), ...extraFields, ...(extraOverrides ?? {}) }
      : null;

  const block: ItBlock = {
    id: existing?.id ?? crypto.randomUUID(),
    tipo,
    titulo: values.titulo,
    contenido_md: values.contenido_md || null,
    horario: values.horario || null,
    precio_usd: values.precio_usd ? Number(values.precio_usd) : null,
    precio_nota: values.precio_nota || null,
    fuente_url: values.fuente_url || null,
    afiliado_url: values.afiliado_url || null,
    verify_flag: values.verify_flag_on
      ? existing?.verify_flag ?? `⚠️ VERIFICAR (IA) [${today}]`
      : null,
    extra: mergedExtra,
  };
  return bloqueSchema.parse(block) as ItBlock;
}

/** Contenido v1 vacío con N días numerados — seed del diálogo de creación. */
export function crearContenidoVacio(numDias: number, parque?: string): ContentV1 {
  const dias = Array.from({ length: numDias }, (_, i) => ({
    dia: i + 1,
    titulo: `Día ${i + 1}`,
    bloques: [],
  }));
  const content: ContentV1 = parque
    ? { version: 1, parque, dias }
    : { version: 1, dias };
  return contentV1Schema.parse(content) as ContentV1;
}
