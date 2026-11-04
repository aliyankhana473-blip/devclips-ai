'use client';

import { Film, Sparkles } from 'lucide-react';
import type { Clip } from '@/lib/clip-generator';
import type { ClipSettings } from '@/lib/clip-config';
import { ClipCard } from './clip-card';

export function ClipResults({
  clips,
  settings,
  file,
  fileName,
}: {
  clips: Clip[];
  settings: ClipSettings;
  file: File;
  fileName: string;
}) {
  return (
    <section id="results" className="scroll-mt-24 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              {clips.length} clips ready
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50 md:text-4xl">
              Your best moments, vertical and ready to post
            </h2>
          </div>
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <Film className="h-4 w-4" />
            Source: {fileName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clips.map((clip, index) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              settings={settings}
              file={file}
              rank={index + 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
