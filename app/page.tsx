'use client';

import { useEffect, useState } from 'react';
import { ClipCreator } from '@/components/clipper/clip-creator';
import { ClipResults } from '@/components/clipper/clip-results';
import { Hero } from '@/components/landing/hero';
import { Navbar } from '@/components/landing/navbar';
import { PricingSection } from '@/components/landing/pricing-section';
import { PaymentModal } from '@/components/payment/payment-modal';
import type { ClipSettings } from '@/lib/clip-config';
import { generateClips, type Clip } from '@/lib/clip-generator';
import { saveClips } from '@/lib/api';
import type { PaidPlanId } from '@/lib/plans';
import { fetchVideoFromLink, getVideoFromLink, type ClipSource } from '@/lib/video-link';
import { resolveYouTubeVideo } from '@/lib/api';

type ClipJob = {
  file: File;
  fileName: string;
  videoUrl: string;
  settings: ClipSettings;
  clips: Clip[];
};

export default function Home() {
  const [job, setJob] = useState<ClipJob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentPlan, setPaymentPlan] = useState<PaidPlanId | null>(null);

  useEffect(() => {
    if (!job) return;
    const videoUrl = job.videoUrl;
    return () => URL.revokeObjectURL(videoUrl);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [job]);

  async function handleGenerate(source: ClipSource, settings: ClipSettings) {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressLabel(
      source.kind === 'youtube'
        ? 'Fetching your YouTube video...'
        : source.kind === 'link'
          ? 'Downloading your video...'
          : 'Preparing your video...',
    );
    let videoUrl: string | null = null;
    try {
      const file =
        source.kind === 'file'
          ? source.file
          : source.kind === 'youtube'
            ? await resolveYouTubeVideo(source.url)
            : await fetchVideoFromLink(source.url);
      videoUrl = URL.createObjectURL(file);
      const clips = await generateClips(videoUrl, setProgressLabel);
      saveClips(clips).catch((saveError) => console.error('Could not save clips for the admin list', saveError));
      setJob({ file, fileName: file.name, videoUrl, settings, clips });
    } catch (error) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong while creating your clips.',
      );
    } finally {
      setIsProcessing(false);
      setProgressLabel('');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <Navbar />
      <main>
        <Hero />

        <section id="create" className="scroll-mt-24 px-6 pb-8">
          <div className="mx-auto max-w-3xl">
            <ClipCreator
              isProcessing={isProcessing}
              progressLabel={progressLabel}
              onGenerate={handleGenerate}
            />
            {errorMessage && (
              <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </p>
            )}
          </div>
        </section>

        {job && (
          <ClipResults
            clips={job.clips}
            settings={job.settings}
            file={job.file}
            fileName={job.fileName}
          />
        )}

        <PricingSection onSelectPlan={setPaymentPlan} />
      </main>

      <footer className="border-t border-zinc-800 px-6 py-10 text-center text-sm text-zinc-500">
        <p>DevClips AI - Clips for web developers</p>
      </footer>

      {paymentPlan && (
        <PaymentModal key={paymentPlan} plan={paymentPlan} onClose={() => setPaymentPlan(null)} />
      )}
    </div>
  );
}
