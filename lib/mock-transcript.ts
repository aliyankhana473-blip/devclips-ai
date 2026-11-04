export type TranscriptLine = {
  text: string;
  keywords: string[];
};

export type MockMoment = {
  title: string;
  emoji: string;
  startRatio: number;
  viralScore: number;
  transcript: TranscriptLine[];
};

export const MOCK_MOMENTS: MockMoment[] = [
  {
    title: 'The CSS trick that finally centers everything',
    emoji: '🎯',
    startRatio: 0.08,
    viralScore: 94,
    transcript: [
      { text: 'Most developers lose hours trying to center a div.', keywords: ['center', 'div'] },
      { text: 'Here is the one CSS trick that fixes it.', keywords: ['CSS trick'] },
      { text: 'Add display grid and place items center.', keywords: ['display grid', 'place items'] },
      { text: 'Flexbox works too, but grid is cleaner.', keywords: ['grid', 'Flexbox'] },
    ],
  },
  {
    title: 'The bug that took down production',
    emoji: '🐛',
    startRatio: 0.42,
    viralScore: 91,
    transcript: [
      { text: 'This one bug cost us an entire afternoon.', keywords: ['bug'] },
      { text: 'The API returned undefined and nobody checked.', keywords: ['undefined'] },
      { text: 'One optional chain fixed it instantly.', keywords: ['optional chain'] },
      { text: 'Never trust data you did not validate.', keywords: ['validate'] },
    ],
  },
  {
    title: 'The final reveal: the app in 60 seconds',
    emoji: '🚀',
    startRatio: 0.73,
    viralScore: 88,
    transcript: [
      { text: 'And now for the final reveal.', keywords: ['final reveal'] },
      { text: 'We finally deployed the whole thing.', keywords: ['deployed', 'finally'] },
      { text: 'That damn animation runs at a smooth 60 frames.', keywords: ['60 frames'] },
      { text: 'Check the link in the description to try it.', keywords: ['link'] },
    ],
  },
];
