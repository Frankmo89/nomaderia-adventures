-- Columna compacta para la fila de stats de /destinos/:slug (QuickFactsRow).
-- Motivo: `best_season` es un párrafo editorial largo (~40-60 palabras, pensado
-- para prosa) y se estaba renderizando dentro de una celda de stat angosta,
-- estirando toda la fila a 2 pantallas en mobile (QA de Frank). `season_short`
-- es una etiqueta corta ("Oct–Abr") derivada de `best_season` por extracción
-- de meses — NO reemplaza `best_season`, que sigue siendo el texto fuente para
-- la sección editorial "Cuándo ir".
ALTER TABLE public.destinations
  ADD COLUMN season_short TEXT;

COMMENT ON COLUMN public.destinations.season_short IS
  'Etiqueta corta de temporada para stat cells (ej. "Oct–Abr"), derivada por IA de best_season extrayendo meses — ver docs/pending-tasks.md changelog 2026-07-20 para la tabla de valores marcados ⚠️ VERIFICAR pendientes de revisión humana. best_season sigue siendo el texto editorial fuente (sección "Cuándo ir").';

-- Backfill para los 63 parques publicados — valores extraídos de best_season.
-- Idempotente: puede re-correrse sin efectos distintos (siempre asigna el
-- mismo valor determinístico por slug).
UPDATE public.destinations SET season_short = CASE slug
  WHEN 'acadia-national-park' THEN 'Sep–Oct'
  WHEN 'arches-national-park' THEN 'Mar–May, Sep–Oct'
  WHEN 'badlands-national-park' THEN 'May–Jun, Sep–Oct'
  WHEN 'big-bend-national-park' THEN 'Nov–Abr'
  WHEN 'biscayne-national-park' THEN 'Dic–May'
  WHEN 'black-canyon-of-the-gunnison-national-park' THEN 'May–Oct'
  WHEN 'bryce-canyon-national-park' THEN 'May–Sep'
  WHEN 'canyonlands-national-park' THEN 'Mar–May, Sep–Oct'
  WHEN 'capitol-reef-national-park' THEN 'Abr–May, Sep–Oct'
  WHEN 'carlsbad-caverns-national-park' THEN 'May–Oct'
  WHEN 'channel-islands-national-park' THEN 'Todo el año'
  WHEN 'congaree-national-park' THEN 'Oct–Abr'
  WHEN 'crater-lake-national-park' THEN 'Jun–Sep'
  WHEN 'cuyahoga-valley-national-park' THEN 'Mar–May, Oct'
  WHEN 'national-park-of-american-samoa' THEN 'Jun–Sep'
  WHEN 'death-valley-national-park' THEN 'Nov–Mar'
  WHEN 'grand-canyon-national-park' THEN 'Mar–May, Sep–Nov'
  WHEN 'dry-tortugas-national-park' THEN 'Dic–May'
  WHEN 'everglades-national-park' THEN 'Dic–Abr'
  WHEN 'gateway-arch-national-park' THEN 'Todo el año'
  WHEN 'glacier-national-park' THEN 'Jul–Sep'
  WHEN 'grand-teton-national-park' THEN 'Jun–Sep'
  WHEN 'great-basin-national-park' THEN 'Jun–Sep'
  WHEN 'great-smoky-mountains-national-park' THEN 'May–Jun, Oct'
  WHEN 'guadalupe-mountains-national-park' THEN 'Mar–Abr, Oct–Nov'
  WHEN 'haleakala-national-park' THEN 'Todo el año'
  WHEN 'hot-springs-national-park' THEN 'Mar–May, Oct–Nov'
  WHEN 'indiana-dunes-national-park' THEN 'Jun–Sep, Oct'
  WHEN 'virgin-islands-national-park' THEN 'Dic–Jun'
  WHEN 'isle-royale-national-park' THEN 'Jul–Ago'
  WHEN 'joshua-tree-national-park' THEN 'Oct–Abr'
  WHEN 'kenai-fjords-national-park' THEN 'Jun–Ago'
  WHEN 'kings-canyon-national-park' THEN 'Jun–Oct'
  WHEN 'kobuk-valley-national-park' THEN 'Jun–Jul, Ago–Sep'
  WHEN 'lassen-volcanic-national-park' THEN 'May–Jun, Sep'
  WHEN 'mammoth-cave-national-park' THEN 'Todo el año'
  WHEN 'mesa-verde-national-park' THEN 'May–Oct'
  WHEN 'rocky-mountain-national-park' THEN 'Jun–Sep'
  WHEN 'mount-rainier-national-park' THEN 'Jul–Sep'
  WHEN 'north-cascades-national-park' THEN 'Jul–Sep'
  WHEN 'olympic-national-park' THEN 'Jul–Sep'
  WHEN 'petrified-forest-national-park' THEN 'Mar–May, Sep–Oct'
  WHEN 'pinnacles-national-park' THEN 'Mar–May'
  WHEN 'redwood-national-park' THEN 'Jun–Sep'
  WHEN 'saguaro-national-park' THEN 'Nov–Abr'
  WHEN 'sequoia-kings-canyon-national-parks' THEN 'Jun–Oct'
  WHEN 'shenandoah-national-park' THEN 'Mar–May, Oct'
  WHEN 'theodore-roosevelt-national-park' THEN 'May–Jun, Sep–Oct'
  WHEN 'hawaii-volcanoes-national-park' THEN 'Todo el año'
  WHEN 'voyageurs-national-park' THEN 'Jun–Sep'
  WHEN 'white-sands-national-park' THEN 'Oct–Abr'
  WHEN 'wind-cave-national-park' THEN 'May–Jun, Sep–Oct'
  WHEN 'denali-national-park-preserve' THEN 'Jun–Sep'
  WHEN 'gates-of-the-arctic-national-park-preserve' THEN 'Jun–Ago'
  WHEN 'glacier-bay-national-park-preserve' THEN 'Jun–Ago'
  WHEN 'great-sand-dunes-national-park-preserve' THEN 'May–Jun, Sep'
  WHEN 'katmai-national-park-preserve' THEN 'Jul, Sep'
  WHEN 'lake-clark-national-park-preserve' THEN 'Jun–Sep'
  WHEN 'new-river-gorge-national-park-preserve' THEN 'Mar–May, Sep–Oct'
  WHEN 'wrangell-st-elias-national-park-preserve' THEN 'May–Sep'
  WHEN 'yellowstone-national-park' THEN 'May–Sep'
  WHEN 'yosemite-national-park' THEN 'Abr–Jun, Sep–Oct'
  WHEN 'zion-national-park' THEN 'Mar–May, Sep–Nov'
  ELSE season_short
