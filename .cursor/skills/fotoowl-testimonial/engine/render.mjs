// Render a testimonial (or stills / the standalone outro) from a work folder.
//   node render.mjs --work <work/slug> full            → <work>/render/video_noaudio.mp4
//   node render.mjs --work <work/slug> stills 30 200   → <work>/stills/f0030.jpg …
//   node render.mjs --work <work/slug> outro           → <work>/render/outro_noaudio.mp4
// Env: CHROME_PATH (optional browser), RENDER_CONCURRENCY (default 2), RENDER_GL (e.g. swangle on Linux)
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const wi = args.indexOf('--work');
if (wi < 0) { console.error('usage: node render.mjs --work <dir> full|stills|outro [frames…]'); process.exit(2); }
const work = path.resolve(args[wi + 1]);
const rest = args.filter((_, i) => i !== wi && i !== wi + 1);
const mode = rest[0] ?? 'full';
const edit = JSON.parse(fs.readFileSync(path.join(work, 'edit.json'), 'utf8'));

const browserExecutable = process.env.CHROME_PATH || null;
const chromiumOptions = process.env.RENDER_GL ? {gl: process.env.RENDER_GL} : {};
const concurrency = Number(process.env.RENDER_CONCURRENCY || 2);

const serveUrl = await bundle({entryPoint: path.join(here, 'src/index.ts'), publicDir: path.join(work, 'public')});
const compId = mode === 'outro' ? 'Outro' : 'Testimonial';
const inputProps = {edit};
const composition = await selectComposition({serveUrl, id: compId, inputProps, browserExecutable});
fs.mkdirSync(path.join(work, 'render'), {recursive: true});

if (mode === 'stills') {
  fs.mkdirSync(path.join(work, 'stills'), {recursive: true});
  for (const f of rest.slice(1).map(Number)) {
    await renderStill({serveUrl, composition, frame: f, inputProps, output: path.join(work, 'stills', `f${String(f).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 85, browserExecutable, chromiumOptions});
    console.log('still', f);
  }
} else {
  let last = -1;
  const out = path.join(work, 'render', mode === 'outro' ? 'outro_noaudio.mp4' : 'video_noaudio.mp4');
  await renderMedia({
    serveUrl, composition, inputProps, codec: 'h264', crf: 16, x264Preset: 'slow', muted: true, pixelFormat: 'yuv420p',
    outputLocation: out, browserExecutable, chromiumOptions, concurrency,
    offthreadVideoCacheSizeInBytes: 400 * 1024 * 1024, offthreadVideoThreads: 1,
    onProgress: ({progress}) => { const p = Math.floor(progress * 20); if (p !== last) { last = p; console.log('progress', (progress * 100).toFixed(0)); } },
  });
  console.log('RENDER_DONE', out);
}
process.exit(0);
