import { Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden px-6 pb-12 pt-20 text-center md:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,_rgba(250,204,21,0.12),_transparent_60%)]" />
      <div className="mx-auto max-w-4xl">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-300">
          <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
          AI video clipper built for web developers
        </p>
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
          Turn Long Web Development Tutorials into{' '}
          <span className="bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
            Viral Shorts in 1 Click
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
          AI finds best moments - CSS tricks, bug fixes, final reveals
        </p>
      </div>
    </section>
  );
}