END
WHERE slug IN (
  'acadia-national-park','arches-national-park','badlands-national-park','big-bend-national-park',
  'biscayne-national-park','black-canyon-of-the-gunnison-national-park','bryce-canyon-national-park',
  'canyonlands-national-park','capitol-reef-national-park','carlsbad-caverns-national-park',
  'channel-islands-national-park','congaree-national-park','crater-lake-national-park',
  'cuyahoga-valley-national-park','national-park-of-american-samoa','death-valley-national-park',
  'grand-canyon-national-park','dry-tortugas-national-park','everglades-national-park',
  'gateway-arch-national-park','glacier-national-park','grand-teton-national-park',
  'great-basin-national-park','great-smoky-mountains-national-park','guadalupe-mountains-national-park',
  'haleakala-national-park','hot-springs-national-park','indiana-dunes-national-park',
  'virgin-islands-national-park','isle-royale-national-park','joshua-tree-national-park',
  'kenai-fjords-national-park','kings-canyon-national-park','kobuk-valley-national-park',
  'lassen-volcanic-national-park','mammoth-cave-national-park','mesa-verde-national-park',
  'rocky-mountain-national-park','mount-rainier-national-park','north-cascades-national-park',
  'olympic-national-park','petrified-forest-national-park','pinnacles-national-park',
  'redwood-national-park','saguaro-national-park','sequoia-kings-canyon-national-parks',
  'shenandoah-national-park','theodore-roosevelt-national-park','hawaii-volcanoes-national-park',
  'voyageurs-national-park','white-sands-national-park','wind-cave-national-park',
  'denali-national-park-preserve','gates-of-the-arctic-national-park-preserve',
  'glacier-bay-national-park-preserve','great-sand-dunes-national-park-preserve',
  'katmai-national-park-preserve','lake-clark-national-park-preserve',
  'new-river-gorge-national-park-preserve','wrangell-st-elias-national-park-preserve',
  'yellowstone-national-park','yosemite-national-park','zion-national-park'
);
