import { Scissors } from 'lucide-react';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="flex items-center gap-2 font-bold tracking-tight text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-300 text-zinc-950">
            <Scissors className="h-4 w-4" />
          </span>
          DevClips AI
        </a>
        <div className="flex items-center gap-6 text-sm font-medium text-zinc-300">
          <a href="#create" className="transition hover:text-white">
            Create clips
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </div>
      </nav>
    </header>
  );
}
