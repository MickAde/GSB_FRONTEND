'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Brain, PenLine, ChevronRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { createLessonDoc } from '@/lib/api/teaching';
import { STANDARD_SUBJECTS } from '@/lib/subjects';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LessonDocType, GenerationMode, CurriculumType } from '@/types';

const CURRICULUM_LABELS: Record<CurriculumType, string> = {
  nerdc:       'NERDC (Nigerian)',
  british:     'British / Cambridge',
  american:    'American / Common Core',
  blend_ng_uk: 'Nigeria + British Blend',
  blend_ng_us: 'Nigeria + American Blend',
};

const schema = z.object({
  doc_type:           z.enum(['plan', 'note']),
  generation_mode:    z.enum(['ai', 'manual']),
  subject:            z.string().min(1, 'Subject is required'),
  topic:              z.string().min(2, 'Topic is required'),
  subtopic:           z.string().optional(),
  term:               z.number().min(1).max(3),
  week:               z.number().min(1).max(12),
  additional_context: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateLessonDocPage() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const curriculumType: CurriculumType = (user?.school as any)?.curriculum_type ?? 'nerdc';
  const teacherClass = user?.student_class_name ?? null;

  const [step, setStep] = useState<'mode' | 'form'>('mode');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      doc_type: 'plan',
      generation_mode: 'ai',
      term: 1,
      week: 1,
      subject: '',
      topic: '',
      subtopic: '',
      additional_context: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createLessonDoc,
    onSuccess: (doc) => {
      toast.success(
        doc.generation_mode === 'ai'
          ? 'Generating your document… this takes about 30 seconds.'
          : 'Document created. Start writing!'
      );
      router.push(`/teacher/lesson-docs/${doc.id}`);
    },
    onError: () => toast.error('Failed to create document. Please try again.'),
  });

  const onSubmit = (values: FormValues) => {
    mutate({ ...values, subtopic: values.subtopic ?? '' });
  };

  const docType = form.watch('doc_type');
  const genMode = form.watch('generation_mode');

  if (step === 'mode') {
    return (
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">New Lesson Document</h1>
        </div>

        {/* Doc type */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Document Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['plan', 'note'] as LessonDocType[]).map((t) => (
              <button
                key={t}
                onClick={() => form.setValue('doc_type', t)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all',
                  docType === t ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', t === 'plan' ? 'bg-blue-100' : 'bg-purple-100')}>
                  {t === 'plan' ? <PenLine className="h-5 w-5 text-blue-600" /> : <Brain className="h-5 w-5 text-purple-600" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t === 'plan' ? 'Lesson Plan' : 'Lesson Note'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t === 'plan'
                      ? 'Teaching steps, entry behaviour, evaluation — for you to follow in class.'
                      : 'Student-facing content distributed to your class on approval.'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Generation mode */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">How do you want to create it?</h2>
          <div className="grid grid-cols-2 gap-3">
            {([
              { mode: 'ai',     icon: Brain,   label: 'Generate with AI', desc: 'Describe the topic — AI writes the full document for you.' },
              { mode: 'manual', icon: PenLine, label: 'Write Manually',   desc: 'Start with a blank template and fill in each section.' },
            ] as { mode: GenerationMode; icon: React.ElementType; label: string; desc: string }[]).map(({ mode, icon: Icon, label, desc }) => (
              <button
                key={mode}
                onClick={() => form.setValue('generation_mode', mode)}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition-all',
                  genMode === mode ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/30'
                )}
              >
                <Icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p>Curriculum: <span className="font-semibold text-foreground">{CURRICULUM_LABELS[curriculumType]}</span> <span className="text-muted-foreground/60">(set by admin)</span></p>
          <p>
            Class:{' '}
            {teacherClass ? (
              <span className="font-semibold text-foreground">{teacherClass}</span>
            ) : (
              <span className="text-red-500 font-medium">Not assigned — contact your admin</span>
            )}
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            className="gradient-primary gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90"
            disabled={!teacherClass}
            onClick={() => setStep('form')}
          >
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Step: form
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setStep('mode')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {docType === 'plan' ? 'Lesson Plan' : 'Lesson Note'} Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {genMode === 'ai' ? 'AI will generate the full document from these details.' : 'Fill in the context, then write your content.'}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Subject */}
        <div className="space-y-1.5">
          <Label>Subject *</Label>
          <select
            {...form.register('subject')}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select subject…</option>
            {STANDARD_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {form.formState.errors.subject && (
            <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
          )}
        </div>

        {/* Topic */}
        <div className="space-y-1.5">
          <Label>Topic *</Label>
          <Input {...form.register('topic')} placeholder="e.g. Photosynthesis" className="rounded-xl" />
          {form.formState.errors.topic && (
            <p className="text-xs text-red-500">{form.formState.errors.topic.message}</p>
          )}
        </div>

        {/* Subtopic */}
        <div className="space-y-1.5">
          <Label>Sub-topic <span className="text-muted-foreground">(optional)</span></Label>
          <Input {...form.register('subtopic')} placeholder="e.g. Light Reactions" className="rounded-xl" />
        </div>

        {/* Class Level — auto from teacher profile */}
        <div className="space-y-1.5">
          <Label>Class</Label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5">
            <span className="text-sm font-semibold text-foreground">{teacherClass}</span>
            <span className="text-xs text-muted-foreground">(your assigned class)</span>
          </div>
        </div>

        {/* Term + Week */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Term *</Label>
            <div className="flex gap-2">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => form.setValue('term', t)}
                  className={cn('flex-1 rounded-xl py-2 text-sm font-medium border transition-colors', form.watch('term') === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/30')}
                >
                  {t}{t === 1 ? 'st' : t === 2 ? 'nd' : 'rd'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Week *</Label>
            <select
              {...form.register('week', { valueAsNumber: true })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional context (AI mode only) */}
        {genMode === 'ai' && (
          <div className="space-y-1.5">
            <Label>Additional Notes for AI <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              {...form.register('additional_context')}
              placeholder="e.g. Focus on practical examples, include a group activity, emphasise the equation..."
              rows={3}
              className="rounded-xl resize-none"
            />
            <p className="text-xs text-muted-foreground">Help the AI understand your specific requirements or teaching approach.</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStep('mode')}>
            Back
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="gradient-primary gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 min-w-[160px]"
          >
            {isPending ? (
              <>Generating…</>
            ) : genMode === 'ai' ? (
              <><Brain className="h-4 w-4" /> Generate Document</>
            ) : (
              <><PenLine className="h-4 w-4" /> Create Document</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
