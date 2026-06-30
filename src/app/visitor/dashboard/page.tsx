'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DailyContentBanner } from '@/components/common/DailyContentBanner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDate } from '@/lib/utils';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';

export default function VisitorDashboardPage() {
  const { data: user } = useCurrentUser();
  const greeting = useTimeGreeting();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          {greeting && (
            <p className="text-sm font-medium text-muted-foreground">{greeting.text} {greeting.emoji}</p>
          )}
          <h1 className="mt-0.5 text-3xl font-bold font-display text-foreground">
            Hey, {user?.first_name ?? '…'}!
          </h1>
          <p className="mt-1 text-muted-foreground">Welcome to your visitor trial.</p>
        </div>
        <Link href="/visitor/notes/upload">
          <Button className="bg-primary hover:bg-primary/90">Upload Note</Button>
        </Link>
      </div>

      {user?.trial_expires_at && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Your free trial expires on <strong>{formatDate(user.trial_expires_at)}</strong>.
          Contact a school administrator to get a full account.
        </div>
      )}

      <DailyContentBanner />
    </div>
  );
}
