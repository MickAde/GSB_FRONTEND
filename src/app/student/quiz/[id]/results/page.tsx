'use client';
import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, ArrowLeft, RotateCcw, Brain, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAttemptResult } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { AttemptAnswer } from '@/types';

// ── Score ring ────────────────────────────────────────────────

function ScoreRing({ pct }: { pct: number }) {
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color =
    pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="-rotate-90" width="144" height="144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <motion.circle
          cx="72" cy="72" r={r} fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.p
          className="text-3xl font-black leading-none"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {Math.round(pct)}%
        </motion.p>
        <p className="text-xs text-muted-foreground">score</p>
      </div>
    </div>
  );
}

// ── Failed question card ──────────────────────────────────────

function FailedCard({ ans, index }: { ans: AttemptAnswer; index: number }) {
  const q = ans.question;
  const options: [string, string][] = [
    ['A', q.option_a],
    ['B', q.option_b],
    ...(q.option_c ? [['C', q.option_c] as [string, string]] : []),
    ...(q.option_d ? [['D', q.option_d] as [string, string]] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl border border-red-200 bg-card p-5 shadow-sm"
    >
      {/* Question */}
      <div className="mb-4 flex items-start gap-3">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <p className="font-semibold text-foreground">
          <span className="mr-2 text-muted-foreground text-sm">Q{index + 1}.</span>
          {q.question_text}
        </p>
      </div>

      {/* Options */}
      <div className="ml-8 space-y-2">
        {options.map(([letter, text]) => {
          const isCorrectAnswer = letter === q.correct;
          const isWhatTheyChose = letter === ans.chosen;

          return (
            <div
              key={letter}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm',
                isCorrectAnswer
                  ? 'border-green-400 bg-green-50 text-green-800 font-medium'
                  : isWhatTheyChose && !isCorrectAnswer
                  ? 'border-red-300 bg-red-50 text-red-700 line-through'
                  : 'border-border text-muted-foreground',
              )}
            >
              <span className="w-5 shrink-0 font-bold">{letter}.</span>
              <span className="flex-1">{text}</span>
              {isCorrectAnswer && <CheckCircle className="ml-auto h-4 w-4 shrink-0 text-green-500" />}
              {isWhatTheyChose && !isCorrectAnswer && <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-400" />}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {q.explanation && (
        <div className="ml-8 mt-3 rounded-xl bg-blue-50 px-3 py-2.5 text-sm text-blue-700">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </div>
      )}
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────

function gradeMessage(pct: number) {
  if (pct >= 90) return 'Outstanding! 🎉';
  if (pct >= 70) return 'Well done!';
  if (pct >= 50) return 'Good effort!';
  return 'Keep practising!';
}

export default function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.attempt(id),
    queryFn:  () => getAttemptResult(id),
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

  const pct          = Number(data.percentage);
  const failedList   = data.answers.filter((a) => !a.is_correct);
  const correctCount = data.answers.filter((a) => a.is_correct).length;
  const mins         = data.time_taken_s ? Math.floor(data.time_taken_s / 60) : null;
  const secs         = data.time_taken_s ? data.time_taken_s % 60 : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 rounded-3xl border bg-card p-8 shadow-sm text-center"
      >
        {/* Trophy */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100"
        >
          <Trophy className="h-10 w-10 text-yellow-500" />
        </motion.div>

        <ScoreRing pct={pct} />

        <div>
          <h1 className="text-2xl font-bold text-foreground">{gradeMessage(pct)}</h1>
          <p className="mt-1 text-muted-foreground">
            You scored{' '}
            <span className="font-semibold text-foreground">{correctCount}/{data.total}</span>
            {data.time_taken_s != null && (
              <> in <span className="font-semibold text-foreground">{mins}m {secs}s</span></>
            )}
          </p>
        </div>

        {/* Stat chips */}
        <div className="flex gap-3 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
            <CheckCircle className="h-3.5 w-3.5" /> {correctCount} correct
          </span>
          {failedList.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
              <XCircle className="h-3.5 w-3.5" /> {failedList.length} missed
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href={`/student/quiz/${id}`}>
            <Button variant="outline" className="gap-2 rounded-xl">
              <RotateCcw className="h-4 w-4" /> Retry Quiz
            </Button>
          </Link>
          <Link href="/student/quiz/generate">
            <Button className="gap-2 rounded-xl gradient-primary text-white">
              <Brain className="h-4 w-4" /> New Quiz
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Failed questions */}
      {failedList.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-bold text-foreground">
              Questions You Missed ({failedList.length})
            </h2>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">
            Review these carefully — these are the ones where your first answer was wrong.
          </p>
          <div className="space-y-4">
            {failedList.map((ans, i) => (
              <FailedCard key={ans.question.id} ans={ans} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8 text-center space-y-2"
        >
          <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
          <p className="font-bold text-green-800 text-lg">Perfect score on first try!</p>
          <p className="text-sm text-green-600">You answered every question correctly on your first attempt.</p>
        </motion.div>
      )}

      <Link href="/student/quiz" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Quizzes
      </Link>
    </div>
  );
}
