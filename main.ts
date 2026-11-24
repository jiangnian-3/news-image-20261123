import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { geoPath, geoNaturalEarth1 } from './vendor/node_modules/d3-geo/src/index.js';
import { feature } from './vendor/node_modules/topojson-client/src/index.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 1024;
const PALETTE = {
  paper: '#f2ecdf', card: '#fbf8f1', ink: '#202a2e', navy: '#173746', blue: '#315c70',
  rust: '#a74434', red: '#a53e32', green: '#516b58', gold: '#9a7133', slate: '#536a77',
  violet: '#695b7e', sea: '#e5ece8', land: '#d0c7b7', line: '#b7b0a4', muted: '#667176',
  white: '#fffdf7', pale: '#e9e1d3', dark: '#142d38',
};

export const REGION_COUNTS = [
  ['GLOBAL', 1], ['EUROPE', 10], ['MIDDLE EAST', 2], ['ASIA', 6],
  ['AFRICA', 5], ['AMERICAS', 8], ['OCEANIA', 4],
];
const REGION_COLOR = {
  GLOBAL: PALETTE.slate, EUROPE: PALETTE.blue, 'MIDDLE EAST': PALETTE.gold,
  ASIA: PALETTE.rust, AFRICA: PALETTE.green, AMERICAS: PALETTE.navy, OCEANIA: PALETTE.violet,
};

