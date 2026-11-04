export type TemplateId = 'default' | 'modern' | 'bouncy' | 'mrbeast' | 'business';

export type CaptionTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  captionClass: string;
};

export const CAPTION_TEMPLATES: CaptionTemplate[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean white text with a soft shadow',
    captionClass: 'font-extrabold text-white text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Frosted pill behind every line',
    captionClass:
      'rounded-2xl bg-black/60 px-3 py-2 font-semibold text-white text-base backdrop-blur-md',
  },
  {
    id: 'bouncy',
    name: 'Bouncy',
    description: 'Playful lines that pop into view',
    captionClass: 'font-black text-white text-xl italic drop-shadow-[0_3px_0_rgba(0,0,0,0.85)]',
  },
  {
    id: 'mrbeast',
    name: 'Mr. Beast',
    description: 'Huge all-caps, high-contrast punch',
    captionClass:
      'font-black uppercase text-white text-2xl leading-tight tracking-tight drop-shadow-[0_4px_0_rgba(0,0,0,1)]',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Crisp light card for a pro look',
    captionClass:
      'rounded-md bg-zinc-100 px-3 py-1.5 font-semibold text-zinc-900 text-base shadow-lg',
  },
];

export type ClipSettings = {
  templateId: TemplateId;
  addEmojis: boolean;
  highlightKeywords: boolean;
  addBrolls: boolean;
  removeSilences: boolean;
  autoCensor: boolean;
};

export const DEFAULT_CLIP_SETTINGS: ClipSettings = {
  templateId: 'default',
  addEmojis: false,
  highlightKeywords: true,
  addBrolls: false,
  removeSilences: false,
  autoCensor: false,
};

export const CLIP_OPTIONS: { key: keyof Omit<ClipSettings, 'templateId'>; label: string }[] = [
  { key: 'addEmojis', label: 'Add emojis' },
  { key: 'highlightKeywords', label: 'Highlight keywords' },
  { key: 'addBrolls', label: 'Add B-rolls' },
  { key: 'removeSilences', label: 'Remove silences' },
  { key: 'autoCensor', label: 'Auto-censor' },
];

export function getCaptionTemplate(templateId: TemplateId): CaptionTemplate {
  return CAPTION_TEMPLATES.find((template) => template.id === templateId) ?? CAPTION_TEMPLATES[0];
}
