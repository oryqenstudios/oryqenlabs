#!/usr/bin/env node
/**
 * Turn an AI-generated clip or still into site-ready frames and mark it ready.
 *
 *   node scripts/ingest.mjs <shot> <clip.mp4> [--from <s>] [--to <s>] [--frames <n>] [--variant <finish>]
 *   node scripts/ingest.mjs 0 <still.png|jpg|webp> --finish <ripen|rind|golden|green|core> [--device tablet]
 *
 * Video: samples exactly the manifest's frame count for the shot evenly across the clip (or the
 * --from/--to segment), cover-crops to 16:9, and writes 2560×1440 WebP frames to
 * public/frames/shot-NN/0001.avif… (AVIF, CRF 26) plus 1920×1080 copies to public/frames/mobile/shot-NN/ (CRF 30; phones crop into the frame).
 * --frames sets the shot's frame count first (keep src/data/shots.ts in step). --variant <finish> writes one finish's
 * take of a per-finish shot (the hero) to shot-NN/<finish>/ and lists it in the manifest's `variants`.
 * Still: writes 3840×2160 (and 1920×1080 mobile) to public/frames/shot-00/[slate-]<finish>.webp.
 * Then sets the shot ready in public/frames/manifest.json. Needs ffmpeg and ffprobe on PATH.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const framesDir = join(root, 'public', 'frames');
const manifestPath = join(framesDir, 'manifest.json');
const FINISHES = ['ripen', 'rind', 'golden', 'green', 'core'];

function fail(msg) { console.error(`ingest: ${msg}`); process.exit(1); }
function arg(name) { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; }
const pad = (n, l) => String(n).padStart(l, '0');
const ff = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
const cover = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h}`;
const sizeOf = dir => readdirSync(dir).reduce((a, f) => a + statSync(join(dir, f)).size, 0);
const mb = b => `${(b / 1048576).toFixed(1)} MB`;

const [shotArg, input] = process.argv.slice(2);
const shot = Number(shotArg);
if (!Number.isInteger(shot) || shot < 0 || shot > 99 || !input) fail('usage: node scripts/ingest.mjs <shot> <file> [options] (see the comment at the top)');
if (!existsSync(input)) fail(`no such file: ${input}`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

if (shot === 0) {
  const finish = arg('finish'); const tablet = arg('device') === 'tablet';
  if (!FINISHES.includes(finish ?? '')) fail(`--finish must be one of ${FINISHES.join(', ')}`);
  const name = `${tablet ? 'slate-' : ''}${finish}`;
  for (const [dir, w, h, q] of [[join(framesDir, 'shot-00'), 3840, 2160, 86], [join(framesDir, 'mobile', 'shot-00'), 1920, 1080, 80]]) {
    mkdirSync(dir, { recursive: true });
    ff(['-i', input, '-vf', cover(w, h), '-frames:v', '1', '-c:v', 'libwebp', '-quality', String(q), join(dir, `${name}.webp`)]);
  }
  manifest.stills.ready = [...new Set([...(manifest.stills.ready ?? []), name])];
  manifest.stills.mobile = true;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`shot 00 · ${name}: 3840×2160 + 1920×1080 written, marked ready`);
  process.exit(0);
}

const entry = manifest.shots[String(shot)] ??= { frames: 0, ready: false };
if (arg('frames')) entry.frames = Number(arg('frames'));
if (!(entry.frames > 0)) fail(`shot ${shot} has no frame count: pass --frames <n>`);
const N = entry.frames;
/** Footage frames are AVIF (SVT-AV1 stills, CRF 26 desktop / 30 phones): about a third the size of WebP at the same quality. */
const EXT = manifest.ext = 'avif';
const variant = arg('variant');
if (variant !== undefined && !FINISHES.includes(variant)) fail(`--variant must be one of ${FINISHES.join(', ')}`);
const sub = variant ? `/${variant}` : '';
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-select_streams', 'v:0', '-of', 'json', input]).toString());
const duration = Number(probe.format.duration);
const from = Number(arg('from') ?? 0), to = Number(arg('to') ?? duration);
if (!(to > from) || to > duration + 0.01) fail(`--from/--to must lie within the clip (0–${duration.toFixed(2)} s)`);
const span = to - from;
const src = probe.streams?.[0];
if (src && (src.width < 1920 || src.height < 1080)) console.warn(`ingest: source is ${src.width}×${src.height}; frames are upscaled to 1440p (plan: upscale low-res clips first for best results)`);

for (const [dir, w, h, q] of [[join(framesDir, `shot-${pad(shot, 2)}${sub}`), 2560, 1440, 26], [join(framesDir, 'mobile', `shot-${pad(shot, 2)}${sub}`), 1920, 1080, 30]]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  // N frames spread evenly over the segment, whatever the clip's own frame rate
  ff(['-ss', String(from), '-t', String(span), '-i', input, '-vf', `fps=${N}/${span},${cover(w, h)}`, '-frames:v', String(N), '-c:v', 'libsvtav1', '-crf', String(q), '-preset', '8', '-svtav1-params', 'still-picture=1', '-f', 'image2', join(dir, `%04d.${EXT}`)]);
  let files = readdirSync(dir).filter(f => f.endsWith(`.${EXT}`)).sort();
  for (let i = files.length; i < N; i++) copyFileSync(join(dir, files[files.length - 1]), join(dir, `${pad(i + 1, 4)}.${EXT}`)); // rounding can leave one short
  files = readdirSync(dir).filter(f => f.endsWith(`.${EXT}`));
  console.log(`shot ${pad(shot, 2)}${sub} · ${w}×${h}: ${files.length} frames, ${mb(sizeOf(dir))}`);
}
entry.ready = true;
entry.mobile = true;
if (variant) entry.variants = FINISHES.filter(k => k === variant || entry.variants?.includes(k));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`shot ${pad(shot, 2)}${sub} marked ready in manifest.json`);
