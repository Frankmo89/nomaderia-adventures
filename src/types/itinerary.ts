// Tipos canónicos del contrato JSONB v1 de itinerarios (ADR-018).
// Compartidos por itinerary_templates.content y client_itineraries.content.
// El contrato v1 en español es canónico: solo se extiende con campos
// OPCIONALES — nunca renombrar ni cambiar el tipo de un campo existente.
//
// Dos vistas del mismo contrato:
//   • ItBlock/ItDay/ContentV1 — forma que escribe el editor admin
//     (ItineraryBlockEditor): extras anidados en `extra`.
//   • ItineraryBlock/ItineraryDay/ItineraryContent — forma tolerante que lee
//     la página pública /i/:token vía RPC: acepta extras aplanados en la raíz
//     del bloque (datos legacy) además del resto de campos.

export type BlockTipo =
  | "ruta" | "comida" | "alojamiento" | "traslado"
  | "tip_seguridad" | "permiso" | "costo" | "nota";

export interface BlockExtra {
  // ruta
  distancia_km?: number | null;
  desnivel_m?: number | null;
  apto_principiante?: boolean;
  /** park_things_to_do.id — para autocomplete de rutas (extensión ADR-018/ADR-021) */
  trail_id?: string | null;
  // traslado
  duracion?: string | null;
  /** "vuelo" (aditivo ADR-018): un vuelo se modela como traslado con modo "vuelo" */
  modo?: "auto" | "shuttle" | "caminar" | "vuelo" | null;
  /** origen/destino del traslado (extensión ADR-018) */
  origen?: string | null;
  destino?: string | null;
  // alojamiento (extensiones ADR-018)
  /** true cuando la reserva ya está confirmada (badge "Reservado") */
  reservado?: boolean;
  /** número/código de confirmación de la reserva */
  confirmacion_ref?: string | null;
  /** facilityId de RIDB (park_live_data.campgrounds) o campgrounds.id */
  campground_id?: string | null;
}

export interface ItBlock {
  id: string;
  tipo: BlockTipo;
  titulo: string;
  contenido_md: string | null;
  horario: string | null;
  precio_usd: number | null;
  precio_nota: string | null;
  fuente_url: string | null;
  afiliado_url: string | null;
  verify_flag: string | null;
  extra?: BlockExtra | null;
}

export interface ItDay {
  dia: number;
  titulo: string;
  bloques: ItBlock[];
  /** fecha calendario opcional del día, "YYYY-MM-DD" (extensión ADR-018) */
  fecha?: string | null;
}

export interface ContentV1 {
  version: 1;
  parque?: string;
  hero_image_url?: string;
  dias: ItDay[];
}

// ─── Vista pública (RPC get_itinerary_by_token) ──────────────────────────────
// Tolerante: los extras pueden venir aplanados en la raíz del bloque (legacy).

export type BlockType = BlockTipo;

export interface ItineraryBlock {
  id: string;
  tipo: BlockType;
  titulo: string;
  contenido_md?: string | null;
  horario?: string | null;
  precio_usd?: number | null;
  precio_nota?: string | null;
  fuente_url?: string | null;
  afiliado_url?: string | null;
  verify_flag?: string | null;
  distancia_km?: number | null;
  desnivel_m?: number | null;
  apto_principiante?: boolean | null;
  duracion?: string | null;
  modo?: string | null;
  extra?: BlockExtra | null;
}

export interface ItineraryDay {
  dia: number;
  titulo: string;
  bloques: ItineraryBlock[];
  fecha?: string | null;
}

export interface ItineraryContent {
  version: number;
  parque?: string;
  hero_image_url?: string;
  dias: ItineraryDay[];
}

export interface ClientItinerary {
  client_name: string;
  trip_start: string | null;
  trip_end: string | null;
  content: ItineraryContent;
  status: string;
  updated_at: string;
  /** título del viaje — añadido (aditivo) por la migración 20260719150000 */
  title?: string | null;
}
