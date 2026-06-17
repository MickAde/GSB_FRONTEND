'use client';
import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getQuizDetail, submitAttempt } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { QuizQuestion } from '@/types';

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

function getOptions(q: QuizQuestion) {
  return [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    ...(q.option_c ? [{ key: 'C', text: q.option_c }] : []),
    ...(q.option_d ? [{ key: 'D', text: q.option_d }] : []),
  ];
}

export default function QuizTakePage(props: { params: Promise<{ id: string }> }) {
  const { id }   = use(props.params);
  const router   = useRouter();
  const startRef = useRef(Date.now());

  const { data: quiz, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.detail(id),
    queryFn:  () => getQuizDetail(id),
    enabled:  !!id,
  });

  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <LoadingPage />;
  if (isError || !quiz) return (
    <div className="flex max-w-md flex-col items-center gap-5 pt-16 text-center">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <p className="font-bold">Quiz not found.</p>
      <Link href="/student/quiz"><Button variant="outline">← Back</Button></Link>
    </div>
  );

  if (quiz.status !== 'READY') {
    router.replace(`/student/quiz/${id}/status`);
    return <LoadingPage />;
  }

  const questions = quiz.questions;
  const q         = questions[current];
  const options   = getOptions(q);
  const chosen    = answers[q.id] || '';
  const answered  = Object.keys(answers).length;
  const progress  = Math.round((answered / questions.length) * 100);

  const pick = (key: string) => setAnswers((prev) => ({ ...prev, [q.id]: key }));

  const handleSubmit = async () => {
    const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
    const payload = {
      answers: questions.map((qn) => ({ question_id: qn.id, chosen: answers[qn.id] || '' })),
      time_taken_s: timeTaken,
    };
    setSubmitting(true);
    try {
      await submitAttempt(id, payload);
      router.push(`/student/quiz/${id}/results`);
    } catch {
      toast.error('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/student/quiz">
          <Button variant="ghost" size="sm" className="text-muted-foreground">← Exit</Button>
        </Link>
        <div className="text-sm font-medium text-muted-foreground">
          Question {current + 1} of {questions.length}
        </div>
        <span className="text-xs text-muted-foreground">{answered} answered</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {current + 1}
          </span>
          <p className="text-base font-semibold leading-snug text-foreground">{q.question_text}</p>
        </div>

        <div className="space-y-3">
          {options.map(({ key, text }) => (
            <button
              key={key}
              type="button"
              onClick={() => pick(key)}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                chosen === key
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-foreground/80 hover:border-primary/30 hover:bg-primary/5'
              }`}
            >
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                chosen === key ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground'
              }`}>
                {key}
              </span>
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          className="rounded-xl gap-1"
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>

        {current < questions.length - 1 ? (
          <Button
            className="gradient-primary rounded-xl font-bold text-white gap-1"
            onClick={() => setCurrent((c) => c + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gradient-primary rounded-xl font-bold text-white gap-2 px-6"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting…' : `Submit Quiz (${answered}/${questions.length})`}
          </Button>
        )}
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {questions.map((qn, i) => (
          <button
            key={qn.id}
            onClick={() => setCurrent(i)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              i === current
                ? 'bg-primary scale-125'
                : answers[qn.id]
                ? 'bg-primary/40'
                : 'bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
