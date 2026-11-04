import { MOCK_MOMENTS, type TranscriptLine } from './mock-transcript';
import { captureVerticalFrame, openVideo, releaseVideo } from './video-frames';

export type Clip = {
  id: string;
  title: string;
  emoji: string;
  viralScore: number;
  start: number;
  duration: number;
  thumbnail: string;
  transcript: TranscriptLine[];
};

const MAX_CLIP_SECONDS = 40;
const MIN_CLIP_SECONDS = 5;
const STEP_DELAY_MS = 700;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateClips(
  videoUrl: string,
  onStep: (label: string) => void,
): Promise<Clip[]> {
  onStep('Listening to the audio...');
  await wait(STEP_DELAY_MS);

  const video = await openVideo(videoUrl);
  try {
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('We could not read the length of this video. Try a different MP4 file.');
    }

    onStep('Finding the most viral moments...');
    await wait(STEP_DELAY_MS);

    const clipLength = Math.min(
      duration,
      Math.min(MAX_CLIP_SECONDS, Math.max(MIN_CLIP_SECONDS, duration * 0.3)),
    );

    onStep('Rendering vertical previews...');
    const clips: Clip[] = [];
    for (let index = 0; index < MOCK_MOMENTS.length; index++) {
      const moment = MOCK_MOMENTS[index];
      const start = Math.max(0, Math.min(duration * moment.startRatio, duration - clipLength));
      const thumbnail = await captureVerticalFrame(video, start + clipLength / 3);
      clips.push({
        id: `clip-${index + 1}`,
        title: moment.title,
        emoji: moment.emoji,
        viralScore: moment.viralScore,
        start,
        duration: clipLength,
        thumbnail,
        transcript: moment.transcript,
      });
    }
    return clips;
  } finally {
    releaseVideo(video);
  }
}
