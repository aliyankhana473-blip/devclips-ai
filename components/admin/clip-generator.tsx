'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import { ClipResults } from '@/components/clipper/clip-results';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { saveClips, resolveYouTubeVideo } from '@/lib/api';
import { DEFAULT_CLIP_SETTINGS } from '@/lib/clip-config';
import { generateClips, type Clip } from '@/lib/clip-generator';
import { fetchVideoFromLink, MAX_VIDEO_BYTES, parseVideoLink } from '@/lib/video-link';

type GeneratedJob = {
  file: File;
  fileName: string;
  videoUrl: string;
  clips: Clip[];
};

export function ClipGenerator({ onClipsSaved }: { onClipsSaved: () => void }) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [job, setJob] = useState<GeneratedJob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!job) return;
    const { videoUrl } = job;
    return () => URL.revokeObjectURL(videoUrl);
  }, [job]);

  async function generateFrom(file: File) {
    let videoUrl: string | null = null;
    setIsGenerating(true);
    setErrorMessage(null);
    setProgressLabel('Preparing your video...');
    try {
      videoUrl = URL.createObjectURL(file);
      const clips = await generateClips(videoUrl, setProgressLabel);
      setJob({ file, fileName: file.name, videoUrl, clips });
      saveClips(clips)
        .then(onClipsSaved)
        .catch((saveError) => console.error('Could not save clips for the admin list', saveError));
    } catch (error) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong while creating your clips.');
    } finally {
      setIsGenerating(false);
      setProgressLabel('');
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseVideoLink(input);
    if (!parsed) {
      setErrorMessage('Paste a YouTube or direct .mp4 video link, or upload a video file.');
      return;
    }
    if (parsed.kind === 'loom') {
      setErrorMessage(
        "Loom links can't be processed yet. Upload the video file instead using the upload button.",
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setProgressLabel(parsed.kind === 'youtube' ? 'Fetching your YouTube video...' : 'Downloading your video...');
    try {
      const file = parsed.kind === 'youtube' ? await resolveYouTubeVideo(parsed.url) : await fetchVideoFromLink(parsed.url);
      setIsGenerating(false);
      await generateFrom(file);
    } catch (error) {
      setIsGenerating(false);
      setProgressLabel('');
      setErrorMessage(error instanceof Error ? error.message : 'We could not download a video from this link.');
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_VIDEO_BYTES) {
      setErrorMessage('This video is larger than 500 MB. Try a shorter or smaller file.');
      return;
    }
    generateFrom(file);
  }

  return (
    <section className="space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/40 md:p-8">
      <form onSubmit={handleGenerate} className="space-y-4">
        <label htmlFor="clip-source" className="block text-sm font-semibold text-zinc-200">
          Paste Your Prompt / Video Link
        </label>
        <Textarea
          id="clip-source"
          rows={4}
          value={input}
          disabled={isGenerating}
          onChange={(event) => setInput(event.target.value)}
          placeholder="https://youtube.com/watch?v=... or .mp4 link"
          className="min-h-[140px] resize-y rounded-2xl border-zinc-700 bg-zinc-950/60 p-4 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-emerald-400"
        />
        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Button
            type="submit"
            size="lg"
            disabled={isGenerating || !input.trim()}
            className="h-14 gap-2 rounded-2xl bg-emerald-500 text-base font-semibold text-zinc-950 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:text-zinc-950/70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {progressLabel || 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Unlimited Clip (No Credit Needed)
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={isGenerating}
            onClick={() => fileInputRef.current?.click()}
            className="h-14 gap-2 rounded-2xl border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <Upload className="h-5 w-5" />
            Upload MP4
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,.mp4"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </form>

      {job && (
        <ClipResults clips={job.clips} settings={DEFAULT_CLIP_SETTINGS} file={job.file} fileName={job.fileName} />
      )}
    </section>
  );
}
