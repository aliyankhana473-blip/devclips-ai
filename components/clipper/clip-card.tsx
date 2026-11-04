'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Clip } from '@/lib/clip-generator';
import type { ClipSettings } from '@/lib/clip-config';
import { buildCaptions } from '@/lib/captions';
import { exportClip } from '@/lib/clip-export';
import { CaptionOverlay } from './caption-overlay';
import { HighlightedText } from './highlighted-text';

type ExportStatus = 'idle' | 'rendering' | 'done' | 'error';

function formatTimestamp(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ClipCard({
  clip,
  settings,
  file,
  rank,
}: {
  clip: Clip;
  settings: ClipSettings;
  file: File;
  rank: number;
}) {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const captions = buildCaptions(clip, settings);
  const isRendering = exportStatus === 'rendering';

  async function handleDownload() {
    setExportStatus('rendering');
    setProgress(0);
    setErrorMessage(null);
    try {
      const blob = await exportClip(file, clip, setProgress);
      triggerDownload(blob, `devclips-clip-${rank}.mp4`);
      setExportStatus('done');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong while preparing the clip.',
      );
      setExportStatus('error');
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 transition duration-300 hover:-translate-y-1 hover:border-zinc-600 hover:shadow-2xl hover:shadow-black/40">
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-black">
        <img
          src={clip.thumbnail}
          alt={`Preview of ${clip.title}`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <span className="absolute left-3 top-3 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur">
          Viral score {clip.viralScore}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-zinc-200 backdrop-blur">
          #{rank}
        </span>
        <CaptionOverlay lines={captions} templateId={settings.templateId} />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-zinc-50">{clip.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-3.5 w-3.5" />
            {formatTimestamp(clip.start)} to {formatTimestamp(clip.start + clip.duration)}
          </p>
        </div>

        <ul className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm leading-relaxed text-zinc-300">
          {clip.transcript.map((line) => (
            <li key={line.text}>
              <HighlightedText text={line.text} keywords={settings.highlightKeywords ? line.keywords : []} />
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-2">
          <Button
            onClick={handleDownload}
            disabled={isRendering}
            className="h-11 w-full gap-2 rounded-xl bg-zinc-100 font-semibold text-zinc-900 transition hover:bg-white active:scale-[0.98] disabled:opacity-80"
          >
            {isRendering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering {progress}%
              </>
            ) : exportStatus === 'done' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Downloaded - Download again
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download clip
              </>
            )}
          </Button>
          {exportStatus === 'error' && errorMessage && (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
