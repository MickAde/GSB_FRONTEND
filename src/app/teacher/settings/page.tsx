'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import {
  getTeacherThresholds,
  upsertTeacherThreshold,
  updateTeacherThreshold,
  deleteTeacherThreshold,
} from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { QuizDifficulty, TeacherSubjectThreshold } from '@/types';

const DIFF_OPTIONS: { value: QuizDifficulty; label: string }[] = [
  { value: 'easy',      label: 'Easy'      },
  { value: 'moderate',  label: 'Moderate'  },
  { value: 'difficult', label: 'Difficult' },
];

const DIFF_LABELS: Record<QuizDifficulty, string> = {
  easy: 'Easy', moderate: 'Moderate', difficult: 'Difficult',
};

function ThresholdRow({
  threshold,
  onDelete,
}: {
  threshold: TeacherSubjectThreshold;
  onDelete: (id: string) => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [minQ,    setMinQ]    = useState(threshold.min_questions);
  const [minD,    setMinD]    = useState<QuizDifficulty>(threshold.min_difficulty);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => updateTeacherThreshold(threshold.id, { min_questions: minQ, min_difficulty: minD }),
    onSuccess: (data) => {
      qc.setQueryData<TeacherSubjectThreshold[]>(
        queryKeys.quiz.teacherThresholds(),
        (prev) => prev?.map((t) => (t.id === data.id ? data : t)) ?? [data],
      );
      setEditing(false);
      toast.success('Threshold updated.');
    },
    onError: () => toast.error('Failed to update.'),
  });

  if (editing) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5">
        <span className="text-sm font-medium text-foreground flex-1">{threshold.subject}</span>
        <Input
          type="number"
          min={1}
          max={50}
          value={minQ}
          onChange={(e) => setMinQ(Number(e.target.value))}
          className="w-20 h-8 text-center text-sm rounded-lg"
        />
        <Select value={minD} onValueChange={(v) => setMinD(v as QuizDifficulty)}>
          <SelectTrigger className="w-32 h-8 text-sm rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFF_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="ghost" onClick={() => save()} disabled={saving} className="h-8 w-8 p-0">
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 w-8 p-0">
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
      <span className="text-sm font-medium text-foreground flex-1">{threshold.subject}</span>
      <span className="text-xs text-muted-foreground">≥ {threshold.min_questions} questions</span>
      <span className="text-xs text-muted-foreground">{DIFF_LABELS[threshold.min_difficulty]}+</span>
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)} className="h-8 w-8 p-0">
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onDelete(threshold.id)} className="h-8 w-8 p-0">
        <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
      </Button>
    </div>
  );
}

export default function TeacherSettingsPage() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState('');
  const [minQ,    setMinQ]    = useState(5);
  const [minD,    setMinD]    = useState<QuizDifficulty>('easy');

  const { data: thresholds = [], isLoading } = useQuery({
    queryKey: queryKeys.quiz.teacherThresholds(),
    queryFn:  getTeacherThresholds,
    staleTime: 30_000,
  });

  const { mutate: addThreshold, isPending: adding } = useMutation({
    mutationFn: () => upsertTeacherThreshold({ subject: subject.trim(), min_questions: minQ, min_difficulty: minD }),
    onSuccess: (data) => {
      qc.setQueryData<TeacherSubjectThreshold[]>(
        queryKeys.quiz.teacherThresholds(),
        (prev) => {
          if (!prev) return [data];
          const idx = prev.findIndex((t) => t.id === data.id);
          return idx >= 0 ? prev.map((t) => (t.id === data.id ? data : t)) : [...prev, data];
        },
      );
      setSubject('');
      setMinQ(5);
      setMinD('easy');
      toast.success(`Threshold set for ${data.subject}.`);
    },
    onError: () => toast.error('Failed to save threshold.'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: deleteTeacherThreshold,
    onSuccess: (_, id) => {
      qc.setQueryData<TeacherSubjectThreshold[]>(
        queryKeys.quiz.teacherThresholds(),
        (prev) => prev?.filter((t) => t.id !== id) ?? [],
      );
      toast.success('Threshold removed.');
    },
    onError: () => toast.error('Failed to remove.'),
  });

  if (isLoading) return <LoadingPage />;

  const canAdd = subject.trim().length > 0 && minQ >= 1;

  return (
    <div className="max-w-xl space-y-8">
      <PageHeader
        title="Settings"
        description="Set minimum quiz requirements for your subject areas."
      />

      <section className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Quiz Thresholds</h2>
        </div>

        <p className="text-sm text-muted-foreground">
          Define the minimum number of questions and difficulty level students must use when
          generating quizzes from notes in your subject areas.
        </p>

        {/* Add form */}
        <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add / Update a subject</p>
          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Input
              placeholder="e.g. Biology, Mathematics…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Min Questions</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={minQ}
                onChange={(e) => setMinQ(Number(e.target.value))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Min Difficulty</Label>
              <Select value={minD} onValueChange={(v) => setMinD(v as QuizDifficulty)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFF_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => addThreshold()}
            disabled={!canAdd || adding}
            className="w-full rounded-xl font-semibold"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {adding ? 'Saving…' : 'Save Threshold'}
          </Button>
        </div>

        {/* Existing thresholds */}
        {thresholds.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {thresholds.map((t) => (
              <ThresholdRow key={t.id} threshold={t} onDelete={(id) => remove(id)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No thresholds set yet. Add a subject above to get started.
          </p>
        )}
      </section>
    </div>
  );
}
