import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { Clip } from './clip-generator';

const CORE_BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

let ffmpegPromise: Promise<FFmpeg> | null = null;
let exportQueue: Promise<unknown> = Promise.resolve();

function loadEngine(): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      return ffmpeg;
    })().catch((error) => {
      ffmpegPromise = null;
      throw error;
    });
  }
  return ffmpegPromise;
}

async function renderClip(
  file: File,
  clip: Clip,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const ffmpeg = await loadEngine();
  const handleProgress = ({ progress }: { progress: number }) => {
    onProgress(Math.round(Math.min(1, Math.max(0, progress)) * 100));
  };

  ffmpeg.on('progress', handleProgress);
  try {
    await ffmpeg.writeFile('input.mp4', await fetchFile(file));
    const exitCode = await ffmpeg.exec([
      '-ss',
      clip.start.toFixed(2),
      '-i',
      'input.mp4',
      '-t',
      clip.duration.toFixed(2),
      '-vf',
      'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280',
      '-c:v',
      'libx264',
      '-preset',
      'ultrafast',
      '-crf',
      '28',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      'output.mp4',
    ]);
    if (exitCode !== 0) throw new Error('The video engine could not render this clip.');

    const data = await ffmpeg.readFile('output.mp4');
    if (typeof data === 'string') throw new Error('The video engine returned an unexpected result.');
    return new Blob([new Uint8Array(data)], { type: 'video/mp4' });
  } finally {
    ffmpeg.off('progress', handleProgress);
    await ffmpeg.deleteFile('input.mp4').catch(() => undefined);
    await ffmpeg.deleteFile('output.mp4').catch(() => undefined);
  }
}

export function exportClip(
  file: File,
  clip: Clip,
  onProgress: (percent: number) => void,
): Promise<Blob> {
  const run = exportQueue.then(() => renderClip(file, clip, onProgress));
  exportQueue = run.catch(() => undefined);
  return run;
}
