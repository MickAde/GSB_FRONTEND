'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Send, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getLessonPlanDetail, updateLessonPlan, deleteLessonPlan,
  submitLessonPlan, requestAIAssist,
} from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';
import type { LessonPlanPayload, LessonPlanStatus } from '@/types';

const STATUS_META: Record<LessonPlanStatus, { label: string; cls: string }> = {
  DRAFT:           { label: 'Draft',           cls: 'bg-muted text-muted-foreground' },
  SUBMITTED:       { label: 'Submitted',       cls: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW:    { label: 'Under Review',    cls: 'bg-purple-100 text-purple-700' },
  REVISION_NEEDED: { label: 'Revision Needed', cls: 'bg-amber-100 text-amber-700' },
  APPROVED:        { label: 'Approved',        cls: 'bg-green-100 text-green-700' },
};

const EDITABLE: LessonPlanStatus[] = ['DRAFT', 'REVISION_NEEDED'];

const SECTIONS: { key: keyof LessonPlanPayload; label: string; rows?: number }[] = [
  { key: 'objective',        label: 'Learning Objective',  rows: 3 },
  { key: 'materials_needed', label: 'Materials Needed',    rows: 2 },
  { key: 'introduction',     label: 'Introduction',        rows: 4 },
  { key: 'main_content',     label: 'Main Content',        rows: 6 },
  { key: 'activities',       label: 'Activities',          rows: 4 },
  { key: 'assessment',       label: 'Assessment',          rows: 3 },
  { key: 'homework',         label: 'Homework',            rows: 2 },
];

export default function LessonPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const qc      = useQueryClient();

  const [form,        setForm]        = useState<Partial<LessonPlanPayload>>({});
  const [dirty,       setDirty]       = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [showAI,      setShowAI]      = useState(false);

  const { data: plan, isLoading } = useQuery({
    queryKey: queryKeys.lessonPlans.detail(id),
    queryFn: () => getLessonPlanDetail(id),
  });

  useEffect(() => {
    if (plan && !dirty) setForm(plan as unknown as Partial<LessonPlanPayload>);
  }, [plan]);



  const updateMut = useMutation({
    mutationFn: () => updateLessonPlan(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.detail(id) });
      toast.success('Saved');
      setDirty(false);
    },
    onError: () => toast.error('Failed to save'),
  });

  const submitMut = useMutation({
    mutationFn: () => submitLessonPlan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.all() });
      toast.success('Submitted for review');
    },
    onError: () => toast.error('Failed to submit'),
  });

  const aiMut = useMutation({
    mutationFn: () => requestAIAssist(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.detail(id) });
      toast.success('AI suggestions generated');
      setShowAI(true);
    },
    onError: () => toast.error('AI assist failed. Try again.'),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLessonPlan(id);
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.all() });
      toast.success('Lesson plan deleted');
      router.push('/teacher/lesson-plans');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); setConfirmDel(false); }
  };

  if (isLoading || !plan) return <LoadingPage />;

  const isEditable = EDITABLE.includes(plan.status);
  const meta       = STATUS_META[plan.status];

  const set = (k: keyof LessonPlanPayload, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const getField = (k: keyof LessonPlanPayload): string =>
    (form[k] as string) ?? (plan[k as keyof typeof plan] as string) ?? '';

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/teacher/lesson-plans">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Lesson Plans
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{plan.title}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Updated {formatDate(plan.updated_at)}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-red-500 hover:text-red-600"
              onClick={() => setConfirmDel(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Admin comments */}
      {plan.comments && plan.comments.length > 0 && (
        <div className={`rounded-xl border p-4 space-y-2 ${
          plan.status === 'REVISION_NEEDED'
            ? 'border-amber-200 bg-amber-50'
            : plan.status === 'APPROVED'
            ? 'border-green-200 bg-green-50'
            : 'border-border bg-muted/50'
        }`}>
          <div className={`flex items-center gap-2 font-medium text-sm ${
            plan.status === 'REVISION_NEEDED' ? 'text-amber-700'
            : plan.status === 'APPROVED'      ? 'text-green-700'
            : 'text-muted-foreground'
          }`}>
            <MessageSquare className="h-4 w-4" />
            Reviewer Feedback
          </div>
          {plan.comments.map((c) => (
            <div key={c.id} className={`text-sm ${
              plan.status === 'REVISION_NEEDED' ? 'text-amber-800'
              : plan.status === 'APPROVED'      ? 'text-green-800'
              : 'text-foreground/80'
            }`}>
              <span className="font-semibold">{c.author_name}: </span>{c.body}
              <span className={`ml-2 text-xs ${
                plan.status === 'REVISION_NEEDED' ? 'text-amber-500'
                : plan.status === 'APPROVED'      ? 'text-green-500'
                : 'text-muted-foreground'
              }`}>{formatDate(c.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>Title</Label>
          {isEditable
            ? <Input value={getField('title')} onChange={(e) => set('title', e.target.value)} />
            : <p className="text-foreground font-medium">{plan.title}</p>}
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          {isEditable
            ? <Input value={getField('subject')} onChange={(e) => set('subject', e.target.value)} />
            : <p className="text-foreground/80">{plan.subject || '—'}</p>}
        </div>
        <div className="space-y-1">
          <Label>Topic</Label>
          {isEditable
            ? <Input value={getField('topic')} onChange={(e) => set('topic', e.target.value)} />
            : <p className="text-foreground/80">{plan.topic || '—'}</p>}
        </div>
        <div className="space-y-1">
          <Label>Subtopic</Label>
          {isEditable
            ? <Input value={getField('subtopic')} onChange={(e) => set('subtopic', e.target.value)} />
            : <p className="text-foreground/80">{plan.subtopic || '—'}</p>}
        </div>
        <div className="space-y-1">
          <Label>Duration (minutes)</Label>
          {isEditable
            ? <Input type="number" value={getField('duration_minutes')} onChange={(e) => set('duration_minutes', e.target.value)} />
            : <p className="text-foreground/80">{plan.duration_minutes ?? '—'}</p>}
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        {SECTIONS.map(({ key, label, rows }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            {isEditable ? (
              <Textarea
                rows={rows}
                value={getField(key)}
                onChange={(e) => set(key, e.target.value)}
                className="resize-y"
              />
            ) : (
              <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm text-foreground/80 whitespace-pre-wrap min-h-[2.5rem]">
                {(plan[key as keyof typeof plan] as string) || <span className="text-muted-foreground">—</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI suggestions */}
      {(plan.ai_suggestions || showAI) && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
            <Sparkles className="h-4 w-4" /> AI Suggestions
          </div>
          <p className="text-sm text-purple-900 whitespace-pre-wrap">{plan.ai_suggestions}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-10">
        {isEditable && (
          <>
            <Button
              variant="outline"
              className="gap-2"
              disabled={aiMut.isPending}
              onClick={() => aiMut.mutate()}
            >
              {aiMut.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Getting AI suggestions…</>
                : <><Sparkles className="h-4 w-4" /> AI Assist</>}
            </Button>
            <Button
              variant="outline"
              disabled={!dirty || updateMut.isPending}
              onClick={() => updateMut.mutate()}
            >
              {updateMut.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              className="ml-auto gap-2"
              disabled={submitMut.isPending}
              onClick={() => submitMut.mutate()}
            >
              {submitMut.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                : <><Send className="h-4 w-4" /> Submit for Review</>}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        title="Delete this lesson plan?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
