// AUTO-GENERATED? No — this is the generator. Edit freely.
// Run: npm run build:soul

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const BANNER =
  '// AUTO-GENERATED from NOMADERIA_SOUL.md by scripts/build-soul.ts — DO NOT EDIT BY HAND.\n';

function die(msg: string): never {
  console.error(`[build-soul] ERROR: ${msg}`);
  process.exit(1);
}

function readFile(filePath: string): string {
  try {
    return readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  } catch (e: unknown) {
    return die(
      `Cannot read ${filePath}: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

// ─── Read source ───────────────────────────────────────────────────────────────
const soulMdPath = join(ROOT, 'docs', 'NOMADERIA_SOUL.md');
const raw = readFile(soulMdPath);

// ─── META ─────────────────────────────────────────────────────────────────────
const versionMatch = raw.match(/Versi[oó]n:\s*([\d.]+)/);
const updatedAtMatch = raw.match(/ltima actualizaci[oó]n:\s*(\d{4}-\d{2}-\d{2})/);
if (!versionMatch) die('Missing "Versión:" in META block of NOMADERIA_SOUL.md');
if (!updatedAtMatch) die('Missing "Última actualización:" in META block of NOMADERIA_SOUL.md');
const version = versionMatch[1];
const updatedAt = updatedAtMatch[1];

// ─── SOUL content ─────────────────────────────────────────────────────────────
// Use line-anchored regex so mentions in the META description don't match.
const SOUL_START_MARKER = '<!-- SOUL:START -->';
const SOUL_END_MARKER = '<!-- SOUL:END -->';
const startMatch = raw.match(/^<!-- SOUL:START -->$/m);
const endMatch = raw.match(/^<!-- SOUL:END -->$/m);
if (!startMatch || startMatch.index === undefined) die('Missing <!-- SOUL:START --> (standalone line) in NOMADERIA_SOUL.md');
if (!endMatch || endMatch.index === undefined) die('Missing <!-- SOUL:END --> (standalone line) in NOMADERIA_SOUL.md');
const startIdx = startMatch.index;
const endIdx = endMatch.index;
if (startIdx >= endIdx) die('<!-- SOUL:START --> must precede <!-- SOUL:END -->');

const soulContent = raw.slice(startIdx + SOUL_START_MARKER.length, endIdx).trim();

// ─── Build nomaderia-soul.ts ───────────────────────────────────────────────────
const escapedSoul = soulContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const soulTsContent = `${BANNER}\nexport const NOMADERIA_SOUL = \`${escapedSoul}\`;\n`;

// ─── Section extractor ────────────────────────────────────────────────────────
function extractSection(keyword: string): string {
  const lines = soulContent.split('\n');
  let collecting = false;
  const out: string[] = [];
  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (collecting) break;
      if (line.toLowerCase().includes(keyword.toLowerCase())) collecting = true;
      continue;
    }
    if (collecting) out.push(line);
  }
  if (!collecting) die(`Section containing "${keyword}" not found in SOUL content`);
  return out.join('\n').trim();
}

// ─── coreTruths ───────────────────────────────────────────────────────────────
const coreTruthsRaw = extractSection('Verdades centrales');
const coreTruths = coreTruthsRaw
  .split('\n')
  .filter((l) => /^\d+\./.test(l.trim()))
  .map((l) => l.replace(/^\d+\.\s*/, '').trim())
  .filter(Boolean);
if (coreTruths.length === 0) die('"Verdades centrales" section has no numbered items');

// ─── voice ────────────────────────────────────────────────────────────────────
const voiceRaw = extractSection('Cómo hablas');
const voice = voiceRaw
  .split('\n')
  .filter((l) => /^-\s/.test(l))
  .map((l) => l.replace(/^-\s*/, '').trim())
  .filter(Boolean);
if (voice.length === 0) die('"Cómo hablas" section has no bullet items');

// ─── petPeeves ────────────────────────────────────────────────────────────────
const neverRaw = extractSection('Nunca digas');
const neverLines = neverRaw.split('\n').filter((l) => l.trim().length > 0);

const neverDotLine = neverLines.find((l) => l.includes(' · '));
if (!neverDotLine) die('"Nunca digas" section has no "·" separated list');
const neverItems = neverDotLine
  .split(' · ')
  .map((s) => s.replace(/\.?\s*$/, '').trim())
  .filter(Boolean);

const avoidLine = neverLines.find((l) => l.trimStart().startsWith('Evita'));
if (!avoidLine) die('"Nunca digas" section has no "Evita" paragraph');
const avoid = avoidLine.trim();

// ─── examples ────────────────────────────────────────────────────────────────
const examplesRaw = extractSection('Ejemplos');
const exLines = examplesRaw.split('\n');

interface ParsedExample {
  question: string;
  bad: string;
  good: string;
}

const examples: ParsedExample[] = [];
let ei = 0;

while (ei < exLines.length) {
  const line = exLines[ei];
  if (!line.includes('**Pregunta:')) {
    ei++;
    continue;
  }

  const qMatch = line.match(/\*\*Pregunta:\s*"([^"]+)"/);
  const question = qMatch
    ? qMatch[1]
    : line.replace(/^\*\*Pregunta:\s*/, '').replace(/\*\*.*$/, '').replace(/^"|"$/g, '').trim();

  let bad = '';
  let good = '';
  let block: 'bad' | 'good' | null = null;
  let ej = ei + 1;

  while (ej < exLines.length && !exLines[ej].includes('**Pregunta:')) {
    const l = exLines[ej];
    if (l.includes('❌')) { block = 'bad'; ej++; continue; }
    if (l.includes('✅')) { block = 'good'; ej++; continue; }
    if (l.startsWith('>') && block !== null) {
      const content = l.replace(/^>\s?/, '');
      if (block === 'bad') bad += (bad ? '\n' : '') + content;
      else good += (good ? '\n' : '') + content;
    }
    ej++;
  }

  examples.push({ question, bad: bad.trim(), good: good.trim() });
  ei = ej;
}

