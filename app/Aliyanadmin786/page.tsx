'use client';

import { useEffect, useState } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);

  useEffect(() => {
    setAdminKey(new URLSearchParams(window.location.search).get('key') ?? '');
  }, []);

  if (adminKey === null) return <div className="min-h-screen bg-zinc-950" />;
  return <AdminDashboard adminKey={adminKey} />;
}
