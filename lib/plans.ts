export type PaidPlanId = 'pro' | 'agency';

export type PlanInfo = {
  id: PaidPlanId;
  name: string;
  price: number;
  approxPkr: number;
};

export const PAID_PLANS: Record<PaidPlanId, PlanInfo> = {
  pro: { id: 'pro', name: 'Pro', price: 10, approxPkr: 2800 },
  agency: { id: 'agency', name: 'Agency', price: 25, approxPkr: 7000 },
};
