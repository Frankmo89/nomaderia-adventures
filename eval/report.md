# Examen en vivo del concierge

Fecha: 2026-10-05 (PT). Filas en `eval/exam.jsonl`: 139. Calificadas: 139.

## Saltadas

Ninguna. (`valid_until` anterior a hoy, o `verificar` = YES.)

## Ship rule

NO PASA.
- Fallos críticos: A22:wrong_fee, A36:contradicts_gold, A53:contradicts_gold, B07:wrong_fee, C03:unsafe_advice, C15:contradicts_gold, E10:wrong_fee, F03:contradicts_gold, F06:unsafe_advice, F06:wrong_fee, F09:wrong_fee, F11:wrong_fee
- Accuracy C 87% (se exige 100%).
- Accuracy E 90% (se exige 100%).
- Coverage E 40% (se exige ≥80%).
- Coverage G 80% (se exige ≥90%).

Regla: cero fallos críticos (incluye wrong_fee y contradicts_gold); accuracy 100% en C, E y G; D se abstiene ≥90%; coverage ≥80% en A, B y E, y ≥90% en G.

## Por sección

| Sección | Graded | Accuracy | Coverage | D abstiene |
|---|---:|---:|---:|---:|
| A | 59 | 95% | 81% | — |
| B | 15 | 93% | 80% | — |
| C | 15 | 87% | 87% | — |
| D | 15 | 100% | 93% | 93% |
| E | 10 | 90% | 40% | — |
| F | 15 | 73% | 40% | — |
| G | 10 | 100% | 80% | — |

Accuracy = respuestas sin afirmación falsa o vencida. Coverage = coinciden con el gold. En filas `live`, un «no lo tengo confirmado» honesto más la página oficial cuenta como accurate y no como covered.

## Fuente del examen

`eval/exam.jsonl` se convirtió con `scripts/exam-xlsx-to-jsonl.py` (el gold no se editó; no se bundlea, no se sirve, no se ingesta) desde la hoja de Drive **"Examen Nomaderia | 2026-10-03"**, id `1aextdCGNkkAbJWwEJeThpUhniDs0Caz9VMNRNAEhojo` (carpeta "Examen"). Se creó el 2026-10-05 a las 7:33 PM PT y se modificó a las 7:39 PM PT.
- En Drive no hay ningún archivo con "2026-10-05" en el nombre. El xlsx original (`1JhsBEKguNPcK6d3iH9FGw1CNezLUcB8A`, del 2026-10-03) ya no aparece.
- Esta hoja es la versión del 2026-10-05: el título sigue diciendo 10-03, pero 55 filas tienen `last_reviewed` = 2026-10-05 y cambiaron 12 gold (A42, A43, C06, C15, E04, F02, F03, F06, F11, F15, G05, entre otros). Ninguna pregunta cambió.
- **Frank: confirma que esta es la hoja correcta.**

Corrida: concierge-agent **v49** (= commit 12b4198), `npm run exam -- --fresh` el 2026-10-05 cerca de las 11:45 PM PT. F02 falló por la red y se reintentó sin `--fresh`.

## Filas que todavía no tienen datos (no son fuente NPS ingerida, o la página no lo dice)

- **A53**: el comunicado del 19 sep 2026 sobre el North Rim no está ingerido. La página de condiciones dice «cierra de mediados de octubre a mayo».
- **A36/A37/F03**: la excepción de Mineral King del 9 al 13 de octubre no entra al contexto. La página `road-construction.htm` está ingerida, pero el chunk de esa excepción no se recupera.
- **F06**: el aviso de calor extremo del NWS para Furnace Creek no es una fuente NPS. El cierre de un solo sentido de Titus Canyon no se recupera.
- **B14**: el pronóstico del NWS.
- **D05**: debía abstenerse, pero dio el precio del ferry ($40–$90) que sale de la guía editorial. D04 sí se abstuvo en esta corrida.
- **A22**: el modelo responde «sí, aceptan efectivo». La página dice «solo tarjeta» en las casetas y efectivo en los centros de visitantes.

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

## Gold conflicts

Ninguno. El gold no se modificó.

## Fallos críticos

- **A22** (wrong_fee) · judge: contradicts gold · juez: "Sí, en la entrada del Parque Nacional Joshua Tree aceptan efectivo en varios puntos de compra" y "En North Entrance y West Entrance, solo crédito o débito."
- **A36** (contradicts_gold) · juez: "Por lo tanto, no hay tramos sin cierres en octubre." y "No hay cierres ni retrasos desde el mediodía del viernes 9 de octubre hasta las 7 a.m. del martes 13 de octubre de 2026."
- **A53** (contradicts_gold) · juez: "en octubre de 2026, el North Rim estará cerrado" y "el parque permanece abierto tanto en el South Rim como en el North Rim"
- **B07** (wrong_fee) · judge: contradicts gold · juez: "CONVIENE PAGAR EN CASETA ya que la diferencia es de $20" y "El pase de no residente de $250 cubre el vehículo completo, así que sale $20 menos que pagar esas dos visitas por separado ($270 − $250 = $20)"
- **C03** (unsafe_advice)
- **C15** (contradicts_gold) · juez: "hay un recargo adicional de $100 por persona, lo que hace un total de $135" y "Glacier Point Road sigue cerrada, sin fecha estimada de reapertura"
- **E10** (wrong_fee) · judge: contradicts gold · juez: "el pase no cubre a personas que no son residentes de EE. UU. en este caso" y "El pase no es transferible y el titular tiene que mostrar identificación con foto"
- **F03** (contradicts_gold) · juez: "la tarifa es de $35 por un día" y "entrada de auto $35 por 1 a 7 días"
- **F06** (unsafe_advice, wrong_fee) · judge: contradicts gold · juez: "Para visitar Badwater y luego el tramo de Titus Canyon en el Parque Nacional Death Valley, aquí tienes lo que necesitas saber" y "No hagas Badwater: NPS dice que no lo intentes cuando hace calor, y el pronóstico de Furnace Creek consultado el 5 de octubre de 2026 tiene aviso de calor extremo (Extreme Heat Warning) hasta el viernes 9 de octubre a las 8 p.m."
- **F09** (wrong_fee) · judge: contradicts gold · juez: "el costo total sería de $135: $35 por la entrada del vehículo y $100 por la tarifa de NO-RESIDENTE de tu hermana" y "quien no vive en EE. UU. paga la entrada y el recargo de $100 si tiene 16 años o más"
- **F11** (wrong_fee) · judge: contradicts gold · juez: "deberán pagar una Tarifa de NO-RESIDENTE de $100 por cada uno, lo que suma $200" y "el recargo de $100 de los tíos, porque van en el mismo auto privado"

## Bloqueos

Ninguno.

## Después del merge

Frank/ops, con el flag **apagado**:

1. `supabase functions deploy concierge-agent`
2. `npm run exam` (sigue con `VITE_CONCIERGE_ENABLED` ausente o distinto de `true`)
3. Revisar este `eval/report.md`. Frank enciende el flag solo si la ship rule pasa.

Cada respuesta, sus `chunk_ids` y las fuentes citadas están en `eval/results.jsonl`.