export const STORIES = [
  { id: 1, kind: 'hero', region: 'AMERICAS', title: 'NVIDIA RESTORES HUANG AS CEO', summary: 'The board reinstated Jensen Huang as president and CEO and says its inquiry continues. The NYT reported NVDA closed Monday up 31.5%.', source: 'NVIDIA BOARD · NYT', status: 'REPORTED · BOARD ACTION', icon: 'chip', lon: -98, lat: 39, brief: 'Board restores Huang; inquiry continues; NVDA closed +31.5% (NYT).' },
  { id: 2, kind: 'hero', region: 'EUROPE', title: 'UK RECOGNIZES ROHINGYA GENOCIDE', summary: 'The UK government announced formal recognition and sanctions on five senior Myanmar military figures. This is a policy decision, not a new court ruling.', source: 'UK FOREIGN OFFICE', status: 'REPORTED · GOVERNMENT POLICY', icon: 'parliament', lon: -0.1, lat: 51.5, brief: 'UK policy announcement; five Myanmar military figures sanctioned.' },
  { id: 3, kind: 'hero', region: 'EUROPE', title: 'SECURITY COUNCIL TAKES UP UKRAINE', summary: 'The 23 November briefing addressed winter energy infrastructure and Black Sea shipping risks. EU allegations remain the EU position, not a UN finding.', source: 'UN NEWS · EU STATEMENT', status: 'REPORTED · UN BRIEFING', icon: 'un', lon: -73.97, lat: 40.75, brief: 'Briefing covers winter energy and Black Sea shipping risks.' },
  { id: 4, kind: 'card', region: 'EUROPE', title: 'BELGIUM STRIKE HITS AIR TRAVEL', summary: 'Monday\'s nationwide strike disrupted air traffic; not a permanent closure.', source: 'AL JAZEERA', status: 'REPORTED · 23 NOV', icon: 'airplane', lon: 4.35, lat: 50.85, brief: 'Nationwide action disrupted air traffic, 07:00-21:00 local.' },
  { id: 5, kind: 'card', region: 'ASIA', title: 'INDIA PLEDGES NEPAL AID', summary: 'Development package; about US$1.62bn. Not all is flood relief.', source: 'THE HINDU · AJ', status: 'REPORTED · DEVELOPMENT PACKAGE', icon: 'aid', lon: 77.2, lat: 28.6, brief: 'Development package; about US$1.62bn, not all flood relief.' },
  { id: 6, kind: 'card', region: 'AMERICAS', title: 'DRONE BLAST HITS CUCUTA', summary: 'Police site hit; homes damaged and civilians injured. Toll disputed.', source: 'NYT · AL JAZEERA', status: 'REPORTED · ATTRIBUTED REPORTS', icon: 'drone', lon: -72.5, lat: 7.9, brief: 'Police facility hit; nearby homes damaged, civilians hurt.' },
  { id: 7, kind: 'card', region: 'AMERICAS', title: 'U.S. DRONE OVER MEXICO', summary: 'Officials disclosed approved flights before weekend capture; president says no U.S. ground troops.', source: 'AP · WTOP', status: 'OFFICIAL DISCLOSURE · WEEKEND CAPTURE', icon: 'flight', lon: -107.4, lat: 25.8, brief: 'Officials disclose approved flights; capture was on the weekend.' },
  { id: 8, kind: 'card', region: 'MIDDLE EAST', title: 'U.S. SANCTIONS IRAN NETWORK', summary: 'Treasury: 22 entities and eight people linked to Iran network. U.S. claim.', source: 'U.S. TREASURY', status: 'CLAIM · U.S. TREASURY', icon: 'bank', lon: -77, lat: 38.9, brief: 'Treasury sanctions 22 entities, eight people; U.S. allegation.' },
  { id: 9, kind: 'card', region: 'EUROPE', title: 'UKRAINE OFFERS FOUR-WAY TALKS', summary: 'Ukraine says ready if agenda coordinated; no meeting set.', source: 'RBC-UKRAINE', status: 'UKRAINE SAYS · TALKS NOT SET', icon: 'talk', lon: 13.4, lat: 52.5, brief: 'Zelenskyy says ready; an agenda and meeting remain unsettled.' },
  { id: 10, kind: 'card', region: 'AFRICA', title: 'EBOLA RESPONSE DISRUPTED IN ITURI', summary: 'WHO: nearby fighting disrupts response; workers sheltered 24+ hours.', source: 'UN NEWS · WHO', status: 'WHO REPORT · RESPONSE ONGOING', icon: 'medical', lon: 30.2, lat: 1.6, brief: 'WHO: nearby fighting disrupted response; workers sheltered 24+ hours.' },
  { id: 11, kind: 'card', region: 'AFRICA', title: 'JOHANNESBURG VOTE DELAYED', summary: 'Council sworn; mayor vote postponed to Friday.', source: 'eNCA', status: 'REPORTED · VOTE DEFERRED', icon: 'council', lon: 28, lat: -26.2, brief: 'Council sworn in; mayoral vote postponed to Friday.' },
  { id: 12, kind: 'card', region: 'ASIA', title: 'JAPAN SNOW STRANDS 1,500', summary: 'About 1,500 were briefly stranded; transport recovered Monday.', source: 'NEWS ON JAPAN', status: 'REPORTED · MONDAY UPDATE', icon: 'snow', lon: 138, lat: 37, brief: 'About 1,500 temporarily stranded; transport gradually recovered.' },
  { id: 13, kind: 'card', region: 'OCEANIA', title: 'FIJI BULLETIN: TD02F', summary: '10:21Z: TD02F 30 kt near 12.5S, 167.5W; westbound, not over Fiji.', source: 'FIJI MET · RSMC NADI', status: '10:21Z BULLETIN · NOT OVER FIJI', icon: 'storm', lon: -167.5, lat: -12.5, brief: '10:21Z bulletin: 30 kt, westward; not striking Fiji.' },
  { id: 14, kind: 'brief', region: 'GLOBAL', title: 'UN CHIEF URGES AI OVERSIGHT', summary: 'At a Barbados meeting, Guterres urged local testing capacity · UN News.', source: 'UN NEWS', status: 'REPORTED · SPEECH', icon: 'globe', lon: -59.5, lat: 13.1, brief: 'At Barbados meeting, Guterres urged AI testing · UN News.' },
  { id: 15, kind: 'brief', region: 'EUROPE', title: 'EU PROPOSES RUSSIA SANCTIONS', summary: 'The 22nd package is proposed; member-state approval is pending · Euronews.', source: 'EURONEWS', status: 'PROPOSED · NOT APPROVED', icon: 'document', lon: 4.35, lat: 50.85, brief: '22nd package proposed; approval pending · Euronews.' },
  { id: 16, kind: 'brief', region: 'EUROPE', title: 'ARMENIA PUBLISHES DRAFT', summary: 'A new constitution draft was unveiled; it is not law and a referendum is unset · ARKA.', source: 'ARKA · REUTERS', status: 'DRAFT · NOT LAW', icon: 'document', lon: 44.5, lat: 40.2, brief: 'Draft unveiled; not law, referendum date unset · ARKA.' },
  { id: 17, kind: 'brief', region: 'EUROPE', title: 'KYIV-REGION TOLL UPDATED', summary: 'At least 15 dead, Ukraine said; the air strike was 22 Nov · Euronews.', source: 'EURONEWS', status: 'CLAIM · UKRAINE SAYS · 22 NOV STRIKE', icon: 'shield', lon: 30.3, lat: 50.8, brief: 'Ukraine says at least 15 dead; strike was 22 Nov · Euronews.' },
  { id: 18, kind: 'brief', region: 'EUROPE', title: 'UN MISSION SEEKS LIBYA PROBE', summary: 'Ukraine claimed the 22 Nov attack; the UN mission urged an inquiry · UN/Euronews.', source: 'UNSMIL · EURONEWS', status: 'CLAIM + INQUIRY · 22 NOV ATTACK', icon: 'investigate', lon: 20, lat: 32.1, brief: 'Ukraine claims; UN urges probe; attack was 22 Nov · UN/Euronews.' },
  { id: 19, kind: 'brief', region: 'EUROPE', title: 'TAJIKISTAN OPENS ICC EXIT', summary: 'Dushanbe notified the UN; withdrawal is a process, not an immediate exit · Al Jazeera.', source: 'AL JAZEERA', status: 'ONGOING · WITHDRAWAL PROCESS', icon: 'document', lon: 68.8, lat: 38.6, brief: 'UN notified; withdrawal process begins · Al Jazeera.' },
  { id: 20, kind: 'brief', region: 'EUROPE', title: 'UK GETS 2035 WOMEN\'S CUP', summary: 'FIFA awarded hosting to four UK associations; cities and venues are unchosen · FA.', source: 'ENGLAND FOOTBALL', status: 'REPORTED · CITIES UNSET', icon: 'cup', lon: 0, lat: 52, brief: 'Host rights awarded; cities and grounds unchosen · FA.' },
  { id: 21, kind: 'brief', region: 'MIDDLE EAST', title: 'U.S.-QATAR TALKS BEGIN', summary: 'Rubio and Qatar\'s prime minister opened round eight of strategic dialogue · Alhurra.', source: 'ALHURRA', status: 'REPORTED · MEETING', icon: 'talk', lon: -77, lat: 38.9, brief: 'Rubio and Qatar PM opened round eight · Alhurra.' },
  { id: 22, kind: 'brief', region: 'ASIA', title: 'SHURI CASTLE OPENS INTERIOR', summary: 'The main hall opened to visitors 23 Nov, first time since the 2019 fire · Kyodo.', source: 'KYODO · NEWS ON JAPAN', status: 'REPORTED · PUBLIC OPENING', icon: 'gate', lon: 127.7, lat: 26.2, brief: 'Main hall opened to public after 2019 fire · Kyodo.' },
  { id: 23, kind: 'brief', region: 'ASIA', title: 'WORKER DIES AT NUCLEAR SITE', summary: 'A worker was killed by falling glass; police investigate. No reactor accident · News Japan.', source: 'NEWS ON JAPAN', status: 'POLICE INVESTIGATION · NOT REACTOR', icon: 'warning', lon: 138.5, lat: 37.4, brief: 'Worker killed by falling glass; police investigate · News Japan.' },
  { id: 24, kind: 'brief', region: 'ASIA', title: 'SEOUL SHARES EXTEND SLIDE', summary: 'AI-return concerns weighed on Monday\'s Asian trading; not a global close · Reuters.', source: 'REUTERS · ST', status: 'ASIA SESSION · NOT GLOBAL CLOSE', icon: 'chart', lon: 127, lat: 37.5, brief: 'AI-return worries weigh in Asia session · Reuters.' },
  { id: 25, kind: 'brief', region: 'ASIA', title: 'RAYSSA LEAL WINS IN JAPAN', summary: 'The Brazilian skateboarder took the Utsunomiya World Skate gold, scoring 176.03 · Folhapress.', source: 'FOLHAPRESS', status: 'REPORTED · WORLD SKATE', icon: 'skate', lon: 139.9, lat: 36.6, brief: 'Leal wins Utsunomiya street-skate gold · Folhapress.' },
  { id: 26, kind: 'brief', region: 'AFRICA', title: 'ZANZIBAR EVACUATION UPDATE', summary: 'Fire was 21 Nov; AP on Monday reported about 180 tourists evacuated safely.', source: 'AP · WRAL', status: 'AP UPDATE · FIRE 21 NOV', icon: 'evacuate', lon: 39.3, lat: -5.7, brief: 'Fire 21 Nov; AP reports ~180 safely evacuated · AP.' },
  { id: 27, kind: 'brief', region: 'AFRICA', title: 'ZAMBIA OPPOSITION LEADER CHARGED', summary: 'Mundubile faces an overthrow charge; the case moved to High Court, not a conviction · Reuters.', source: 'REUTERS', status: 'CHARGED · NOT CONVICTED', icon: 'court', lon: 28.3, lat: -15.4, brief: 'Overthrow charge; not conviction · Reuters.' },
  { id: 28, kind: 'brief', region: 'AFRICA', title: 'SA-ZAMBIA CUSTOMS PACT', summary: 'Agencies agreed to exchange customs data before the border; checks are not abolished · SAnews.', source: 'SANEWS', status: 'REPORTED · AGREEMENT', icon: 'bridge', lon: 28.2, lat: -25.7, toLon: 28.3, toLat: -15.4, brief: 'Pre-border customs data pact signed · SAnews.' },
  { id: 29, kind: 'brief', region: 'AMERICAS', title: 'MEXICO OFFICIALS REPORT 20 DEAD', summary: 'Officials report weekend deaths after the capture; 16 were suspected gang members · AP.', source: 'AP · WTOP', status: 'OFFICIALS SAY · WEEKEND TOLL', icon: 'report', lon: -108.5, lat: 25.6, brief: 'Officials: 20 weekend deaths; 16 alleged gang · AP.' },
  { id: 30, kind: 'brief', region: 'AMERICAS', title: 'DEMOCRATS AT LEAST 259 SEATS', summary: 'Projection after Hubbard beat Foxx; three House races remained uncalled · Democracy Now.', source: 'DEMOCRACY NOW', status: 'PROJECTED · THREE RACES OPEN', icon: 'ballot', lon: -79.5, lat: 35.7, brief: 'At least 259 projected; three races uncalled · DN.' },
  { id: 31, kind: 'brief', region: 'AMERICAS', title: 'BRAZIL HOUSE VOTE 353-128', summary: 'Main fiscal text passed; further votes were pending, not a signed law · Rio Times.', source: 'RIO TIMES · CHAMBER', status: 'MAIN TEXT · FOLLOW-UP VOTES', icon: 'parliament', lon: -47.9, lat: -15.8, brief: 'Main text passed; more votes pending · Rio Times.' },
  { id: 32, kind: 'brief', region: 'AMERICAS', title: 'INTERNATIONAL EMMYS IN NYC', summary: 'The 54th awards took place; no winner names are inferred from the nominees · Academy.', source: 'INTL. TV ACADEMY', status: 'REPORTED · AWARDS', icon: 'trophy', lon: -74, lat: 40.7, brief: '54th awards held; no winners inferred · Academy.' },
  { id: 33, kind: 'brief', region: 'AMERICAS', title: 'IOWA DISPOSAL PLAN DISPUTED', summary: 'Army plan for 25 Nov is contested by environmental groups; legal positions differ · DN.', source: 'DEMOCRACY NOW', status: 'PLAN DISPUTED · 25 NOV', icon: 'warning', lon: -91.5, lat: 41, brief: 'Army plan for Wed disputed; claims differ · DN.' },
  { id: 34, kind: 'brief', region: 'OCEANIA', title: 'NEW ZEALAND RETAIL +2.2%', summary: 'Third-quarter sales volume rose 2.2% quarter-on-quarter, not in one day · Stats NZ/Xinhua.', source: 'STATS NZ · XINHUA', status: 'Q3 VOLUME · QUARTER-ON-QUARTER', icon: 'chart', lon: 174.8, lat: -41.3, brief: 'Q3 retail volume +2.2% QoQ · Stats NZ/Xinhua.' },
  { id: 35, kind: 'brief', region: 'OCEANIA', title: 'WELLINGTON TEST ENDS DRAWN', summary: 'India declared 720/9 on 22 Nov; the match ended drawn Monday at 239/5 · LiveMint.', source: 'LIVEMINT', status: 'FINAL DAY · DRAW · 720/9 WAS 22 NOV', icon: 'cricket', lon: 174.8, lat: -41.3, brief: 'Draw; India\'s 720/9 declaration was 22 Nov · LiveMint.' },
  { id: 36, kind: 'brief', region: 'OCEANIA', title: 'AUSTRALIA FLASH PMI EASES', summary: 'November flash survey showed slower business activity and new orders; not a recession call · ABC.', source: 'ABC NEWS', status: 'FLASH SURVEY · NOT A RECESSION CALL', icon: 'chart', lon: 134, lat: -25, brief: 'Survey signals slower activity and orders · ABC.' },
];

