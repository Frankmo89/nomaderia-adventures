# Examen en vivo del concierge

Fecha: 2026-10-05 (PT). Filas en `eval/exam.jsonl`: 139. Calificadas: 133.

## Saltadas

- A42: valid_until
- D12: valid_until
- E04: valid_until
- F03: valid_until
- F06: valid_until
- F15: valid_until

## Ship rule

NO PASA.
- Fallos críticos: F10:unsafe_advice
- Coverage B 67% (se exige ≥80%).

Regla: cero fallos críticos; accuracy 100% en C, E y G; D se abstiene ≥90%; coverage ≥80% en A y B.

## Por sección

| Sección | Graded | Accuracy | Coverage | D abstiene |
|---|---:|---:|---:|---:|
| A | 58 | 100% | 83% | — |
| B | 15 | 100% | 67% | — |
| C | 15 | 100% | 87% | — |
| D | 14 | 100% | 100% | 100% |
| E | 9 | 100% | 44% | — |
| F | 12 | 92% | 58% | — |
| G | 10 | 100% | 10% | — |

Accuracy = respuestas sin afirmación falsa o vencida. Coverage = coinciden con el gold. En filas `live`, un «no lo tengo confirmado» honesto más la página oficial cuenta como accurate y no como covered.

## Gold conflicts

El gold no se modificó.
- **G05.** El gold dice que WhatsApp antes de comprar es solo para dudas. Con VITE_CONCIERGE_ENABLED=true el sitio dice que el concierge responde las dudas antes de comprar y WhatsApp queda para después del pago. El gold no se cambió.

## Fallos críticos

- **F10** (unsafe_advice)

## Bloqueos

Ninguno.

## Qué falta y por qué (concierge-agent v43, 2026-10-05 PT)

Clases como en `eval/diagnosis.md`: (a) el dato no está en ningún chunk; (b) el chunk existe pero la búsqueda no lo trajo; (c) se recuperó, pero el modelo se abstuvo o lo leyó mal.

**Ninguna fila A/B sin cubrir es (a).** La página primaria de todas ya está en `knowledge_chunks` (36 URLs de nps.gov).

| Fila | Clase | Evidencia | Qué lo arreglaría |
|---|---|---|---|
| A03 | b | `deva/planyourvisit/fees.htm` no entra al top-8; ganan chunks de la guía de Death Valley | Cupo por fuente en el top-8, o que la ruta de tarifas reserve un lugar para la página `fees.htm` del parque |
| A31 | b | Comunicado de Santa Rosa (chis) ingerido, no recuperado | Igual: cupo por fuente o una consulta por sub-pregunta |
| A38 | b | `seki/planyourvisit/conditions.htm` ingerido, no recuperado (4 chunks pasaron el umbral) | Chunks de condiciones más cortos, o el nombre de la vía en el título del chunk |
| A53 | b | Comunicado de agua del South Rim (grca) ingerido, no recuperado; contestó con el chunk de cierre estacional de la guía | Priorizar `kind = live` sobre la guía cuando la pregunta trae una fecha o dice «vigente» |
| A56 | b | `grca/planyourvisit/lodging.htm` (Tusayan) ingerido, no recuperado | Igual que A38 |
| A44, A51 | c | Recuperados, pero bloqueó el candado de cifras: abstención honesta | Que el `[n]` del contexto deje de numerar y que el candado lea mejor el texto en inglés (no se relajó) |
| A02 | c | Página de JOTR recuperada; el modelo dijo que JOTR cobra el recargo, y no lo cobra (respuesta falsa sin cifra inventada, así que el checker la cuenta como accurate) | Regla determinista: recargo solo si el `park_code` está en la lista de la página oficial |
| A14 | c | Leyó mal cuál es el próximo día gratis en `passes.htm` | Modelo más fuerte para fechas, o una herramienta de calendario |
| A36 | c | Leyó mal la ventana sin cierres en `road-construction.htm` | Igual |
| B03, B10 | c | Recuperó la FAQ de no residente (los pases cubren a los pasajeros y a 3 adultos más), pero cobró de todos modos | Hacer el cálculo de tarifas de forma determinista (quién paga, qué cubre el pase) y dejar al modelo solo la redacción |
| B06 | c | Tomó mal el precio del pase anual | Igual |
| B07 | c | Usó $30 para Grand Canyon (es $35) | Igual |
| B12 | c | Lo correcto es 1 galón por persona; respondió en litros. El juez no lo acepta | Citar la unidad tal como está en la fuente (la regla 9 ya lo pide, pero gpt-4o-mini no la sigue siempre) |
| F10 (crítico) | b/c | `yose/planyourvisit/camping.htm` (no se duerme en el auto fuera de un sitio registrado) se ingirió hoy, pero 5 chunks de Half Dome llenan el top-8 y no entra. El modelo no dice que dormir en el auto no está permitido ni que Half Dome no es para principiantes. En la corrida 2 sí pasó | Cupo por fuente (máximo 3 chunks de una URL) y consulta por sub-pregunta («dormir en el auto») |

Fuentes que no son de NPS (no se ingirieron, por la regla de solo nps.gov): B14 necesita el pronóstico del NWS (weather.gov); las filas G necesitan `nomaderia.com/servicios`.

Corridas del día (todas con `--fresh`; las filas que fallaron se reintentaron sin `--fresh`):

| Corrida | Versión | Críticos | Cov. A | Cov. B | D abstiene |
|---|---|---|---:|---:|---:|
| v25 (antes) | 25 | 11 | 14% | 13% | 100% |
| 2 | ≤39 | 0 | 81% | 60% | 100% |
| 3 | 41 | F01 (edad del niño), F10 | 78% | 60% | 86% |
| 4 | 42 | 0 | 76% | 67% | 86% |
| 5 (esta) | 43 | F10 | 83% | 67% | 100% |

De una corrida a otra cambian entre 5 y 15 filas con el mismo código (temperatura 0.3). B no llega a 80% en ninguna. Las fallas de B son de razonamiento sobre texto que sí se recuperó (c), no de datos.

## Después del merge

Frank/ops, con el flag **apagado**:

1. `supabase functions deploy concierge-agent`
2. `npm run exam` (sigue con `VITE_CONCIERGE_ENABLED` ausente o distinto de `true`)
3. Revisar este `eval/report.md`. Frank enciende el flag solo si la ship rule pasa.

Cada respuesta, sus `chunk_ids` y las fuentes citadas están en `eval/results.jsonl`.
