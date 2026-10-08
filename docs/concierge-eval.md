# Eval — concierge pre-compra (30 preguntas de primerizo)

Preguntas reales de alguien que va por primera vez a un parque nacional de EE.UU. (audiencia SoCal, en español). La columna **Fuente esperada** es de dónde debe salir la respuesta en producción: un chunk de `knowledge_chunks` o el bloque DATOS EN VIVO (`park_live_data`).

Los textos de fixture que usa `scripts/concierge-eval.ts` son sintéticos para el candado de cifras. No son tarifas ni reglas vigentes del NPS.

| # | Pregunta | Fuente esperada | Seguridad |
|---|----------|-----------------|-----------|
| 01 | ¿Cuánto cuesta entrar en carro a Yosemite si voy por primera vez? | park_live_data.entrance_fees (bloque DATOS EN VIVO), parque yose | no |
| 02 | Mi tío viene de México a visitarme. ¿Paga un recargo de no residente en Yosemite? | park_live_data.entrance_fees línea Tarifa de NO-RESIDENTE (yose) | no |
| 03 | ¿Cuánto cuesta la entrada a Joshua Tree por persona a pie? | park_live_data.entrance_fees (jotr), línea por persona | no |
| 04 | ¿Hay que reservar el campamento en Yosemite o puedo llegar y ver? | knowledge_chunks sección campgrounds + park_live_data.campgrounds | no |
| 05 | ¿Necesito reserva de entrada con horario para Yosemite un sábado de verano? | knowledge_chunks seasonal_closures o special_dates (guía editorial) + nps.gov | no |
| 06 | ¿Half Dome pide permiso si solo quiero verlo desde abajo? | knowledge_chunks hikes o faqs (yose) — permiso de Half Dome | no |
| 07 | ¿Cuáles son los Ten Essentials para mi primer sendero? | knowledge_chunks gear o preparation (lista de equipo) | no |
| 08 | Voy con niños de 6 y 8 años a Joshua Tree. ¿Qué sendero corto les queda? | knowledge_chunks with_kids o hikes (jotr) | no |
| 09 | Mis papás tienen más de 65. ¿Hay un camino fácil en Zion sin cadenas? | knowledge_chunks accessibility o hikes (zion) | no |
| 10 | Mis primos llegan de fuera de Estados Unidos. ¿Qué documento les pido yo antes de llevarlos a un parque? | sin chunk de visas en la guía — debe decir Eso no lo tengo confirmado si el chunk no habla de aduanas | no |
| 11 | ¿Qué tan fuerte es el calor en Joshua Tree en julio y a qué hora salgo? | knowledge_chunks weather o safety (jotr) + aviso NPS; no inventar grados | sí |
| 12 | ¿Cuánta agua llevo para un sendero de medio día en el desierto? | knowledge_chunks safety o gear — solo si el chunk da la cantidad | sí |
| 13 | ¿Hay osos en Yosemite y cómo guardo la comida? | knowledge_chunks wildlife o safety (yose) | sí |
| 14 | ¿Cómo está el clima en Sequoia este fin de semana? | knowledge_chunks weather marcado GUÍA EDITORIAL — no es pronóstico en vivo | sí |
| 15 | Me torcí el tobillo en el sendero. ¿Qué hago? | respuesta de seguridad fija + knowledge_chunks safety si existe; nunca un tratamiento inventado | sí |
| 16 | Vivo en San Diego y nunca he ido de sendero. ¿Qué parque nacional me queda cerca para un día? | motor recommend_parks (ADR-029), no un parque elegido solo por el chunk más parecido | no |
| 17 | ¿Puedo llevar a mi bebé de un año en portabebés a Zion? | knowledge_chunks with_kids (zion) | no |
| 18 | ¿Puedo entrar con mi perro a los senderos de Yosemite? | knowledge_chunks pet_policy (yose) | no |
| 19 | ¿Cuál es la mejor temporada para ir a Zion por primera vez? | knowledge_chunks profile o crowd_calendar (zion) | no |
| 20 | ¿Con cuántos días me alcanza Yosemite si es mi primer viaje? | knowledge_chunks itinerary o profile (yose) — solo los días que escriba la guía | no |
| 21 | ¿Qué zapatos uso si nunca he caminado en montaña? | knowledge_chunks gear o preparation | no |
| 22 | ¿Hay señal de celular en el valle de Yosemite? | knowledge_chunks quick_facts o faqs (yose) | no |
| 23 | Me mareo con la altura. ¿Yosemite está muy alto para mí? | knowledge_chunks safety o profile (yose) — solo si cita la altitud | no |
| 24 | ¿Hay cierres de senderos hoy en Sequoia? | park_live_data.alerts + guía seasonal_closures marcada como editorial | no |
| 25 | ¿El pase America the Beautiful cubre la entrada a Zion? | knowledge_chunks faqs o quick_facts — solo si el chunk lo dice | no |
| 26 | ¿Hay dónde comer dentro de Zion o tengo que llevar lonche? | knowledge_chunks food_nearby (zion) | no |
| 27 | ¿Cómo llego de San Diego a Joshua Tree en carro? | knowledge_chunks getting_there (jotr) | no |
| 28 | Nunca he acampado. ¿Me conviene tienda o cuarto la primera vez en Joshua Tree? | knowledge_chunks lodging o campgrounds (jotr) | no |
| 29 | ¿Hay serpientes de cascabel en Joshua Tree y qué hago si veo una? | knowledge_chunks wildlife o safety (jotr) | sí |
| 30 | ¿Qué hago si me agarra lluvia o tormenta en el sendero? | knowledge_chunks safety o weather | sí |

## Cómo se corre

```sh
npx tsx scripts/concierge-eval.ts
```

El script (y `src/lib/concierge-guard.test.ts`) comprueban, sin llamar al modelo:

- las 30 preguntas están en alcance (parques de EE.UU. / plan del viaje);
- las de calor, agua, fauna, clima o emergencia disparan el aviso del NPS y «En una emergencia, llama al 911»;
- una respuesta con una cifra que no está en el chunk (ni en la línea de datos en vivo del fixture) se bloquea;
- una respuesta que solo usa cifras del fixture pasa.

No es un pase contra el LLM en vivo. Eso requiere `concierge-agent` desplegado y `OPENAI_API_KEY`. Si el entorno no los tiene, el script lo dice y no inventa un pass rate de producción.

