'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Brain, Plus, CheckCircle, Loader2, XCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { PageHeader } from '@/components/common/PageHeader';
import { getQuizzes } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';
import type { QuizListItem } from '@/types';

const DIFFICULTY_COLORS = {
  easy:      'bg-emerald-100 text-emerald-700',
  moderate:  'bg-amber-100 text-amber-700',
  difficult: 'bg-red-100 text-red-700',
};

const STATUS_ICON = {
  GENERATING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  READY:      <CheckCircle className="h-4 w-4 text-emerald-500" />,
  FAILED:     <XCircle className="h-4 w-4 text-red-500" />,
};

function QuizCard({ quiz }: { quiz: QuizListItem }) {
  const isReady = quiz.status === 'READY';
  const href = isReady
    ? `/student/quiz/${quiz.id}`
    : quiz.status === 'GENERATING'
    ? `/student/quiz/${quiz.id}/status`
    : null;

  const card = (
    <div className={`group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all ${href ? 'hover:shadow-md hover:border-primary/20 cursor-pointer' : 'opacity-60'}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Brain className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{quiz.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {quiz.subject && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {quiz.subject}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_COLORS[quiz.difficulty]}`}>
            {quiz.difficulty}
          </span>
          <span className="text-xs text-muted-foreground">{quiz.num_questions} questions</span>
          {quiz.attempt_count > 0 && (
            <span className="text-xs text-muted-foreground">· {quiz.attempt_count} attempt{quiz.attempt_count > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {STATUS_ICON[quiz.status]}
        <span className="text-xs text-muted-foreground">{formatDate(quiz.created_at)}</span>
        {href && <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary/60 transition-colors" />}
      </div>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default function StudentQuizPage() {
  const { data: quizzes, isLoading } = useQuery({
    queryKey: queryKeys.quiz.all(),
    queryFn:  getQuizzes,
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="My Quizzes"
          description="Test your knowledge from your uploaded notes."
        />
        <Link href="/student/quiz/generate">
          <Button className="gradient-primary h-11 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Generate Quiz
          </Button>
        </Link>
      </div>

      {!quizzes?.length ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">No quizzes yet</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Generate a quiz from any of your processed notes</p>
          </div>
          <Link href="/student/quiz/generate">
            <Button className="gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90">
              Generate your first quiz →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
