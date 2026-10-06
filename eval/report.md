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

## Re-score v43 con regla estricta

Mismas respuestas de la corrida 5 (concierge-agent v43, 2026-10-05). **No se volvió a llamar a la función.** Se volvió a calificar con `npm run exam -- --rescore`:
- Un hecho que contradice el gold es crítico aunque la cifra esté en algún chunk. En preguntas de tarifas se marca `wrong_fee`: «Sí/No» al revés del gold, un total que no coincide con ningún monto de la fórmula del gold, o que el juez marque `contradicts_gold`. En el resto se marca `contradicts_gold`.
- El juez ahora es gpt-4o (`EXAM_JUDGE_MODEL`) a temperatura 0. Con gpt-4o-mini el mismo `contradicts_gold` cambiaba entre corridas (por ejemplo, A14).
- Ship rule nueva: además, coverage ≥80% en E y ≥90% en G.

Accuracy real (re-score estricto):

| Sección | Graded | Accuracy | Coverage | D abstiene |
|---|---:|---:|---:|---:|
| A | 58 | 86% | 74% | — |
| B | 15 | 67% | 67% | — |
| C | 15 | 93% | 86% | — |
| D | 14 | 100% | 100% | 100% |
| E | 9 | 89% | 25% | — |
| F | 12 | 58% | 33% | — |
| G | 10 | 100% | 0% | — |

Antes (regla vieja, mismas respuestas):

| Sección | Graded | Accuracy | Coverage | D abstiene |
|---|---:|---:|---:|---:|
| A | 58 | 100% | 83% | — |
| B | 15 | 100% | 67% | — |
| C | 15 | 100% | 87% | — |
| D | 14 | 100% | 100% | 100% |
| E | 9 | 100% | 44% | — |
| F | 12 | 92% | 58% | — |
| G | 10 | 100% | 10% | — |

Críticos nuevos (re-score estricto):

- **A02** (wrong_fee) · polarity: gold no, answer si; judge: contradicts gold · juez: La respuesta afirma un recargo de $100 que el gold niega.
- **A14** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que el próximo día de entrada gratis es el 11 de noviembre, mientras que el gold dice que es el 27 de octubre.
- **A21** (wrong_fee) · judge: contradicts gold · juez: La respuesta menciona un pase de no residente de $250 que el gold no menciona, lo cual contradice la información del gold.
- **A36** (contradicts_gold) · juez: La respuesta contradice el gold al afirmar que no hay tramos sin cierres en octubre, mientras que el gold menciona un tramo específico sin cierres del 9 al 13 de octubre de 2026.
- **A37** (contradicts_gold) · juez: La respuesta omite la excepción del 9 al 13 de octubre y afirma que fuera de los horarios de paso no hay cierres ni demoras, lo cual contradice el gold.
- **A41** (wrong_fee) · judge: contradicts gold · juez: La respuesta contradice el gold al afirmar que hay una tarifa adicional de $100 para no residentes, mientras que el gold menciona que no se paga un recargo de $100 con el pase anual.
- **A53** (contradicts_gold) · juez: La respuesta afirma que el North Rim está cerrado en octubre de 2026, mientras que el gold indica que está abierto con operaciones modificadas.
- **A58** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que el pase cubre el vehículo completo o 2 motocicletas, lo cual contradice el gold que menciona una cuota de vehículo privado o cuatro cuotas por persona. Además, introduce una tarifa adicional para no residentes que el gold no menciona.
- **B03** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que hay un recargo de $200 y una entrada de $35, lo cual contradice el gold que dice que no hay costo extra.
- **B06** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que el pase cuesta $55, mientras que el gold dice $80. Esto es una contradicción.
- **B07** (wrong_fee) · total: answer $265 not in gold; judge: contradicts gold · juez: La respuesta afirma que el costo total es $265, mientras que el gold dice $270. Además, la diferencia de ahorro con el pase es diferente: $15 en la respuesta y $20 en el gold.
- **B09** (wrong_fee) · total: answer $360 not in gold; judge: contradicts gold · juez: La respuesta contradice el gold en el cálculo del ahorro y el costo sin pase. El gold dice que sin pase serían $480 y se ahorran $230, mientras que la respuesta dice que sin pase serían $360 y no se ahorran dinero, sino que gastan $110 más.
- **B10** (wrong_fee) · total: answer $480 not in gold; judge: contradicts gold · juez: La respuesta afirma que el total para cuatro adultos es $480, lo cual contradice el gold que dice que el pase cubre al titular y tres adultos adicionales sin costo extra. Además, el gold menciona un recargo de $100 que no se menciona en la respuesta.
- **C15** (contradicts_gold) · juez: La respuesta menciona una tarifa de entrada de $100 por persona y $35 por vehículo, lo cual contradice el gold que no menciona tarifas. Además, el gold menciona restricciones de fuego y el cierre de Glacier Point Road, que no se mencionan en la respuesta.
- **E10** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que hay un recargo de $100 por ser no residente, lo cual no se menciona en el gold. Además, el gold menciona que el pase no es transferible y requiere identificación, lo cual no se aborda en la respuesta.
- **F02** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que se debe pagar $35 por la entrada del auto, lo cual contradice el gold que indica que con el pase vigente no se paga entrada ni recargo.
- **F08** (wrong_fee) · judge: contradicts gold · juez: La respuesta menciona tarifas de no residente de $100 en Joshua Tree, lo cual contradice el gold que dice que solo se paga la entrada de $30 por auto en Joshua Tree. Además, el gold menciona un recargo de $100 en Yosemite y Grand Canyon, no en Joshua Tree.
- **F09** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que la hermana debe pagar $100 más $35, mientras que el gold dice que solo paga el recargo de $100 si no va en el auto del residente con pase.
- **F10** (contradicts_gold) · juez: La respuesta sugiere que se puede estacionar en Curry Village y dormir en el auto, lo cual contradice el gold que dice que no se puede dormir en el auto fuera de un sitio reservado. Además, menciona tarifas de entrada que no están en el gold.
- **F11** (wrong_fee) · judge: contradicts gold · juez: La respuesta afirma que se debe pagar una tarifa de no residente de $100 por cada tío en Yosemite, lo cual contradice el gold que indica que el pase America the Beautiful cubre esa tarifa. Además, el gold menciona que Joshua Tree no tiene recargo, mientras que la respuesta no lo aclara.

Revisión manual (no cambia el conteo):
- **Probables falsos positivos del juez:** A58 (la respuesta repite `passes.htm`: vehículo completo, 2 motos o titular + 3 adultos) y C15 (habla de tarifas que el gold no trata).
- **Errores reales confirmados:** A02, A14, A41, B03, B06, B07, B09, B10, F02, F08, F09 y F11 son tarifas o fechas mal dichas.

**Veredicto v43 con la regla estricta: NO PASA**, con 20 críticos.

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
