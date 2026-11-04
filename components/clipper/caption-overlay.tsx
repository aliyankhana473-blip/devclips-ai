'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { getCaptionTemplate, type TemplateId } from '@/lib/clip-config';
import type { CaptionLine } from '@/lib/captions';
import { HighlightedText } from './highlighted-text';

const LINE_INTERVAL_MS = 2400;

export function CaptionOverlay({
  lines,
  templateId,
}: {
  lines: CaptionLine[];
  templateId: TemplateId;
}) {
  const [index, setIndex] = useState(0);
  const lineCount = lines.length;

  useEffect(() => {
    if (lineCount < 2) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % lineCount), LINE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [lineCount]);

  const line = lines[index % Math.max(lineCount, 1)];
  if (!line) return null;

  const template = getCaptionTemplate(templateId);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[16%] flex justify-center px-4">
      <p
        key={`${index}-${templateId}`}
        className={cn(
          'animate-in fade-in zoom-in-95 duration-300 text-center leading-snug',
          template.captionClass,
        )}
      >
        <HighlightedText text={line.text} keywords={line.keywords} />
      </p>
    </div>
  );
}
