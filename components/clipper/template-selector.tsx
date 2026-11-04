'use client';

import { CAPTION_TEMPLATES, type TemplateId } from '@/lib/clip-config';
import { cn } from '@/lib/utils';
import { TemplatePreview } from './template-preview';

export function TemplateSelector({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (templateId: TemplateId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Caption template" className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {CAPTION_TEMPLATES.map((template) => {
        const isSelected = template.id === value;
        return (
          <button
            key={template.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(template.id)}
            className={cn(
              'group flex flex-col gap-3 rounded-2xl border p-3 text-left transition duration-200 active:scale-[0.98]',
              isSelected
                ? 'border-white bg-zinc-800 shadow-lg shadow-black/30 ring-1 ring-white/60'
                : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-800/60',
            )}
          >
            <TemplatePreview template={template} isPlaying={isSelected} />
            <div>
              <p className="text-sm font-semibold text-zinc-100">{template.name}</p>
              <p className="text-xs leading-relaxed text-zinc-400">{template.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
