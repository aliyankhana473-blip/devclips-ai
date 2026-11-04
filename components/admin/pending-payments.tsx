'use client';

import { useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reviewPayment, type AdminPendingPayment } from '@/lib/api';
import { PAID_PLANS } from '@/lib/plans';

const currency = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
});

export function PendingPayments({
  adminKey,
  payments,
  onReviewed,
}: {
  adminKey: string;
  payments: AdminPendingPayment[];
  onReviewed: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleReview(id: string, decision: 'approved' | 'rejected') {
    setBusyId(id);
    setErrorMessage(null);
    try {
      await reviewPayment(adminKey, id, decision);
      onReviewed();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save your decision.');
    } finally {
      setBusyId(null);
    }
  }

  if (payments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
        No pending payments right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}
      {payments.map((payment) => {
        const isBusy = busyId === payment.id;
        return (
          <article
            key={payment.id}
            className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:grid-cols-[160px_1fr] sm:p-5"
          >
            {payment.screenshotUrl ? (
              <a href={payment.screenshotUrl} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-xl border border-zinc-800">
                <img
                  src={payment.screenshotUrl}
                  alt={`Receipt for transaction ${payment.transactionId}`}
                  className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-zinc-950/80 px-2 py-1 text-xs text-zinc-200">
                  <ExternalLink className="h-3 w-3" />
                  Open
                </span>
              </a>
            ) : (
              <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-xs text-zinc-500">
                No screenshot
              </div>
            )}

            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-900">
                    {PAID_PLANS[payment.plan].name}
                  </span>
                  <span className="text-lg font-semibold text-zinc-50">{currency.format(payment.amountPkr)}</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Transaction ID{' '}
                  <span className="font-mono text-zinc-100">{payment.transactionId}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  Submitted {new Date(payment.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleReview(payment.id, 'approved')}
                  disabled={isBusy}
                  className="gap-2 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReview(payment.id, 'rejected')}
                  disabled={isBusy}
                  variant="outline"
                  className="gap-2 rounded-xl border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10 hover:text-red-200"
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
