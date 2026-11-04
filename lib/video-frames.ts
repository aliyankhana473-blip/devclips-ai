const VERTICAL_WIDTH = 540;
const VERTICAL_HEIGHT = 960;
const VERTICAL_RATIO = 9 / 16;

export function openVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('This video could not be opened. Try an MP4 file.'));
    video.src = url;
  });
}

export function releaseVideo(video: HTMLVideoElement) {
  video.removeAttribute('src');
  video.load();
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('Could not read a frame from this video.'));
    video.currentTime = time;
  });
}

export async function captureVerticalFrame(video: HTMLVideoElement, time: number): Promise<string> {
  await seekTo(video, Math.max(0, Math.min(time, video.duration - 0.1)));

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceWidth / sourceHeight > VERTICAL_RATIO) {
    cropWidth = sourceHeight * VERTICAL_RATIO;
  } else {
    cropHeight = sourceWidth / VERTICAL_RATIO;
  }

  const canvas = document.createElement('canvas');
  canvas.width = VERTICAL_WIDTH;
  canvas.height = VERTICAL_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare the preview.');

  context.drawImage(
    video,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    0,
    0,
    VERTICAL_WIDTH,
    VERTICAL_HEIGHT,
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}