export const NUMBERS = [
  { value: 'AT LEAST 259', label: 'SEATS', note: '3 RACES UNCALLED · PROJECTED', storyId: 30 },
  { value: '~$1.62bn', label: 'DEVELOPMENT AID', note: 'ABOUT · PACKAGE, NOT ALL FLOOD RELIEF', storyId: 5 },
  { value: '353-128', label: 'VOTES', note: 'MAIN TEXT · FURTHER VOTES PENDING', storyId: 31 },
  { value: '~180', label: 'EVACUATED', note: 'AP UPDATE · FIRE WAS 21 NOV', storyId: 26 },
  { value: '+2.2%', label: 'Q3 RETAIL VOLUME', note: 'QUARTER-ON-QUARTER · NOT DAILY', storyId: 34 },
  { value: '30 kt', label: 'TD02F WIND', note: '10:21Z BULLETIN · NOT LANDFALL', storyId: 13 },
];
export const UTC_LINE = [
  { time: '06:13Z', storyId: 17, label: 'KYIV TOLL UPDATE' },
  { time: '09:54Z', storyId: 5, label: 'INDIA-NEPAL PACKAGE' },
  { time: '12:41:45Z', storyId: 34, label: 'NZ RETAIL DATA' },
  { time: '18:47Z', storyId: 7, label: 'MEXICO FLIGHT DISCLOSURE' },
  { time: '21:04Z', storyId: 1, label: 'NVIDIA CLOSE UPDATE' },
  { time: '22:48Z', storyId: 26, label: 'ZANZIBAR EVACUATION' },
];
export const DATE_CHECK = [
  { event: 'COP31 NO-CONSENSUS CLOSE', date: '22 NOV' },
  { event: 'HOUTHI RABIGH CLAIM', date: '22 NOV' },
  { event: 'EU-INDONESIA CEPA SIGNING', date: '21 NOV' },
  { event: 'CIKANDE FIRE / LATER TOLL', date: '21 / 22 NOV' },
  { event: 'HONG KONG ELECTION VOTE', date: '22 NOV' },
  { event: 'INDIA 720/9 DECLARATION', date: '22 NOV' },
  { event: 'VERSTAPPEN VEGAS WIN (LOCAL)', date: '22 NOV' },
  { event: 'AIR INDIA SAUDI SUSPENSION', date: '18 NOV' },
];

