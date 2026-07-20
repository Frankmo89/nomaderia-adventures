// Zod schemas del contrato JSONB v1 de itinerarios (ADR-018).
// Espejan los tipos de @/types/itinerary. Tolerantes con datos legacy:
// passthrough() en objetos y todos los extras opcionales, para que validar
// contenido existente nunca lo rechace por campos desconocidos.
import { z } from "zod";
import type { ContentV1 } from "@/types/itinerary";

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
    modo: z.enum(["auto", "shuttle", "caminar"]).nullable().optional(),
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
