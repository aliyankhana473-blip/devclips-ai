'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, ImageUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { submitPayment } from '@/lib/api';
import { PAID_PLANS, type PaidPlanId } from '@/lib/plans';

const NAYAPAY_NUMBER = '03192341427';
const MIN_TRANSACTION_ID_LENGTH = 4;

export function PaymentModal({ plan, onClose }: { plan: PaidPlanId; onClose: () => void }) {
  const info = PAID_PLANS[plan];
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTransactionId = transactionId.trim();

    if (trimmedTransactionId.length < MIN_TRANSACTION_ID_LENGTH) {
      setError('Please enter the transaction ID from your payment app.');
      return;
    }
    if (!screenshot) {
      setError('Please upload a screenshot of your receipt.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitPayment(plan, trimmedTransactionId, screenshot);
      setIsSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-200 bg-white text-black sm:max-w-md">
        {isSubmitted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-bold text-black">Payment received</DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm leading-relaxed text-black">
              <Clock className="h-4 w-4 shrink-0 text-green-700" />
              Payment verification in 1 hour - You will get {info.name} access
            </DialogDescription>
            <Button onClick={onClose} className="mt-2 h-11 w-full rounded-xl bg-black font-semibold text-white hover:bg-zinc-800">
              Back to DevClips
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-black">Pay with Nayapay</DialogTitle>
              <DialogDescription className="sr-only">
                Send the payment to the Nayapay number below, then enter your transaction details.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 space-y-2 text-center">
              <p className="text-sm font-medium text-black">Nayapay Number</p>
              <p className="text-4xl font-extrabold tracking-wide text-green-600 sm:text-5xl">{NAYAPAY_NUMBER}</p>
              <p className="text-base font-semibold text-black">
                {PAID_PLANS.pro.approxPkr} PKR for Pro / {PAID_PLANS.agency.approxPkr} PKR for Agency
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-id" className="text-black">
                  Transaction ID
                </Label>
                <Input
                  id="transaction-id"
                  value={transactionId}
                  onChange={(event) => setTransactionId(event.target.value)}
                  placeholder="e.g. 8F3K2P9X"
                  className="h-11 border-zinc-300 bg-white text-black placeholder:text-zinc-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-screenshot" className="text-black">
                  Screenshot Upload
                </Label>
                <label
                  htmlFor="payment-screenshot"
                  className="flex h-11 cursor-pointer items-center gap-3 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-600 transition hover:border-black hover:text-black"
                >
                  <ImageUp className="h-4 w-4 shrink-0" />
                  <span className="truncate">{screenshot?.name ?? 'Choose an image of your receipt'}</span>
                </label>
                <input
                  id="payment-screenshot"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl bg-black font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-600"
              >
                {isSubmitting ? 'Sending...' : 'I Have Paid - Verify'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