const require = createRequire(import.meta.url);
const { initWasm, Resvg } = require('./vendor/resvg/index.js');
const FONT_FILES = {
  serif: join(ROOT, 'assets/fonts/source-serif-4/source-serif-4-bold.ttf'),
  sans: join(ROOT, 'assets/fonts/source-sans-3/source-sans-3-regular.ttf'),
  semibold: join(ROOT, 'assets/fonts/source-sans-3/source-sans-3-semibold.ttf'),
  bold: join(ROOT, 'assets/fonts/source-sans-3/source-sans-3-bold.ttf'),
};

function readTtfMetrics(buffer) {
  const tableCount = buffer.readUInt16BE(4);
  const tables = new Map();
  for (let i = 0; i < tableCount; i++) {
    const at = 12 + i * 16;
    tables.set(buffer.toString('ascii', at, at + 4), {
      offset: buffer.readUInt32BE(at + 8), length: buffer.readUInt32BE(at + 12),
    });
  }
  const head = tables.get('head');
  const hhea = tables.get('hhea');
  const maxp = tables.get('maxp');
  const hmtx = tables.get('hmtx');
  const cmap = tables.get('cmap');
  if (!head || !hhea || !maxp || !hmtx || !cmap) throw new Error('Incomplete local TrueType font');
  const units = buffer.readUInt16BE(head.offset + 18);
  const glyphCount = buffer.readUInt16BE(maxp.offset + 4);
  const metricCount = buffer.readUInt16BE(hhea.offset + 34);
  const advances = new Uint16Array(glyphCount);
  let lastAdvance = 0;
  for (let i = 0; i < metricCount; i++) {
    lastAdvance = buffer.readUInt16BE(hmtx.offset + i * 4);
    advances[i] = lastAdvance;
  }
  for (let i = metricCount; i < glyphCount; i++) advances[i] = lastAdvance;

  const encodingCount = buffer.readUInt16BE(cmap.offset + 2);
  let subtable = -1;
  for (let i = 0; i < encodingCount; i++) {
    const at = cmap.offset + 4 + i * 8;
    const platform = buffer.readUInt16BE(at);
    const encoding = buffer.readUInt16BE(at + 2);
    const candidate = cmap.offset + buffer.readUInt32BE(at + 4);
    if (buffer.readUInt16BE(candidate) === 4 && (platform === 3 || (platform === 0 && encoding === 3))) {
      subtable = candidate;
      if (platform === 3 && encoding === 1) break;
    }
  }
  if (subtable < 0) throw new Error('Local font has no Unicode BMP cmap');
  const segCount = buffer.readUInt16BE(subtable + 6) / 2;
  const endStart = subtable + 14;
  const startStart = endStart + segCount * 2 + 2;
  const deltaStart = startStart + segCount * 2;
  const rangeStart = deltaStart + segCount * 2;
  const cmapMap = new Map();
  for (let i = 0; i < segCount; i++) {
    const start = buffer.readUInt16BE(startStart + i * 2);
    const end = buffer.readUInt16BE(endStart + i * 2);
    const delta = buffer.readInt16BE(deltaStart + i * 2);
    const range = buffer.readUInt16BE(rangeStart + i * 2);
    if (start === 0xffff || end > 0xfffe) continue;
    for (let code = start; code <= end; code++) {
      let glyph;
      if (range === 0) glyph = (code + delta + 65536) & 0xffff;
      else {
        const glyphAddress = rangeStart + i * 2 + range + 2 * (code - start);
        glyph = buffer.readUInt16BE(glyphAddress);
        if (glyph !== 0) glyph = (glyph + delta + 65536) & 0xffff;
      }
      if (glyph < glyphCount) cmapMap.set(code, glyph);
    }
  }
  return {
    width(text, size) {
      let unitsWide = 0;
      for (const char of text) {
        const code = char.codePointAt(0);
        const glyph = cmapMap.get(code) ?? cmapMap.get(63) ?? 0;
        unitsWide += advances[glyph];
      }
      return unitsWide * size / units;
    },
  };
}

const FONT_BYTES = Object.fromEntries(Object.entries(FONT_FILES).map(([key, path]) => [key, readFileSync(path)]));
const METRICS = Object.fromEntries(Object.entries(FONT_BYTES).map(([key, bytes]) => [key, readTtfMetrics(bytes)]));
const FONT_FAMILY = { serif: 'Source Serif 4', sans: 'Source Sans 3', semibold: 'Source Sans 3', bold: 'Source Sans 3' };
const FONT_WEIGHT = { serif: 700, sans: 400, semibold: 600, bold: 700 };

function esc(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}
function fmt(value) { return Number(value.toFixed(2)); }
function textWidth(text, face, size) { return METRICS[face].width(text, size); }
function wrapText(text, face, size, maxWidth, maxLines) {
  const lines = [];
  let line = '';
  for (const word of text.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, face, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    if (textWidth(word, face, size) <= maxWidth) {
      line = word;
      continue;
    }
    let fragment = '';
    for (const char of word) {
      if (fragment && textWidth(fragment + char, face, size) > maxWidth) {
        lines.push(fragment);
        fragment = char;
      } else fragment += char;
    }
    line = fragment;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) throw new Error(`Text needs ${lines.length} lines (limit ${maxLines}): ${text}`);
  for (const value of lines) {
    const width = textWidth(value, face, size);
    if (width > maxWidth + 0.01) throw new Error(`Measured text overflow ${fmt(width)} > ${fmt(maxWidth)}: ${value}`);
  }
  return lines;
}

