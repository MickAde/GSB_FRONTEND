'use client';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { AlertTriangle, Clock } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function TrialExpiryBanner() {
  const { data: user } = useCurrentUser();

  if (!user?.trial_expires_at) return null;

  const daysLeft = differenceInCalendarDays(parseISO(user.trial_expires_at), new Date());

  if (daysLeft > 7) return null;

  const expired = daysLeft < 0;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
      expired
        ? 'bg-destructive/10 text-destructive'
        : daysLeft <= 2
          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
          : 'bg-primary/5 text-primary'
    }`}>
      {expired
        ? <AlertTriangle className="h-4 w-4 shrink-0" />
        : <Clock className="h-4 w-4 shrink-0" />
      }
      <span>
        {expired
          ? 'Your free trial has ended. Contact support to continue.'
          : daysLeft === 0
            ? 'Your free trial expires today.'
            : `Free trial: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.`
        }
      </span>
    </div>
  );
}
