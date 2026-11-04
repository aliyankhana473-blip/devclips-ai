'use client';

import { useRef, useState, type DragEvent } from 'react';
import { CheckCircle2, FileVideo, Link2, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CLIP_OPTIONS, DEFAULT_CLIP_SETTINGS, type ClipSettings } from '@/lib/clip-config';
import { MAX_VIDEO_BYTES, parseVideoLink, type ClipSource } from '@/lib/video-link';
import { cn } from '@/lib/utils';
import { TemplateSelector } from './template-selector';

function isMp4(file: File) {
  return file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
}

export function ClipCreator({
  isProcessing,
  progressLabel,
  onGenerate,
}: {
  isProcessing: boolean;
  progressLabel: string;
  onGenerate: (source: ClipSource, settings: ClipSettings) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'link' | 'upload'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [linkInput, setLinkInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ClipSettings>(DEFAULT_CLIP_SETTINGS);

  const parsedLink = parseVideoLink(linkInput);
  const linkNotice = !linkInput.trim()
    ? null
    : !parsedLink
      ? 'Paste a YouTube or direct .mp4 link.'
      : parsedLink.kind === 'loom'
        ? "Loom links aren't supported yet. Upload the MP4 file instead."
        : null;

  const source: ClipSource | null =
    tab === 'link'
      ? parsedLink?.kind === 'mp4'
        ? { kind: 'link', url: parsedLink.url }
        : parsedLink?.kind === 'youtube'
          ? { kind: 'youtube', url: parsedLink.url }
          : null
      : file
        ? { kind: 'file', file }
        : null;

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!isMp4(candidate)) {
      setFileError('Please choose an MP4 video.');
      return;
    }
    if (candidate.size > MAX_VIDEO_BYTES) {
      setFileError('This video is larger than 500 MB. Try a shorter or smaller file.');
      return;
    }
    setFileError(null);
    setFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files[0]);
  }

  function toggleOption(key: keyof Omit<ClipSettings, 'templateId'>, checked: boolean) {
    setSettings((current) => ({ ...current, [key]: checked }));
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
      <div className="space-y-8">
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'link' | 'upload')}>
          <TabsList className="grid h-12 w-full grid-cols-2 gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
            <TabsTrigger
              value="link"
              className="h-10 rounded-lg text-sm font-semibold text-zinc-400 transition data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-none"
            >
              1. Paste YouTube Link
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="h-10 rounded-lg text-sm font-semibold text-zinc-400 transition data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 data-[state=active]:shadow-none"
            >
              2. Upload MP4 File
            </TabsTrigger>
          </TabsList>

          <p className="-mt-4 text-center text-sm text-emerald-400">
            YouTube link supported
          </p>

          <TabsContent value="link" className="mt-6 space-y-3">
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                aria-label="Paste YouTube, Loom, or .mp4 link"
                placeholder="Paste YouTube / Loom / .mp4 link"
                value={linkInput}
                disabled={isProcessing}
                onChange={(event) => setLinkInput(event.target.value)}
                className="h-14 rounded-2xl border-zinc-700 bg-zinc-950/60 pl-11 text-base text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-yellow-300"
              />
            </div>
            {linkNotice && (
              <p role="alert" className="flex items-start gap-2 text-sm text-amber-300">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                {linkNotice}
              </p>
            )}
          </TabsContent>

          <TabsContent value="upload" className="mt-6 space-y-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload an MP4 video"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'group flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition duration-200',
                isDragging
                  ? 'border-yellow-300 bg-yellow-300/5 scale-[1.01]'
                  : 'border-zinc-700 bg-zinc-950/60 hover:border-zinc-500 hover:bg-zinc-900',
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,.mp4"
                className="hidden"
                onChange={(event) => {
                  acceptFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              {file ? (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center justify-center gap-2 font-semibold text-zinc-100">
                      <FileVideo className="h-4 w-4 text-zinc-400" />
                      {file.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB - click to choose another
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-300 transition group-hover:scale-110 group-hover:text-yellow-300">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-100">Drag and drop your MP4 here</p>
                    <p className="text-sm text-zinc-400">or click to browse your files</p>
                  </div>
                </>
              )}
            </div>

            {fileError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-400">
                <X className="h-4 w-4" />
                {fileError}
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-300">
          <span className="rounded-full border border-zinc-700 px-3 py-1">Ratio: 9:16</span>
          <span className="rounded-full border border-zinc-700 px-3 py-1">Clip length: Any length</span>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Template</h3>
          <TemplateSelector
            value={settings.templateId}
            onChange={(templateId) => setSettings((current) => ({ ...current, templateId }))}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CLIP_OPTIONS.map((option) => {
            const id = `option-${option.key}`;
            return (
              <div
                key={option.key}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 transition hover:border-zinc-700"
              >
                <Checkbox
                  id={id}
                  checked={settings[option.key]}
                  onCheckedChange={(checked) => toggleOption(option.key, checked === true)}
                  className="border-zinc-600 data-[state=checked]:bg-yellow-300 data-[state=checked]:text-black"
                />
                <Label htmlFor={id} className="cursor-pointer text-sm font-medium text-zinc-200">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          size="lg"
          disabled={!source || isProcessing}
          onClick={() => source && onGenerate(source, settings)}
          className="h-14 w-full gap-2 rounded-2xl bg-violet-600 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 active:scale-[0.99] disabled:bg-violet-600/40 disabled:text-white/70"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {progressLabel || 'Creating clips...'}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              {tab === 'link' ? 'Generate Clips from Link' : 'Get AI clips'}
            </>
          )}
        </Button>
        {!source && !isProcessing && (
          <p className="-mt-4 text-center text-sm text-zinc-500">
            {tab === 'link'
              ? 'Paste a YouTube or direct MP4 link to enable clip generation.'
              : 'Upload an MP4 to enable clip generation.'}
          </p>
        )}
      </div>
    </div>
  );
}
