/*
# Create payment requests, clips, and screenshot storage

1. New Tables
- `payment_requests`: one row per Nayapay payment a visitor reports.
  - `plan` (pro or agency), `amount_pkr` (2800 or 7000), `transaction_id`,
    `screenshot_path` (location of the uploaded receipt), `status`
    (pending, approved, or rejected), `created_at`, `reviewed_at`.
- `clips`: one row per generated clip shown in the admin dashboard.

2. Storage
- A private bucket `payment-screenshots` holds receipt images. Nothing is public.

3. Security
- Row level security is enabled on both tables.
- No policies are created and no anon or authenticated grants are given, so the
  browser can never read or change these tables directly.
- Only server functions using the service role can read or write them.

4. Notes
- Amounts are checked against the plan list (CHECK constraints) as a safety net.
- Re-running this migration is safe: every statement uses IF NOT EXISTS or ON CONFLICT.
*/

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL CHECK (plan IN ('pro', 'agency')),
  amount_pkr integer NOT NULL CHECK (amount_pkr IN (2800, 7000)),
  transaction_id text NOT NULL CHECK (char_length(transaction_id) BETWEEN 4 AND 64),
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS payment_requests_status_created_idx
  ON payment_requests (status, created_at DESC);

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON payment_requests TO service_role;

CREATE TABLE IF NOT EXISTS clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  emoji text NOT NULL DEFAULT '',
  viral_score integer NOT NULL DEFAULT 0 CHECK (viral_score BETWEEN 0 AND 100),
  duration_seconds numeric NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clips_created_idx ON clips (created_at DESC);

ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON clips TO service_role;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;
