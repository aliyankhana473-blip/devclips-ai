'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock3, Film, RefreshCw, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, fetchAdminOverview, type AdminOverview } from '@/lib/api';
import { ClipGenerator } from './clip-generator';
import { ClipsList } from './clips-list';
import { PendingPayments } from './pending-payments';

type ViewState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminOverview };

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export function AdminDashboard({ adminKey }: { adminKey: string }) {
  const [view, setView] = useState<ViewState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchAdminOverview(adminKey);
      setView({ status: 'ready', data });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setView({ status: 'denied' });
      } else {
        setView({
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not load the dashboard.',
        });
      }
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  function refresh() {
    setIsRefreshing(true);
    load().finally(() => setIsRefreshing(false));
  }

  if (view.status === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-center">
        <div>
          <p className="text-6xl font-bold text-zinc-700">404</p>
          <p className="mt-3 text-sm text-zinc-500">This page could not be found.</p>
        </div>
      </div>
    );
  }

  if (view.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">
        Loading dashboard...
      </div>
    );
  }

  if (view.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-6 text-center">
        <p className="text-sm text-red-300">{view.message}</p>
        <Button onClick={refresh} className="rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white">
          Try again
        </Button>
      </div>
    );
  }

  const { data } = view;
  const stats = [
    {
      label: 'Total Revenue',
      value: currency.format(data.totalRevenuePkr),
      hint: `${data.approvedCount} approved ${data.approvedCount === 1 ? 'payment' : 'payments'}`,
      icon: Wallet,
    },
    {
      label: 'Pending Payments',
      value: String(data.pending.length),
      hint: 'Waiting for review',
      icon: Clock3,
    },
    {
      label: 'Clips Generated',
      value: String(data.clips.length),
      hint: 'Most recent 200 shown',
      icon: Film,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">DevClips</p>
            <h1 className="mt-1 text-3xl font-bold text-zinc-50">Aliyan Admin - Unlimited Clips</h1>
          </div>
          <Button
            onClick={refresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2 rounded-xl border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50"
          >
            <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Refresh
          </Button>
        </header>

        <ClipGenerator onClipsSaved={refresh} />

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
                <stat.icon className="h-5 w-5 text-zinc-500" />
              </div>
              <p className="mt-3 text-3xl font-bold text-zinc-50">{stat.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{stat.hint}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Pending Nayapay payments</h2>
            <p className="text-sm text-zinc-500">Payments sent to 03192341427. Approve only after checking the transaction.</p>
          </div>
          <PendingPayments adminKey={adminKey} payments={data.pending} onReviewed={refresh} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-50">All generated clips</h2>
          <ClipsList clips={data.clips} />
        </section>
      </div>
    </div>
  );
}
