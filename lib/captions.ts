import type { Clip } from './clip-generator';
import type { ClipSettings } from './clip-config';

export type CaptionLine = {
  text: string;
  keywords: string[];
};

const CENSORED_WORDS = ['damn', 'crap', 'hell'];
const CENSOR_PATTERN = new RegExp(`\\b(${CENSORED_WORDS.join('|')})\\b`, 'gi');

function censor(text: string) {
  return text.replace(CENSOR_PATTERN, (word) => word[0] + '*'.repeat(word.length - 1));
}

export function buildCaptions(clip: Clip, settings: ClipSettings): CaptionLine[] {
  return clip.transcript.map((line) => {
    let text = settings.autoCensor ? censor(line.text) : line.text;
    if (settings.addEmojis) text = `${text} ${clip.emoji}`;
    return {
      text,
      keywords: settings.highlightKeywords ? line.keywords : [],
    };
  });
}
