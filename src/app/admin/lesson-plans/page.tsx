'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, Clock } from 'lucide-react';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAdminLessonPlans } from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';
import type { LessonPlanStatus } from '@/types';

const STATUS_META: Record<LessonPlanStatus, { label: string; cls: string }> = {
  DRAFT:           { label: 'Draft',           cls: 'bg-muted text-muted-foreground' },
  SUBMITTED:       { label: 'Submitted',       cls: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW:    { label: 'Under Review',    cls: 'bg-purple-100 text-purple-700' },
  REVISION_NEEDED: { label: 'Revision Needed', cls: 'bg-amber-100 text-amber-700' },
  APPROVED:        { label: 'Approved',        cls: 'bg-green-100 text-green-700' },
};

const REVIEW_STATUSES: LessonPlanStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

export default function AdminLessonPlansPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.lessonPlans.admin(),
    queryFn: () => getAdminLessonPlans(),
  });

  if (isLoading) return <LoadingPage />;

  const plans = data ?? [];
  const needsReview = plans.filter((p) => REVIEW_STATUSES.includes(p.status)).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Lesson Plan Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {plans.length} plan{plans.length !== 1 ? 's' : ''} submitted
          {needsReview > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {needsReview} need{needsReview !== 1 ? '' : 's'} review
            </span>
          )}
        </p>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center text-muted-foreground">
          <ClipboardCheck className="h-10 w-10" />
          <p>No submitted lesson plans yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const meta = STATUS_META[p.status];
            return (
              <Link key={p.id} href={`/admin/lesson-plans/${p.id}`}>
                <div className="flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{p.title}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      {p.subject && <span>{p.subject}</span>}
                      {p.topic   && <span>· {p.topic}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground ml-4">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDate(p.updated_at)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
