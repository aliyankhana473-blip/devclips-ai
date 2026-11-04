import { Film } from 'lucide-react';
import type { AdminClip } from '@/lib/api';

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

export function ClipsList({ clips }: { clips: AdminClip[] }) {
  if (clips.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
        No clips have been generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Clip</th>
              <th className="px-5 py-3 font-semibold">Viral score</th>
              <th className="px-5 py-3 font-semibold">Length</th>
              <th className="px-5 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {clips.map((clip) => (
              <tr key={clip.id} className="transition hover:bg-zinc-800/40">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                      <Film className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-zinc-100">
                      {clip.emoji} {clip.title}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-zinc-300">{clip.viralScore}/100</td>
                <td className="px-5 py-4 text-zinc-300">{Math.round(clip.durationSeconds)}s</td>
                <td className="px-5 py-4 text-zinc-400">{dateFormat.format(new Date(clip.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
