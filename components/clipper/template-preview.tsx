'use client';

import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptionTemplate } from '@/lib/clip-config';

const PREVIEW_IMAGE_URL =
  'https://images.pexels.com/photos/8303428/pexels-photo-8303428.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';
const PREVIEW_WORDS = 'This one trick doubles your views'.split(' ');
const WORD_INTERVAL_MS = 380;
const HOLD_TICKS = 5;
const CYCLE_TICKS = PREVIEW_WORDS.length + HOLD_TICKS;

export function TemplatePreview({
  template,
  isPlaying,
}: {
  template: CaptionTemplate;
  isPlaying: boolean;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setTick((current) => (current + 1) % CYCLE_TICKS), WORD_INTERVAL_MS);
    return () => {
      clearInterval(timer);
      setTick(0);
    };
  }, [isPlaying]);

  const shownWords = isPlaying ? Math.min(tick + 1, PREVIEW_WORDS.length) : PREVIEW_WORDS.length;

  return (
    <div className="relative flex aspect-[9/12] items-end justify-center overflow-hidden rounded-xl bg-zinc-900">
      <img
        src={PREVIEW_IMAGE_URL}
        alt=""
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition duration-700',
          isPlaying ? 'scale-105 opacity-100' : 'scale-100 opacity-80 group-hover:opacity-100',
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      <div className="absolute inset-x-0 bottom-[16%] flex justify-center px-2">
        <p className={cn('text-center leading-snug', template.captionClass)}>
          {PREVIEW_WORDS.slice(0, shownWords).map((word, index) => (
            <span key={`${word}-${index}`} className="inline-block animate-in fade-in zoom-in-75 duration-200">
              {word}
              {index < shownWords - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      </div>

      <div
        className={cn(
          'absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg transition duration-200',
          isPlaying ? 'opacity-0' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <Play className="h-5 w-5 fill-current pl-0.5" />
      </div>
    </div>
  );
}
