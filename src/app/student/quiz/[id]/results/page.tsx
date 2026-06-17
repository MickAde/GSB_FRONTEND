'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAttemptResult } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import type { AttemptAnswer } from '@/types';

function ScoreRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-black" style={{ color }}>{Math.round(pct)}%</p>
        <p className="text-xs text-muted-foreground">score</p>
      </div>
    </div>
  );
}

function gradeMessage(pct: number): string {
  if (pct >= 90) return 'Outstanding!';
  if (pct >= 70) return 'Well done!';
  if (pct >= 50) return 'Good effort!';
  return 'Keep practising!';
}

function AnswerRow({ ans, index }: { ans: AttemptAnswer; index: number }) {
  const q = ans.question;
  const options: [string, string][] = [
    ['A', q.option_a],
    ['B', q.option_b],
    ...(q.option_c ? [['C', q.option_c] as [string, string]] : []),
    ...(q.option_d ? [['D', q.option_d] as [string, string]] : []),
  ];

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        {ans.is_correct
          ? <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />}
        <p className="font-medium text-foreground">
          <span className="mr-2 text-muted-foreground">Q{index + 1}.</span>
          {q.question_text}
        </p>
      </div>

      <div className="ml-8 space-y-1.5">
        {options.map(([letter, text]) => {
          const isCorrect = letter === q.correct;
          const isChosen = letter === ans.chosen;
          let cls = 'rounded-lg border px-3 py-2 text-sm flex items-center gap-2 ';
          if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-800';
          else if (isChosen && !isCorrect) cls += 'border-red-300 bg-red-50 text-red-700 line-through';
          else cls += 'border-border text-muted-foreground';

          return (
            <div key={letter} className={cls}>
              <span className="w-5 shrink-0 font-semibold">{letter}.</span>
              <span>{text}</span>
              {isCorrect && <CheckCircle className="ml-auto h-4 w-4 text-green-500" />}
              {isChosen && !isCorrect && <XCircle className="ml-auto h-4 w-4 text-red-400" />}
            </div>
          );
        })}
      </div>

      {q.explanation && (
        <p className="ml-8 mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </p>
      )}
    </div>
  );
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.attempt(id),
    queryFn: () => getAttemptResult(id),
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-muted-foreground">Could not load results.</p>
        <Link href="/student/quiz"><Button variant="outline">Back to Quizzes</Button></Link>
      </div>
    );
  }

  const pct = Number(data.percentage);
  const mins = data.time_taken_s ? Math.floor(data.time_taken_s / 60) : null;
  const secs = data.time_taken_s ? data.time_taken_s % 60 : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-8 shadow-sm text-center">
        <ScoreRing pct={pct} />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{gradeMessage(pct)}</h1>
          <p className="mt-1 text-muted-foreground">
            You scored <span className="font-semibold text-foreground">{data.score}/{data.total}</span>
            {data.time_taken_s != null && (
              <> in <span className="font-semibold text-foreground">{mins}m {secs}s</span></>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/student/quiz/${id}`}>
            <Button variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry Quiz
            </Button>
          </Link>
          <Link href="/student/quiz/generate">
            <Button className="gap-2">
              <Brain className="h-4 w-4" />
              New Quiz
            </Button>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Question Breakdown</h2>
        <div className="space-y-4">
          {data.answers.map((ans, i) => (
            <AnswerRow key={ans.question.id} ans={ans} index={i} />
          ))}
        </div>
      </div>

      <Link href="/student/quiz" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground/80">
        <ArrowLeft className="h-4 w-4" />
        Back to Quizzes
      </Link>
    </div>
  );
}