function buildSvg() {
  const svg = [];
  const audit = [];
  const add = (s) => svg.push(s);
  const rect = (x, y, w, h, fill, rx = 0, stroke = 'none', sw = 0) =>
    add(`<rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(w)}" height="${fmt(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  const rule = (x1, y1, x2, y2, color, width = 1, dash = '') =>
    add(`<path d="M${fmt(x1)},${fmt(y1)}L${fmt(x2)},${fmt(y2)}" fill="none" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  const circle = (cx, cy, r, fill, stroke = 'none', sw = 0) =>
    add(`<circle cx="${fmt(cx)}" cy="${fmt(cy)}" r="${fmt(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  const text = (value, x, baseline, size, face = 'sans', color = PALETTE.ink, maxWidth = 960, anchor = 'start', extra = '') => {
    const width = textWidth(value, face, size);
    if (anchor === 'middle' && width / 2 > maxWidth + 0.01) throw new Error(`Centered label overflow: ${value}`);
    if (anchor === 'end' && width > maxWidth + 0.01) throw new Error(`Right label overflow: ${value}`);
    if (anchor === 'start' && width > maxWidth + 0.01) throw new Error(`Text overflow ${fmt(width)} > ${fmt(maxWidth)}: ${value}`);
    audit.push({ text: value, face, size, measuredWidth: fmt(width), maxWidth: fmt(maxWidth) });
    add(`<text x="${fmt(x)}" y="${fmt(baseline)}" text-anchor="${anchor}" font-family="${FONT_FAMILY[face]}" font-size="${size}px" font-weight="${FONT_WEIGHT[face]}" fill="${color}"${extra ? ` ${extra}` : ''}>${esc(value)}</text>`);
  };
  const block = (value, x, baseline, size, face, color, maxWidth, maxLines, leading = size * 1.2) => {
    const lines = wrapText(value, face, size, maxWidth, maxLines);
    lines.forEach((line, i) => text(line, x, baseline + i * leading, size, face, color, maxWidth));
    return lines.length;
  };

  function icon(type, x, y, size, color) {
    const s = size / 40;
    const X = (v) => fmt(x + v * s);
    const Y = (v) => fmt(y + v * s);
    const p = (d, sw = 2.2, fill = 'none', dash = '') => add(`<path d="${d.replace(/([0-9.]+),([0-9.]+)/g, (_, a, b) => `${X(Number(a))},${Y(Number(b))}`)}" fill="${fill}" stroke="${color}" stroke-width="${fmt(sw * s)}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
    const c = (cx, cy, r, fill = 'none', sw = 2) => add(`<circle cx="${X(cx)}" cy="${Y(cy)}" r="${fmt(r * s)}" fill="${fill}" stroke="${color}" stroke-width="${fmt(sw * s)}"/>`);
    const r = (rx, ry, rw, rh, rad = 2, fill = 'none', sw = 2) => add(`<rect x="${X(rx)}" y="${Y(ry)}" width="${fmt(rw * s)}" height="${fmt(rh * s)}" rx="${fmt(rad * s)}" fill="${fill}" stroke="${color}" stroke-width="${fmt(sw * s)}"/>`);
    const l = (x1, y1, x2, y2, sw = 2) => add(`<path d="M${X(x1)},${Y(y1)}L${X(x2)},${Y(y2)}" fill="none" stroke="${color}" stroke-width="${fmt(sw * s)}" stroke-linecap="round"/>`);
    switch (type) {
      case 'chip':
        r(9, 9, 22, 22, 3); r(14, 14, 12, 12, 2, PALETTE.pale, 1.4);
        for (let i = 0; i < 4; i++) { l(13 + i * 5, 4, 13 + i * 5, 9); l(13 + i * 5, 31, 13 + i * 5, 36); l(4, 13 + i * 5, 9, 13 + i * 5); l(31, 13 + i * 5, 36, 13 + i * 5); }
        break;
      case 'parliament':
        p('4,14 20,5 36,14'); l(7, 15, 33, 15); [11, 17, 23, 29].forEach((a) => { l(a, 17, a, 31); l(a - 2, 31, a + 2, 31); }); l(5, 34, 35, 34); l(8, 37, 32, 37);
        break;
      case 'un':
      case 'globe':
        c(20, 20, 15); c(20, 20, 8); l(5, 20, 35, 20); p('20,5 15,11 13,20 15,29 20,35'); p('20,5 25,11 27,20 25,29 20,35');
        if (type === 'un') { l(3, 37, 37, 37, 1.5); l(7, 34, 7, 37, 1.5); l(33, 34, 33, 37, 1.5); }
        break;
      case 'airplane':
      case 'flight':
        p('3,22 17,19 21,5 25,5 25,18 37,14 39,17 25,24 25,34 20,37 17,26 4,26 2,24');
        if (type === 'flight') { c(5, 7, 2, color, 0); c(34, 34, 2, color, 0); }
        break;
      case 'aid':
        r(5, 10, 30, 23, 3); p('5,16 20,24 35,16'); l(20, 20, 20, 32, 1.3); c(20, 27, 3, PALETTE.paper, 1.6);
        break;
      case 'drone':
        c(20, 20, 4, PALETTE.pale); l(17, 17, 8, 9); l(23, 17, 32, 9); l(17, 23, 8, 31); l(23, 23, 32, 31); c(7, 7, 4); c(33, 7, 4); c(7, 33, 4); c(33, 33, 4);
        break;
      case 'bank':
        p('4,14 20,5 36,14'); l(5, 15, 35, 15); [10, 17, 23, 30].forEach((a) => l(a, 17, a, 31)); l(5, 33, 35, 33); r(25, 22, 10, 9, 2, PALETTE.pale, 1.7); p('27,22 27,19 33,19 33,22', 1.6);
        break;
      case 'talk':
        r(4, 7, 23, 17, 4); p('10,24 8,31 16,24', 2); r(18, 19, 18, 14, 4, PALETTE.pale); p('29,33 33,37 32,32', 1.7); [10, 16, 22].forEach((a) => c(a, 15, 1.2, color, 0));
        break;
      case 'medical':
        c(20, 20, 15); r(17, 8, 6, 24, 1, color, 0); r(8, 17, 24, 6, 1, color, 0);
        break;
      case 'council':
        r(6, 7, 28, 27, 2); p('3,14 20,5 37,14'); l(9, 15, 31, 15); [13, 20, 27].forEach((a) => l(a, 17, a, 28)); l(5, 32, 35, 32);
        break;
      case 'snow':
        c(20, 20, 3, color, 0); [0, 60, 120].forEach((a) => { const q = a * Math.PI / 180; const dx = Math.cos(q) * 16; const dy = Math.sin(q) * 16; l(20 - dx, 20 - dy, 20 + dx, 20 + dy, 1.7); });
        break;
      case 'storm':
        p('7,18 C8,9 18,6 26,10 C34,14 34,23 27,26 C22,28 18,25 19,21 C20,18 25,18 27,20', 2.4); p('4,30 C10,35 20,37 28,33'); c(32, 8, 2, color, 0);
        break;
      case 'document':
        p('10,4 26,4 33,11 33,36 10,36 Z'); l(26, 4, 26, 12); l(26, 12, 33, 12); [18, 23, 28].forEach((a) => l(15, a, 28, a, 1.5));
        break;
      case 'shield':
        p('20,4 34,9 33,21 29,29 20,36 11,29 7,21 6,9 Z'); p('12,20 18,26 29,14', 2.7);
        break;
      case 'investigate':
        c(17, 17, 12); l(26, 26, 36, 36, 3); p('13,19 17,13 21,19 17,25 Z', 1.5);
        break;
      case 'cup':
        p('11,7 29,7 27,20 23,24 23,30 30,30 30,34 10,34 10,30 17,30 17,24 13,20 Z'); p('11,11 5,10 5,17 14,20'); p('29,11 35,10 35,17 26,20');
        break;
      case 'gate':
        p('6,34 6,18 20,7 34,18 34,34'); l(12, 20, 12, 33); l(20, 17, 20, 33); l(28, 20, 28, 33); l(3, 35, 37, 35);
        break;
      case 'warning':
        p('20,4 37,34 3,34 Z'); l(20, 14, 20, 24, 2.5); c(20, 29, 1.4, color, 0);
        break;
      case 'chart':
        l(6, 34, 6, 7); l(6, 34, 36, 34); p('9,28 16,22 22,25 31,12'); p('25,12 31,12 31,18', 1.8);
        break;
      case 'skate':
        c(20, 8, 3, color, 0); p('20,12 16,21 23,24 27,17'); l(16, 21, 12, 30); l(22, 24, 17, 33); l(15, 20, 8, 17); l(24, 24, 33, 27); p('6,35 34,35', 2.8);
        break;
      case 'evacuate':
        p('5,34 5,19 15,19 15,34'); p('15,34 15,12 25,12 25,34'); p('25,34 25,7 35,7 35,34'); p('18,8 20,4 22,8'); l(20, 9, 20, 15, 1.4);
        break;
      case 'court':
        p('4,13 20,5 36,13'); l(5, 15, 35, 15); [11, 17, 23, 29].forEach((a) => l(a, 17, a, 29)); l(4, 31, 36, 31); l(8, 35, 32, 35);
        break;
      case 'bridge':
        l(4, 32, 36, 32); p('5,30 C10,12 30,12 35,30', 2.4); [8, 14, 20, 26, 32].forEach((a) => l(a, 25 - Math.abs(20 - a) * 0.35, a, 32, 1.3));
        break;
      case 'report':
        r(6, 5, 27, 30, 2); l(12, 13, 27, 13); l(12, 19, 27, 19); l(12, 25, 23, 25); c(30, 29, 5, PALETTE.pale, 1.8);
        break;
      case 'ballot':
        r(5, 8, 30, 27, 2); r(13, 4, 14, 8, 1, PALETTE.pale, 1.6); p('10,23 17,29 29,17', 2.7);
        break;
      case 'parliament2':
        p('4,14 20,5 36,14'); [11, 17, 23, 29].forEach((a) => l(a, 16, a, 30)); l(5, 32, 35, 32); l(8, 36, 32, 36);
        break;
      case 'trophy':
        p('11,6 29,6 27,20 23,24 23,30 30,30 30,34 10,34 10,30 17,30 17,24 13,20 Z'); p('11,10 5,9 5,16 14,19'); p('29,10 35,9 35,16 26,19');
        break;
      case 'cricket':
        l(12, 5, 9, 35, 2.8); l(20, 5, 17, 35, 2.8); l(28, 5, 25, 35, 2.8); c(33, 16, 3, PALETTE.red, 0);
        break;
      default:
        c(20, 20, 14); l(13, 20, 27, 20); l(20, 13, 20, 27);
    }
  }

  add(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  add('<title>Monday 23 November 2026: a world-news front page</title>');
  add('<desc>Thirty-six sourced stories across seven regions, with dated reports, map index, event exclusions and attributed claims.</desc>');
  rect(0, 0, W, H, PALETTE.paper);
  rect(0, 0, W, 8, PALETTE.navy);
  rule(28, 42, 996, 42, PALETTE.ink, 1.2);
  text('WORLD NEWS  ·  MONDAY EDITION', 30, 31, 10.5, 'bold', PALETTE.navy, 420);
  text('36 STORIES  ·  7 REGIONS  ·  MONDAY FILE', 994, 31, 9, 'semibold', PALETTE.muted, 430, 'end');
  text('MONDAY 23 NOVEMBER 2026', 30, 82, 34, 'serif', PALETTE.ink, 690);
  text('A CEO RETURNS  ·  LONDON TAKES A NEW STANCE  ·  THE UN TURNS TO UKRAINE', 32, 111, 11.5, 'semibold', PALETTE.rust, 950);
  text('A dated dispatch: decisions, conflict, weather, markets and people across seven regions.', 32, 132, 9.4, 'sans', PALETTE.muted, 950);
  icon('globe', 930, 55, 49, PALETTE.blue);
  text('LOCAL EVENTS  /  UTC FILE TIMES', 994, 125, 7.2, 'bold', PALETTE.navy, 360, 'end');

  rect(24, 148, 976, 38, PALETTE.navy, 2);
  text('REPORTS FILED · UTC', 35, 164, 8.7, 'bold', PALETTE.white, 136);
  text('FILING TIME, NOT EVENT TIME', 35, 176, 6.4, 'sans', '#d6dfdd', 138);
  const timeX = 180;
  const timeW = 813;
  const timeCell = timeW / UTC_LINE.length;
  UTC_LINE.forEach((item, i) => {
    const x = timeX + i * timeCell;
    if (i) rule(x - 6, 154, x - 6, 180, '#68808a', 0.7);
    text(`${item.time}  ·  #${String(item.storyId).padStart(2, '0')}`, x, 163.5, 8.2, 'semibold', PALETTE.white, timeCell - 9);
    text(item.label, x, 176, 7, 'sans', '#d6dfdd', timeCell - 9);
  });

  const barX = 28;
  const barY = 190;
  const barW = 968;
  const regionCell = barW / REGION_COUNTS.length;
  REGION_COUNTS.forEach(([region, count], i) => {
    const x = barX + i * regionCell;
    const color = REGION_COLOR[region];
    rect(x + 2, barY, regionCell - 5, 20, PALETTE.card, 3, '#ddd4c6', 0.6);
    rect(x + 2, barY, 3, 20, color, 2);
    text(`${region} ${count}`, x + 10, barY + 13.5, region === 'MIDDLE EAST' ? 7.2 : 7.7, 'bold', PALETTE.ink, regionCell - 16);
  });

  const heroY = 218;
  const heroH = 194;
  const heroX = 28;
  const heroGap = 8;
  const heroW = 230;
  STORIES.filter((story) => story.kind === 'hero').forEach((story, index) => {
    const x = heroX + index * (heroW + heroGap);
    rect(x, heroY, heroW, heroH, PALETTE.card, 5, '#cfc5b5', 0.8);
    rect(x, heroY, 4, heroH, REGION_COLOR[story.region], 2);
    icon(story.icon, x + heroW - 48, heroY + 9, 34, REGION_COLOR[story.region]);
    text(`${String(story.id).padStart(2, '0')}  ·  ${story.region}  ·  REPORTED`, x + 13, heroY + 20, 7.1, 'bold', REGION_COLOR[story.region], heroW - 64);
    const titleLines = block(story.title, x + 13, heroY + 62, 14, 'serif', PALETTE.ink, heroW - 25, 3, 16.6);
    const deckY = heroY + 62 + titleLines * 16.6;
    block(story.summary, x + 13, deckY, 9.1, 'sans', PALETTE.ink, heroW - 26, 5, 11.1);
    text(story.source, x + 13, heroY + heroH - 10, 6.8, 'bold', PALETTE.muted, heroW - 25);
  });

  const railX = 750;
  const railY = heroY;
  const railW = 246;
  rect(railX, railY, railW, heroH, PALETTE.dark, 5);
  text('THE DAY IN NUMBERS', railX + 14, railY + 16, 9.3, 'bold', PALETTE.white, railW - 28);
  rule(railX + 12, railY + 23, railX + railW - 12, railY + 23, '#506873', 0.8);
  const rowStart = railY + 25;
  const rowH = (heroH - 28) / NUMBERS.length;
  NUMBERS.forEach((item, i) => {
    const y = rowStart + i * rowH;
    if (i) rule(railX + 12, y, railX + railW - 12, y, '#334c56', 0.65);
    text(item.value, railX + 13, y + 13.2, 12.1, 'bold', PALETTE.white, railW - 68);
    text(`#${String(item.storyId).padStart(2, '0')}`, railX + railW - 13, y + 12.3, 7.4, 'bold', '#e2b56b', 26, 'end');
    text(`${item.label}  ·  ${item.note}`, railX + 14, y + 23.7, 6.5, 'sans', '#d4dedb', railW - 28);
  });

  const cards = STORIES.filter((story) => story.kind === 'card');
  const gridX = 28;
  const gridY = 421;
  const gridW = 968;
  const gridGapX = 7;
  const cardW = (gridW - gridGapX * 4) / 5;
  const cardH = 93;
  const gridGapY = 7;
  cards.forEach((story, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = gridX + col * (cardW + gridGapX);
    const y = gridY + row * (cardH + gridGapY);
    rect(x, y, cardW, cardH, PALETTE.card, 4, '#d0c7b9', 0.65);
    rect(x, y, 3, cardH, REGION_COLOR[story.region], 1.5);
    text(`${String(story.id).padStart(2, '0')}  ·  ${story.region}  ·  ${story.status.split(' · ')[0]}`, x + 10, y + 12, 6.45, 'bold', REGION_COLOR[story.region], cardW - 44);
    icon(story.icon, x + cardW - 30, y + 5, 23, REGION_COLOR[story.region]);
    const titleLines = block(story.title, x + 10, y + 37, 10.6, 'serif', PALETTE.ink, cardW - 19, 2, 12.2);
    const summaryY = y + 40 + titleLines * 12.2;
    block(story.summary, x + 10, summaryY, 7.4, 'sans', PALETTE.ink, cardW - 19, 2, 8.5);
    text(story.source, x + 10, y + cardH - 5, 6.25, 'bold', PALETTE.muted, cardW - 19);
  });

  const mapX = 28;
  const mapTop = 635;
  const mapW = 396;
  const mapH = 262;
  text('WORLD MAP  ·  36 STORY LOCATIONS', mapX, mapTop + 13, 9.2, 'bold', PALETTE.navy, mapW);
  text('EDITORIAL REGIONS MAY DIFFER FROM MAP LOCATION', mapX, mapTop + 26, 6.6, 'sans', PALETTE.muted, mapW);
  const viewX = mapX + 1;
  const viewY = mapTop + 34;
  const viewW = mapW - 2;
  const viewH = 218;
  rect(viewX, viewY, viewW, viewH, PALETTE.sea, 4, '#bec8c2', 0.7);
  const clipId = 'map-window';
  add(`<defs><clipPath id="${clipId}"><rect x="${viewX}" y="${viewY}" width="${viewW}" height="${viewH}" rx="4"/></clipPath></defs>`);
  const projection = geoNaturalEarth1().fitExtent([[viewX + 5, viewY + 4], [viewX + viewW - 5, viewY + viewH - 4]], { type: 'Sphere' });
  const path = geoPath(projection);
  add(`<g clip-path="url(#${clipId})">`);
  for (const lon of [-120, -60, 0, 60, 120]) {
    const coords = Array.from({ length: 25 }, (_, i) => [lon, -78 + i * 6.7]);
    const d = path({ type: 'LineString', coordinates: coords });
    add(`<path d="${d}" fill="none" stroke="#cbd5d1" stroke-width="0.65"/>`);
  }
  for (const lat of [-45, 0, 45]) {
    const coords = Array.from({ length: 49 }, (_, i) => [-178 + i * 7.4, lat]);
    const d = path({ type: 'LineString', coordinates: coords });
    add(`<path d="${d}" fill="none" stroke="#cbd5d1" stroke-width="0.65"/>`);
  }
  const topology = JSON.parse(readFileSync(join(ROOT, 'assets/geography/natural-earth-110m/land-110m.json'), 'utf8'));
  const land = feature(topology, topology.objects.land);
  add(`<path d="${path(land)}" fill="${PALETTE.land}" stroke="#a99f90" stroke-width="0.5" fill-rule="evenodd"/>`);
  const placed = [];
  for (const story of STORIES) {
    const original = projection([story.lon, story.lat]);
    if (!original || !original.every(Number.isFinite)) throw new Error(`No map projection for story ${story.id}`);
    let chosen = original;
    let bestDistance = 0;
    const candidateOffsets = [[0, 0]];
    const angleBase = story.id * 2.399963229728653;
    for (let ring = 1; ring <= 5; ring++) {
      const radius = 13 + ring * 5.4;
      for (let step = 0; step < 24; step++) {
        const angle = angleBase + step * Math.PI * 2 / 24;
        candidateOffsets.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
    }
    let found = false;
    for (const [dx, dy] of candidateOffsets) {
      const candidate = [original[0] + dx, original[1] + dy];
      if (candidate[0] < viewX + 8 || candidate[0] > viewX + viewW - 8 || candidate[1] < viewY + 8 || candidate[1] > viewY + viewH - 8) continue;
      const nearest = placed.reduce((best, pin) => Math.min(best, Math.hypot(candidate[0] - pin.x, candidate[1] - pin.y)), Infinity);
      if (nearest > bestDistance) { bestDistance = nearest; chosen = candidate; }
      if (nearest >= 14) { chosen = candidate; found = true; break; }
    }
    const moved = Math.hypot(chosen[0] - original[0], chosen[1] - original[1]) > 1;
    if (moved) rule(original[0], original[1], chosen[0], chosen[1], REGION_COLOR[story.region], 0.65);
    placed.push({ id: story.id, x: chosen[0], y: chosen[1] });
    circle(chosen[0], chosen[1], 7.1, REGION_COLOR[story.region], PALETTE.white, 0.85);
    text(String(story.id).padStart(2, '0'), chosen[0], chosen[1] + 2.05, 5.7, 'bold', PALETTE.white, 8.2, 'middle');
    if (story.toLon !== undefined && story.toLat !== undefined) {
      const end = projection([story.toLon, story.toLat]);
      if (end) rule(original[0], original[1], end[0], end[1], PALETTE.rust, 1.1, '3 2');
    }
  }
  add('</g>');
  text('PINS INDEX STORY LOCATIONS  ·  COUNTRY-LEVEL WHERE VENUE IS NOT SPECIFIED', mapX, mapTop + 262, 6.1, 'sans', PALETTE.muted, mapW);

  const listX = 440;
  const listTop = 635;
  const listW = 556;
  text('ALSO ON  ·  23 MORE STORIES', listX, listTop + 13, 9.4, 'bold', PALETTE.navy, listW);
  text('DATED REPORTS · EACH ITEM KEEPS ITS SOURCE / CLAIM CUE', listX, listTop + 26, 6.6, 'sans', PALETTE.muted, listW);
  rule(listX, listTop + 32, listX + listW, listTop + 32, '#bcb3a4', 0.8);
  const briefs = STORIES.filter((story) => story.kind === 'brief');
  const colGap = 14;
  const colW = (listW - colGap) / 2;
  const startY = listTop + 40;
  const rowH1 = 18.55;
  const rowH2 = 20.3;
  briefs.forEach((story, index) => {
    const col = index < 12 ? 0 : 1;
    const row = col === 0 ? index : index - 12;
    const x = listX + col * (colW + colGap);
    const y = startY + row * (col === 0 ? rowH1 : rowH2);
    const titleColor = REGION_COLOR[story.region];
    text(String(story.id).padStart(2, '0'), x, y + 8.6, 7.4, 'bold', titleColor, 17);
    text(story.title, x + 22, y + 8.7, 8.6, 'bold', PALETTE.ink, colW - 22);
    text(story.brief, x + 22, y + 17.4, 7.05, 'sans', PALETTE.muted, colW - 22);
    rule(x, y + (col === 0 ? rowH1 - 1.5 : rowH2 - 1.5), x + colW, y + (col === 0 ? rowH1 - 1.5 : rowH2 - 1.5), '#d8d0c3', 0.45);
  });

  const auditY = 920;
  rect(24, auditY, 976, 91, 'none', 1, PALETTE.red, 1.4);
  rect(24, auditY, 7, 91, PALETTE.red);
  text('DATE CHECK  ·  OUTSIDE MONDAY\'S EVENT WINDOW', 38, auditY + 14, 8.4, 'bold', PALETTE.red, 930);
  const checkX = 39;
  const checkW = 948 / 4;
  DATE_CHECK.forEach((item, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = checkX + col * checkW;
    const y = auditY + 31 + row * 15;
    text(`${item.event}  ·  ${item.date}`, x, y, 7.3, 'semibold', PALETTE.ink, checkW - 8);
  });
  rule(38, auditY + 63, 987, auditY + 63, '#d6c5bb', 0.65);
  text('HOW SURE  ·  REPORTED = dated report / record  ·  CLAIM = attributed, not independently established  ·  ONGOING = unresolved process', 39, auditY + 75, 6.65, 'sans', PALETTE.ink, 945);
  text('Sources are listed per story ID. UTC strip is filing time, not event time. Pins are location indexes; editorial region may differ.', 39, auditY + 86, 6.35, 'sans', PALETTE.muted, 945);

  add('</svg>');
  return { svg: svg.join(''), audit };
}

export async function renderEntry() {
  const { svg, audit } = buildSvg();
  const wasm = readFileSync(join(ROOT, 'vendor/resvg/index_bg.wasm'));
  await initWasm(wasm);
  const fontBuffers = Object.values(FONT_BYTES).map((buf) => new Uint8Array(buf));
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'original' },
    textRendering: 1,
    shapeRendering: 2,
    imageRendering: 0,
    font: {
      fontBuffers,
      defaultFontFamily: 'Source Sans 3',
      serifFamily: 'Source Serif 4',
      sansSerifFamily: 'Source Sans 3',
    },
  });
  const image = renderer.render();
  if (image.width !== W || image.height !== H) throw new Error(`Unexpected render size ${image.width}x${image.height}`);
  const png = Buffer.from(image.asPng());
  image.free();
  renderer.free();
  if (png.length > 1_048_576) throw new Error(`Rendered PNG exceeds 1 MiB (${png.length} bytes)`);
  return { png, audit };
}

async function main() {
  const { png } = await renderEntry();
  const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'entry.png'), png);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => { console.error(error?.stack || error); process.exitCode = 1; });
}
