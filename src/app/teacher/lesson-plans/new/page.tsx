'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLessonPlan } from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import type { LessonPlanPayload } from '@/types';

const SECTIONS: { key: keyof LessonPlanPayload; label: string; rows?: number }[] = [
  { key: 'objective',        label: 'Learning Objective',  rows: 3 },
  { key: 'materials_needed', label: 'Materials Needed',    rows: 2 },
  { key: 'introduction',     label: 'Introduction',        rows: 4 },
  { key: 'main_content',     label: 'Main Content',        rows: 6 },
  { key: 'activities',       label: 'Activities',          rows: 4 },
  { key: 'assessment',       label: 'Assessment',          rows: 3 },
  { key: 'homework',         label: 'Homework',            rows: 2 },
];

export default function NewLessonPlanPage() {
  const router = useRouter();
  const qc     = useQueryClient();

  const [form, setForm] = useState<Partial<LessonPlanPayload>>({ title: '' });

  const set = (k: keyof LessonPlanPayload, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: () => createLessonPlan(form as LessonPlanPayload),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: queryKeys.lessonPlans.all() });
      toast.success('Lesson plan created');
      router.push(`/teacher/lesson-plans/${plan.id}`);
    },
    onError: () => toast.error('Failed to create lesson plan'),
  });

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/teacher/lesson-plans">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Lesson Plans
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">New Lesson Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Fill in what you have — you can save as draft and edit later.</p>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border bg-card p-5 shadow-sm sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>Title <span className="text-red-500">*</span></Label>
          <Input
            value={form.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Introduction to Photosynthesis"
          />
        </div>
        <div className="space-y-1">
          <Label>Subject</Label>
          <Input value={form.subject ?? ''} onChange={(e) => set('subject', e.target.value)} placeholder="e.g. Biology" />
        </div>
        <div className="space-y-1">
          <Label>Topic</Label>
          <Input value={form.topic ?? ''} onChange={(e) => set('topic', e.target.value)} placeholder="e.g. Plant Cells" />
        </div>
        <div className="space-y-1">
          <Label>Subtopic</Label>
          <Input value={form.subtopic ?? ''} onChange={(e) => set('subtopic', e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={1}
            value={form.duration_minutes ?? ''}
            onChange={(e) => set('duration_minutes', e.target.value)}
            placeholder="e.g. 45"
          />
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        {SECTIONS.map(({ key, label, rows }) => (
          <div key={key} className="space-y-1">
            <Label>{label}</Label>
            <Textarea
              rows={rows}
              value={(form[key] as string) ?? ''}
              onChange={(e) => set(key, e.target.value)}
              placeholder={`Write your ${label.toLowerCase()} here…`}
              className="resize-y"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pb-10">
        <Link href="/teacher/lesson-plans">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          disabled={!form.title?.trim() || isPending}
          onClick={() => mutate()}
        >
          {isPending ? 'Saving…' : 'Save as Draft'}
        </Button>
      </div>
    </div>
  );
}
