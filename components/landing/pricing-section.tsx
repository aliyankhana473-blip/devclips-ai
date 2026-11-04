'use client';

import { Check } from 'lucide-react';
import { PAID_PLANS, type PaidPlanId } from '@/lib/plans';
import { cn } from '@/lib/utils';

type PricingTier = {
  id: 'free' | PaidPlanId;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try DevClips on your first tutorials.',
    features: ['3 clips per month', 'Exports include a watermark'],
    cta: 'Start for free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: `$${PAID_PLANS.pro.price}`,
    period: '/month',
    description: 'For creators posting clips every week.',
    features: [
      '50 clips',
      'No watermark',
      '1080p export',
      'Mr. Beast captions',
    ],
    cta: `Buy Pro - $${PAID_PLANS.pro.price}`,
    highlighted: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: `$${PAID_PLANS.agency.price}`,
    period: '/month',
    description: 'For teams running channels at volume.',
    features: ['200 clips', 'B-rolls included'],
    cta: 'Buy Agency',
  },
];

export function PricingSection({ onSelectPlan }: { onSelectPlan: (plan: PaidPlanId) => void }) {
  return (
    <section id="pricing" className="scroll-mt-20 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-50 md:text-4xl">Simple Pricing</h2>
          <p className="mt-4 text-zinc-400">Start free, upgrade when your channel takes off.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-3xl border p-8 transition duration-300 hover:-translate-y-1',
                tier.highlighted
                  ? 'border-yellow-300/60 bg-zinc-900 shadow-2xl shadow-yellow-300/10'
                  : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700',
              )}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-8 rounded-full bg-yellow-300 px-3 py-1 text-xs font-bold uppercase tracking-wide text-zinc-950">
                  Best seller
                </span>
              )}
              <h3 className="text-lg font-semibold text-zinc-100">{tier.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-zinc-50">{tier.price}</span>
                <span className="text-sm text-zinc-400">{tier.period}</span>
              </p>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => {
                  if (tier.id === 'free') {
                    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    onSelectPlan(tier.id);
                  }
                }}
                className={cn(
                  'mt-8 h-12 rounded-xl text-sm font-semibold transition active:scale-[0.98]',
                  tier.highlighted
                    ? 'bg-yellow-300 text-zinc-950 hover:bg-yellow-200'
                    : 'border border-zinc-700 text-zinc-100 hover:bg-zinc-800',
                )}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
