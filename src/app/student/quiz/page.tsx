'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Brain, Plus, CheckCircle, Loader2, XCircle,
  RotateCcw, Play, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getQuizzes } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { QuizListItem } from '@/types';

const DIFFICULTY_CONFIG = {
  easy:      { label: 'Easy',     cls: 'bg-emerald-100 text-emerald-700' },
  moderate:  { label: 'Moderate', cls: 'bg-amber-100 text-amber-700' },
  difficult: { label: 'Difficult',cls: 'bg-red-100 text-red-700' },
};

// ── Quiz Card ─────────────────────────────────────────────────

function QuizCard({ quiz, index }: { quiz: QuizListItem; index: number }) {
  const diff = DIFFICULTY_CONFIG[quiz.difficulty];
  const isGenerating = quiz.status === 'GENERATING';
  const isReady      = quiz.status === 'READY';
  const isFailed     = quiz.status === 'FAILED';

  const href = isReady
    ? `/student/quiz/${quiz.id}`
    : isGenerating
    ? `/student/quiz/${quiz.id}/status`
    : null;

  const cta =
    isGenerating      ? null :
    isFailed          ? null :
    quiz.attempt_count > 0 ? 'Retry' :
    'Start';

  const content = (
    <div className={cn(
      'group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all',
      href  ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' : '',
      isGenerating ? 'border-blue-200/80 bg-blue-50/30 dark:bg-blue-950/10' :
      isFailed     ? 'border-red-200/80 opacity-60' :
      'border-border',
    )}>

      {/* Left icon */}
      <div className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
        isGenerating ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-primary/10',
      )}>
        {isGenerating
          ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          : isFailed
          ? <XCircle className="h-5 w-5 text-red-500" />
          : <Brain className="h-5 w-5 text-primary" />
        }
      </div>

      {/* Middle: title + chips */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{quiz.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {quiz.subject && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {quiz.subject}
            </span>
          )}
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', diff.cls)}>
            {diff.label}
          </span>
          <span className="text-xs text-muted-foreground">{quiz.num_questions}Q</span>
        </div>
      </div>

      {/* Right: status + CTA */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5">
          {isReady      && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
          {isGenerating && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
          {isFailed     && <XCircle className="h-3.5 w-3.5 text-red-400" />}
          <span className="text-xs text-muted-foreground">{formatDate(quiz.created_at)}</span>
        </div>

        {cta && href && (
          <span className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
            quiz.attempt_count > 0
              ? 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              : 'bg-primary/10 text-primary',
          )}>
            {quiz.attempt_count > 0
              ? <RotateCcw className="h-3 w-3" />
              : <Play className="h-3 w-3" />
            }
            {cta}
          </span>
        )}

        {quiz.attempt_count > 0 && isReady && (
          <span className="text-[10px] text-muted-foreground/60">
            {quiz.attempt_count} attempt{quiz.attempt_count > 1 ? 's' : ''}
          </span>
        )}

        {href && !isGenerating && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.28 }}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function StudentQuizPage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: queryKeys.quiz.all(),
    queryFn:  getQuizzes,
  });

  if (isLoading) return <LoadingPage />;

  const generating = quizzes?.filter((q) => q.status === 'GENERATING') ?? [];
  const ready      = quizzes?.filter((q) => q.status === 'READY')      ?? [];
  const failed     = quizzes?.filter((q) => q.status === 'FAILED')     ?? [];

  const attempted  = ready.filter((q) => q.attempt_count > 0).length;

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Quizzes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ready.length === 0 && generating.length === 0
              ? 'No quizzes yet — generate one from your notes.'
              : `${ready.length} quiz${ready.length !== 1 ? 'zes' : ''} · ${attempted} attempted`}
          </p>
        </div>
        <Link href="/student/quiz/generate">
          <Button className="gradient-primary h-11 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> New Quiz
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {!quizzes?.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border py-16 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">No quizzes yet</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Generate a quiz from any of your processed notes
            </p>
          </div>
          <Link href="/student/quiz/generate">
            <Button className="gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90">
              Generate your first quiz →
            </Button>
          </Link>
        </motion.div>
      )}

      {/* Grouped lists */}
      {!!quizzes?.length && (
        <div className="space-y-6">

          {generating.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                Generating
              </h2>
              {generating.map((q, i) => (
                <QuizCard key={q.id} quiz={q} index={i} />
              ))}
            </section>
          )}

          {ready.length > 0 && (
            <section className="space-y-2">
              {(generating.length > 0 || failed.length > 0) && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Ready
                </h2>
              )}
              {ready.map((q, i) => (
                <QuizCard key={q.id} quiz={q} index={generating.length + i} />
              ))}
            </section>
          )}

          {failed.length > 0 && (
            <section className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" /> Failed
              </h2>
              {failed.map((q, i) => (
                <QuizCard
                  key={q.id}
                  quiz={q}
                  index={generating.length + ready.length + i}
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
