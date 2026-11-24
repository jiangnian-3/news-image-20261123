import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';
import test from 'node:test';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN = join(ROOT, 'main.ts');
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  crcTable[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngInfo(bytes) {
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a', 'PNG signature');
  let offset = 8;
  const chunks = [];
  while (offset < bytes.length) {
    assert.ok(offset + 12 <= bytes.length, 'complete chunk header');
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const end = offset + 12 + length;
    assert.ok(end <= bytes.length, `${type} chunk fits in file`);
    const expected = bytes.readUInt32BE(end - 4);
    assert.equal(crc32(bytes.subarray(offset + 4, end - 4)), expected, `${type} CRC`);
    chunks.push({ type, data: bytes.subarray(offset + 8, end - 4) });
    offset = end;
    if (type === 'IEND') break;
  }
  assert.equal(offset, bytes.length, 'IEND is the final byte sequence');
  assert.equal(chunks[0].type, 'IHDR');
  assert.equal(chunks.at(-1).type, 'IEND');
  assert.equal(chunks.filter((c) => c.type === 'IEND').length, 1);
  const ihdr = chunks[0].data;
  assert.equal(ihdr.length, 13);
  assert.equal(ihdr.readUInt32BE(0), 1024);
  assert.equal(ihdr.readUInt32BE(4), 1024);
  assert.equal(ihdr[8], 8, '8-bit channels');
  assert.equal(ihdr[9], 6, 'RGBA PNG');
  assert.equal(ihdr[12], 0, 'non-interlaced image');
  const raw = inflateSync(Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)));
  assert.equal(raw.length, (1024 * 4 + 1) * 1024, 'all full RGBA scanlines present');
  const colors = new Set();
  for (let y = 0, p = 0; y < 1024; y++, p += 4097) {
    assert.ok(raw[p] <= 4, `valid PNG filter on row ${y}`);
    if (y % 9 === 0) for (let x = 0; x < 1024; x += 7) {
      const q = p + 1 + x * 4;
      colors.add(`${raw[q]},${raw[q + 1]},${raw[q + 2]},${raw[q + 3]}`);
    }
  }
  assert.ok(colors.size > 60, 'image contains varied visible artwork, not a blank placeholder');
  return { width: 1024, height: 1024, colors: colors.size };
}

const { STORIES, NUMBERS, UTC_LINE, DATE_CHECK, REGION_COUNTS } = await import(pathToFileURL(MAIN).href);

test('the fixed editorial dataset is complete, linked, sourced and geographically indexable', () => {
  assert.equal(STORIES.length, 36);
  assert.deepEqual(STORIES.map((s) => s.id), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.equal(STORIES.filter((s) => s.kind === 'hero').length, 3);
  assert.equal(STORIES.filter((s) => s.kind === 'card').length, 10);
  assert.equal(STORIES.filter((s) => s.kind === 'brief').length, 23);
  assert.deepEqual(REGION_COUNTS, [
    ['GLOBAL', 1], ['EUROPE', 10], ['MIDDLE EAST', 2], ['ASIA', 6],
    ['AFRICA', 5], ['AMERICAS', 8], ['OCEANIA', 4],
  ]);
  const tally = Object.fromEntries(REGION_COUNTS.map(([region]) => [region, 0]));
  for (const story of STORIES) {
    assert.ok(story.title.trim() && story.summary.trim() && story.source.trim(), `story ${story.id} has title, summary and source`);
    assert.ok(Number.isFinite(story.lon) && story.lon >= -180 && story.lon <= 180, `story ${story.id} longitude`);
    assert.ok(Number.isFinite(story.lat) && story.lat >= -90 && story.lat <= 90, `story ${story.id} latitude`);
    tally[story.region]++;
  }
  assert.deepEqual(Object.entries(tally), REGION_COUNTS);
  assert.deepEqual(NUMBERS.map((n) => n.storyId), [30, 5, 31, 26, 34, 13]);
  assert.deepEqual(UTC_LINE.map((x) => [x.time, x.storyId]), [
    ['06:13Z', 17], ['09:54Z', 5], ['12:41:45Z', 34],
    ['18:47Z', 7], ['21:04Z', 1], ['22:48Z', 26],
  ]);
  assert.equal(DATE_CHECK.length, 8);
});

test('the executable writes a complete 1024-square PNG at MAKEFUN_OUTPUT_DIR', () => {
  const work = mkdtempSync(join(ROOT, '.test-output-'));
  try {
    const out = join(work, 'chosen-output');
    const run = spawnSync(process.execPath, [MAIN], {
      cwd: ROOT, encoding: 'utf8', timeout: 50000, maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, MAKEFUN_OUTPUT_DIR: out },
    });
    assert.equal(run.status, 0, `exit status; stderr: ${run.stderr}`);
    assert.equal(run.signal, null);
    const png = readFileSync(join(out, 'entry.png'));
    assert.ok(png.length <= 1_048_576, `PNG is ${png.length} bytes (limit 1 MiB)`);
    const info = pngInfo(png);
    assert.equal(info.width, 1024);
    assert.equal(info.height, 1024);
    assert.ok(info.colors > 60);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test('fresh executions produce byte-identical output', () => {
  const work = mkdtempSync(join(ROOT, '.test-repeat-'));
  try {
    const outputs = [join(work, 'a'), join(work, 'b')];
    const images = outputs.map((out) => {
      const run = spawnSync(process.execPath, [MAIN], {
        cwd: ROOT, encoding: 'utf8', timeout: 50000, maxBuffer: 2 * 1024 * 1024,
        env: { ...process.env, MAKEFUN_OUTPUT_DIR: out },
      });
      assert.equal(run.status, 0, `exit status; stderr: ${run.stderr}`);
      const png = readFileSync(join(out, 'entry.png'));
      assert.ok(png.length <= 1_048_576);
      pngInfo(png);
      return png;
    });
    assert.deepEqual(images[0], images[1], 'deterministic PNG bytes');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
