'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAdminLessonPlanDetail, reviewLessonPlan } from '@/lib/api/teaching';
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

const SECTIONS: { key: string; label: string }[] = [
  { key: 'objective',        label: 'Learning Objective' },
  { key: 'materials_needed', label: 'Materials Needed' },
  { key: 'introduction',     label: 'Introduction' },
  { key: 'main_content',     label: 'Main Content' },
  { key: 'activities',       label: 'Activities' },
  { key: 'assessment',       label: 'Assessment' },
  { key: 'homework',         label: 'Homework' },
];

const REVIEWABLE: LessonPlanStatus[] = ['SUBMITTED', 'UNDER_REVIEW'];

export default function AdminLessonPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc     = useQueryClient();

  const [comment, setComment] = useState('');

  const { data: plan, isLoading } = useQuery({
    queryKey: queryKeys.lessonPlans.detail(id),
    queryFn: () => getAdminLessonPlanDetail(id),
  });

  const reviewMut = useMutation({
    mutationFn: (action: 'approve' | 'request_revision') =>
      reviewLessonPlan(id, { action, comment: comment.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.admin() });
      toast.success('Review submitted');
      setComment('');
    },
    onError: () => toast.error('Failed to submit review'),
  });

  if (isLoading || !plan) return <LoadingPage />;

  const meta       = STATUS_META[plan.status];
  const canReview  = REVIEWABLE.includes(plan.status);

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/lesson-plans">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> All Plans
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{plan.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            By {plan.teacher_name} · Updated {formatDate(plan.updated_at)}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-4">
        {[
          { label: 'Subject',  value: plan.subject  || '—' },
          { label: 'Topic',    value: plan.topic    || '—' },
          { label: 'Subtopic', value: plan.subtopic || '—' },
          { label: 'Duration', value: plan.duration_minutes ? `${plan.duration_minutes} min` : '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-0.5 font-medium text-foreground text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {SECTIONS.map(({ key, label }) => {
          const val = plan[key as keyof typeof plan] as string;
          if (!val) return null;
          return (
            <div key={key} className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="mb-2 font-semibold text-foreground/80 text-sm">{label}</h3>
              <p className="whitespace-pre-wrap text-sm text-foreground">{val}</p>
            </div>
          );
        })}
      </div>

      {/* Previous comments */}
      {plan.comments && plan.comments.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
          <h3 className="font-semibold text-foreground/80 text-sm">Review History</h3>
          {plan.comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
              <span className="font-medium text-foreground/80">{c.author_name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
              <p className="mt-1 text-foreground/80">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Review actions */}
      {canReview && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-foreground/80">Submit Review</h3>
          <div className="space-y-1">
            <Label>Comment (optional)</Label>
            <Textarea
              rows={3}
              placeholder="Leave feedback for the teacher…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-y"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate('request_revision')}
            >
              {reviewMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <RotateCcw className="h-4 w-4" />}
              Request Revision
            </Button>
            <Button
              className="gap-2 bg-green-600 hover:bg-green-700"
              disabled={reviewMut.isPending}
              onClick={() => reviewMut.mutate('approve')}
            >
              {reviewMut.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle className="h-4 w-4" />}
              Approve
            </Button>
          </div>
        </div>
      )}

      {!canReview && (
        <div className={`rounded-xl border p-4 text-center text-sm font-medium ${
          plan.status === 'APPROVED' ? 'border-green-200 bg-green-50 text-green-700' : 'border-border bg-muted/50 text-muted-foreground'
        }`}>
          {plan.status === 'APPROVED' ? 'This plan has been approved.' : 'No action required at this time.'}
        </div>
      )}
    </div>
  );
}
