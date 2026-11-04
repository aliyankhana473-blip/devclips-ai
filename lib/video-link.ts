export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export type ClipSource =
  | { kind: 'file'; file: File }
  | { kind: 'link'; url: string }
  | { kind: 'youtube'; url: string };

export type ParsedLink = { kind: 'mp4' | 'youtube' | 'loom'; url: string };

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const LOOM_HOSTS = new Set(['loom.com', 'www.loom.com']);

export function getYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1) || null;
    const v = u.searchParams.get('v');
    if (v) return v;
    return null;
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

export function parseVideoLink(input: string): ParsedLink | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return { kind: 'youtube', url: url.toString() };
  if (LOOM_HOSTS.has(host)) return { kind: 'loom', url: url.toString() };
  if (url.pathname.toLowerCase().endsWith('.mp4')) return { kind: 'mp4', url: url.toString() };
  return null;
}

export async function fetchVideoFromLink(url: string): Promise<File> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(
      "This link can't be downloaded from the browser. Download the MP4 and upload it instead.",
    );
  }
  if (!response.ok) throw new Error('We could not download a video from this link.');

  const blob = await response.blob();
  if (blob.size > MAX_VIDEO_BYTES) {
    throw new Error('This video is larger than 500 MB. Try a shorter or smaller file.');
  }

  const name = new URL(url).pathname.split('/').pop() || 'video.mp4';
  return new File([blob], name, { type: 'video/mp4' });
}

export async function getVideoFromLink(url: string): Promise<Blob> {
  return fetchVideoFromLink(url);
}
