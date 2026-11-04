import type { Clip } from '@/lib/clip-generator';
import type { PaidPlanId } from '@/lib/plans';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callFunction<T>(slug: string, body: string | FormData): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  };
  if (typeof body === 'string') headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/${slug}`, { method: 'POST', headers, body });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }

  const payload = (await response.json().catch(() => null)) as (Record<string, unknown> & { error?: string }) | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? `Request failed (${response.status})`, response.status);
  }
  if (!payload) throw new ApiError('Unexpected response from the server.', response.status);
  return payload as T;
}

export function submitPayment(plan: PaidPlanId, transactionId: string, screenshot: File) {
  const form = new FormData();
  form.append('plan', plan);
  form.append('transactionId', transactionId);
  form.append('screenshot', screenshot);
  return callFunction<{ ok: true; id: string }>('submit-payment', form);
}

export function saveClips(clips: Clip[]) {
  const payload = {
    clips: clips.map((clip) => ({
      title: clip.title,
      emoji: clip.emoji,
      viralScore: clip.viralScore,
      durationSeconds: clip.duration,
    })),
  };
  return callFunction<{ ok: true; saved: number }>('save-clips', JSON.stringify(payload));
}

export type AdminPendingPayment = {
  id: string;
  plan: PaidPlanId;
  amountPkr: number;
  transactionId: string;
  screenshotUrl: string | null;
  createdAt: string;
};

export type AdminClip = {
  id: string;
  title: string;
  emoji: string;
  viralScore: number;
  durationSeconds: number;
  createdAt: string;
};

export type AdminOverview = {
  totalRevenuePkr: number;
  approvedCount: number;
  pending: AdminPendingPayment[];
  clips: AdminClip[];
};

export function fetchAdminOverview(adminKey: string) {
  return callFunction<AdminOverview>('admin', JSON.stringify({ key: adminKey, action: 'overview' }));
}

export function reviewPayment(adminKey: string, id: string, decision: 'approved' | 'rejected') {
  return callFunction<{ ok: true }>(
    'admin',
    JSON.stringify({ key: adminKey, action: 'review', id, decision }),
  );
}

export async function resolveYouTubeVideo(url: string): Promise<File> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/resolve-video`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  const payload = (await response.json().catch(() => null)) as { videoUrl?: string; title?: string; error?: string } | null;
  if (!response.ok || !payload?.videoUrl) {
    throw new ApiError(
      payload?.error ?? `We couldn't process this YouTube link (${response.status}).`,
      response.status,
    );
  }

  const videoResponse = await fetch(payload.videoUrl);
  if (!videoResponse.ok) {
    throw new ApiError('YouTube is busy, try again in 1 min or use Upload MP4.', 502);
  }

  const blob = await videoResponse.blob();
  const safeName = (payload.title ?? 'youtube-video').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
  return new File([blob], `${safeName}.mp4`, { type: 'video/mp4' });
}