if (examples.length === 0) die('"Ejemplos" section has no parseable examples');

// ─── Build soul.generated.ts ──────────────────────────────────────────────────
function q(s: string): string {
  return JSON.stringify(s);
}

function strArray(arr: string[], pad = '    '): string {
  return '[\n' + arr.map((s) => `${pad}${q(s)},`).join('\n') + '\n  ]';
}

const soulDataContent = `${BANNER}
export interface NomaderiaSoulData {
  version: string;
  updatedAt: string;
  coreTruths: string[];
  voice: string[];
  petPeeves: { never: string[]; avoid: string };
  examples: { question: string; bad: string; good: string }[];
}

export const NOMADERIA_SOUL_DATA: NomaderiaSoulData = {
  version: ${q(version)},
  updatedAt: ${q(updatedAt)},
  coreTruths: ${strArray(coreTruths)},
  voice: ${strArray(voice)},
  petPeeves: {
    never: ${strArray(neverItems)},
    avoid: ${q(avoid)},
  },
  examples: [
${examples.map((e) => `    { question: ${q(e.question)}, bad: ${q(e.bad)}, good: ${q(e.good)} },`).join('\n')}
  ],
};
`;

// ─── Write output ─────────────────────────────────────────────────────────────
const soulTsPath = join(ROOT, 'supabase', 'functions', '_shared', 'nomaderia-soul.ts');
const soulDataPath = join(ROOT, 'src', 'data', 'soul.generated.ts');

mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });

writeFileSync(soulTsPath, soulTsContent, 'utf-8');
console.log('[build-soul] Written: supabase/functions/_shared/nomaderia-soul.ts');

writeFileSync(soulDataPath, soulDataContent, 'utf-8');
console.log('[build-soul] Written: src/data/soul.generated.ts');

console.log(
  `[build-soul] Done — version=${version} updatedAt=${updatedAt} ` +
  `coreTruths=${coreTruths.length} voice=${voice.length} examples=${examples.length}`,
);
