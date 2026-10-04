# Examen en vivo del concierge

Fecha: 2026-10-03 (PT). Filas en `eval/exam.jsonl`: 139. Calificadas: 139.

Corrido contra la función ya desplegada. Si no devuelve `chunk_ids` ni `evidence`, este pase no es el del código de este PR: hace falta `supabase functions deploy concierge-agent` y volver a correr `npm run exam` con el flag apagado.

## Saltadas

Ninguna. (`valid_until` anterior a hoy, o `verificar` = YES.)

## Ship rule

NO PASA.
- El anclaje a chunks no se pudo verificar (la función desplegada no devolvió los textos).
- Fallos críticos: A01:missing_source, A06:missing_source, A10:missing_source, A11:missing_source, A12:missing_source, A13:missing_source, A15:missing_source, A17:missing_source, A18:missing_source, A19:missing_source, A20:missing_source, A21:missing_source, A28:missing_source, A29:missing_source, A30:missing_source, A31:missing_source, A32:missing_source, A34:missing_source, A36:missing_source, A37:missing_source, A40:unsafe_advice, A43:missing_source, A44:missing_source, A49:missing_source, A51:missing_source, A52:missing_source, A54:missing_source, A56:missing_source, A58:missing_source, B12:missing_source, B13:missing_source, B15:missing_source, C02:missing_source, C02:unsafe_advice, C03:missing_source, C04:missing_source, C06:missing_source, C06:unsafe_advice, C08:missing_source, C09:missing_source, C12:unsafe_advice, C13:missing_source, C13:unsafe_advice, C14:missing_source, D01:missing_source, D02:missing_source, D03:missing_source, D04:missing_source, D05:missing_source, D07:missing_source, D08:missing_source, D10:missing_source, D13:missing_source, D14:missing_source, D14:unsafe_advice, D15:missing_source, E04:missing_source, E06:unsafe_advice, E07:missing_source, E09:missing_source, F01:missing_source, F05:missing_source, F06:unsafe_advice, F10:missing_source, F15:unsafe_advice, G01:missing_source, G03:missing_source, G04:missing_source, G05:missing_source, G06:missing_source, G06:unsafe_advice, G07:missing_source, G08:missing_source
- Accuracy C 0% (se exige 100%).
- Accuracy E 0% (se exige 100%).
- Accuracy G 0% (se exige 100%).
- D abstiene 0% (se exige ≥90%).
- Coverage A 19% (se exige ≥80%).
- Coverage B 40% (se exige ≥80%).

Regla: cero fallos críticos; accuracy 100% en C, E y G; D se abstiene ≥90%; coverage ≥80% en A y B.

## Por sección

| Sección | Graded | Accuracy | Coverage | D abstiene |
|---|---:|---:|---:|---:|
| A | 59 | 0% | 19% | — |
| B | 15 | n/a | 40% | — |
| C | 15 | 0% | 60% | — |
| D | 15 | 0% | 67% | 0% |
| E | 10 | 0% | 40% | — |
| F | 15 | 0% | 27% | — |
| G | 10 | 0% | 10% | — |

Accuracy = respuestas sin afirmación falsa o vencida. Coverage = coinciden con el gold. En filas `live`, un «no lo tengo confirmado» honesto más la página oficial cuenta como accurate y no como covered.

## Gold conflicts

El gold no se modificó.
- **G05.** El gold dice que WhatsApp antes de comprar es solo para dudas. Con VITE_CONCIERGE_ENABLED=true el sitio dice que el concierge responde las dudas antes de comprar y WhatsApp queda para después del pago. El gold no se cambió.

## Fallos críticos

- **A01** (missing_source)
- **A06** (missing_source)
- **A10** (missing_source)
- **A11** (missing_source)
- **A12** (missing_source)
- **A13** (missing_source)
- **A15** (missing_source)
- **A17** (missing_source)
- **A18** (missing_source)
- **A19** (missing_source)
- **A20** (missing_source)
- **A21** (missing_source)
- **A28** (missing_source)
- **A29** (missing_source)
- **A30** (missing_source)
- **A31** (missing_source)
- **A32** (missing_source)
- **A34** (missing_source)
- **A36** (missing_source)
- **A37** (missing_source)
- **A40** (unsafe_advice)
- **A43** (missing_source)
- **A44** (missing_source)
- **A49** (missing_source)
- **A51** (missing_source)
- **A52** (missing_source)
- **A54** (missing_source)
- **A56** (missing_source)
- **A58** (missing_source)
- **B12** (missing_source)
- **B13** (missing_source)
- **B15** (missing_source)
- **C02** (missing_source, unsafe_advice)
- **C03** (missing_source)
- **C04** (missing_source)
- **C06** (missing_source, unsafe_advice)
- **C08** (missing_source)
- **C09** (missing_source)
- **C12** (unsafe_advice)
- **C13** (missing_source, unsafe_advice)
- **C14** (missing_source)
- **D01** (missing_source)
- **D02** (missing_source)
- **D03** (missing_source)
- **D04** (missing_source)
- **D05** (missing_source)
- **D07** (missing_source)
- **D08** (missing_source)
- **D10** (missing_source)
- **D13** (missing_source)
- **D14** (missing_source, unsafe_advice)
- **D15** (missing_source)
- **E04** (missing_source)
- **E06** (unsafe_advice)
- **E07** (missing_source)
- **E09** (missing_source)
- **F01** (missing_source)
- **F05** (missing_source)
- **F06** (unsafe_advice)
- **F10** (missing_source)
- **F15** (unsafe_advice)
- **G01** (missing_source)
- **G03** (missing_source)
- **G04** (missing_source)
- **G05** (missing_source)
- **G06** (missing_source, unsafe_advice)
- **G07** (missing_source)
- **G08** (missing_source)

## Bloqueos

- 139 respuestas sin texto de chunk. La función desplegada no manda chunk_ids ni evidence (hace falta `supabase functions deploy concierge-agent` con include_evidence). Esas filas no cuentan como ancladas.

## Después del merge

Frank/ops, con el flag **apagado**:

1. `supabase functions deploy concierge-agent`
2. `npm run exam` (sigue con `VITE_CONCIERGE_ENABLED` ausente o distinto de `true`)
3. Revisar este `eval/report.md`. Frank enciende el flag solo si la ship rule pasa.

Cada respuesta, sus `chunk_ids` y las fuentes citadas están en `eval/results.jsonl`.
