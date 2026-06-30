'use client';
import { use, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { AlertTriangle, CheckCircle, XCircle, Trophy, Check, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getQuizDetail, submitAttempt } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/types';

// ── helpers ───────────────────────────────────────────────────

function getMCQOptions(q: QuizQuestion) {
  return [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    ...(q.option_c ? [{ key: 'C', text: q.option_c }] : []),
    ...(q.option_d ? [{ key: 'D', text: q.option_d }] : []),
  ];
}

// ── True / False layout ───────────────────────────────────────

function TFOptions({
  selected,
  feedback,
  disabled,
  onPick,
}: {
  selected: string | null;
  feedback: 'correct' | 'wrong' | null;
  disabled: boolean;
  onPick: (key: string) => void;
}) {
  const cards = [
    { key: 'A', label: 'True',  Icon: Check, idle: 'hover:border-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30' },
    { key: 'B', label: 'False', Icon: X,     idle: 'hover:border-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30' },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {cards.map(({ key, label, Icon, idle }) => {
        const isSelected = selected === key;
        const isCorrect  = isSelected && feedback === 'correct';
        const isWrong    = isSelected && feedback === 'wrong';

        return (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onPick(key)}
            animate={isWrong ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
            transition={{ duration: 0.45 }}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-3xl border-2 py-10 font-bold text-lg transition-all duration-200',
              isCorrect ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
              isWrong   ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
              isSelected ? 'border-primary bg-primary/8 text-primary' :
              `border-border bg-card text-foreground/80 ${idle}`,
            )}
          >
            <span className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl',
              isCorrect ? 'bg-green-500 text-white' :
              isWrong   ? 'bg-red-400 text-white' :
              isSelected ? 'bg-primary text-white' :
              key === 'A' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500',
            )}>
              <Icon className="h-7 w-7" />
            </span>
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── MCQ option row ────────────────────────────────────────────

function MCQOption({
  optKey,
  text,
  selected,
  feedback,
  disabled,
  onPick,
}: {
  optKey: string;
  text: string;
  selected: string | null;
  feedback: 'correct' | 'wrong' | null;
  disabled: boolean;
  onPick: (key: string) => void;
}) {
  const isSelected = selected === optKey;
  const isCorrect  = isSelected && feedback === 'correct';
  const isWrong    = isSelected && feedback === 'wrong';

  return (
    <motion.div
      animate={isWrong ? { x: [-6, 6, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onPick(optKey)}
        className={cn(
          'flex w-full items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-base font-medium transition-all duration-200',
          isCorrect ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300' :
          isWrong   ? 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300' :
          isSelected ? 'border-primary bg-primary/10 text-foreground' :
          'border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-primary/5',
        )}
      >
        {/* Letter badge */}
        <span className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
          isCorrect ? 'border-green-500 bg-green-500 text-white' :
          isWrong   ? 'border-red-400 bg-red-400 text-white' :
          isSelected ? 'border-primary bg-primary text-white' :
          'border-border text-muted-foreground',
        )}>
          {optKey}
        </span>

        <span className="flex-1 leading-snug">{text}</span>

        <AnimatePresence>
          {isCorrect && (
            <motion.div key="chk" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
              <CheckCircle className="h-6 w-6 text-green-500" />
            </motion.div>
          )}
          {isWrong && (
            <motion.div key="xcl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 14 }}>
              <XCircle className="h-6 w-6 text-red-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

// ── Quiz Complete screen ──────────────────────────────────────

function QuizComplete({
  total,
  firstTryCount,
  accuracy,
  onSave,
  saving,
}: {
  total:         number;
  firstTryCount: number;
  accuracy:      number;
  onSave:        () => void;
  saving:        boolean;
}) {
  useEffect(() => {
    const fire = (opts: confetti.Options) => confetti({ ...opts, disableForReducedMotion: true });
    fire({ particleCount: 100, spread: 80, origin: { y: 0.55 } });
    setTimeout(() => fire({ particleCount: 60, spread: 55, origin: { y: 0.6 }, angle: 115 }), 300);
    setTimeout(() => fire({ particleCount: 40, spread: 40, origin: { y: 0.5 }, angle: 65 }), 500);
  }, []);

  const r    = 48;
  const circ = 2 * Math.PI * r;
  const dash = (accuracy / 100) * circ;
  const color = accuracy >= 70 ? '#22c55e' : accuracy >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[80vh] items-center justify-center px-4"
    >
      <div className="w-full max-w-sm space-y-7 rounded-3xl border border-border bg-card px-8 py-10 text-center shadow-2xl">

        {/* Bouncing trophy */}
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100"
        >
          <Trophy className="h-12 w-12 text-yellow-500" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Quiz Complete!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {firstTryCount === total
              ? 'Perfect! Every answer correct on the first try 🎉'
              : `${total - firstTryCount} question${total - firstTryCount > 1 ? 's' : ''} needed more than one try`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">

          {/* Accuracy ring */}
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/50 px-3 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Accuracy</p>
            <div className="relative flex h-[100px] w-[100px] items-center justify-center">
              <svg className="-rotate-90" width="100" height="100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r={r}
                  fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circ}` }}
                  animate={{ strokeDasharray: `${dash} ${circ}` }}
                  transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}
                />
              </svg>
              <motion.p
                className="absolute text-2xl font-black"
                style={{ color }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
              >
                {Math.round(accuracy)}%
              </motion.p>
            </div>
          </div>

          {/* Perfect first try */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/50 px-3 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Perfect First Try</p>
            <motion.div
              className="flex items-end gap-0.5"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.5 }}
            >
              <span className="text-4xl font-black text-green-600 leading-none">{firstTryCount}</span>
              <span className="mb-1 text-lg font-semibold text-muted-foreground">/{total}</span>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="h-13 w-full rounded-2xl text-base font-bold gradient-primary text-white shadow-lg shadow-primary/30 hover:opacity-90"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save & Continue →'}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function QuizTakePage(props: { params: Promise<{ id: string }> }) {
  const { id }   = use(props.params);
  const router   = useRouter();
  const startRef = useRef(Date.now());

  const { data: quiz, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.detail(id),
    queryFn:  () => getQuizDetail(id),
    enabled:  !!id,
  });

  const [current,       setCurrent]       = useState(0);
  const [selected,      setSelected]      = useState<string | null>(null);
  const [feedback,      setFeedback]      = useState<'correct' | 'wrong' | null>(null);
  const [firstAttempts, setFirstAttempts] = useState<Record<string, string>>({}); // first pick per question.id
  const [attempts,      setAttempts]      = useState<Record<number, number>>({}); // try count per question index
  const [completed,     setCompleted]     = useState(false);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    if (quiz && quiz.status !== 'READY') {
      router.replace(`/student/quiz/${id}/status`);
    }
  }, [quiz, id, router]);

  // Reset selection state when moving to a new question
  useEffect(() => {
    setSelected(null);
    setFeedback(null);
  }, [current]);

  if (isLoading) return <LoadingPage />;
  if (isError || !quiz) {
    return (
      <div className="flex max-w-md flex-col items-center gap-5 pt-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="font-bold">Quiz not found.</p>
        <Link href="/student/quiz"><Button variant="outline">← Back</Button></Link>
      </div>
    );
  }

  // ── Quiz Complete ─────────────────────────────────────────────

  if (completed) {
    const total         = quiz.questions.length;
    const firstTryCount = quiz.questions.filter((q) => firstAttempts[q.id] === q.correct).length;
    const accuracy      = quiz.questions.reduce((sum, q, i) => {
      const tries = attempts[i] ?? 1;
      return sum + (1 / tries) * 100;
    }, 0) / total;

    const handleSave = async () => {
      setSaving(true);
      const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
      const answers = quiz.questions.map((q) => ({
        question_id: q.id,
        chosen:      firstAttempts[q.id] ?? '', // blank = skipped (shouldn't happen)
      }));
      try {
        await submitAttempt(id, { answers, time_taken_s: timeTaken });
        router.push(`/student/quiz/${id}/results`);
      } catch {
        toast.error('Failed to save results. Please try again.');
        setSaving(false);
      }
    };

    return (
      <QuizComplete
        total={total}
        firstTryCount={firstTryCount}
        accuracy={accuracy}
        onSave={handleSave}
        saving={saving}
      />
    );
  }

  // ── Active quiz ───────────────────────────────────────────────

  const questions = quiz.questions;
  const q         = questions[current];
  const isTF      = q.question_type === 'TF';
  const mcqOpts   = isTF ? [] : getMCQOptions(q);
  const progress  = (current / questions.length) * 100;

  const handleOptionClick = (key: string) => {
    if (feedback !== null || !quiz) return; // block during any animation

    const isCorrect = key === q.correct;
    const tryNum    = (attempts[current] ?? 0) + 1;

    setSelected(key);
    setAttempts((prev) => ({ ...prev, [current]: tryNum }));

    // Record first attempt only
    if (tryNum === 1) {
      setFirstAttempts((prev) => ({ ...prev, [q.id]: key }));
    }

    if (isCorrect) {
      setFeedback('correct');
      setTimeout(() => {
        if (current < questions.length - 1) {
          setCurrent((c) => c + 1);
          // useEffect above resets selected/feedback
        } else {
          setCompleted(true);
        }
      }, 1100);
    } else {
      setFeedback('wrong');
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
      }, 700);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col py-6">

      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/student/quiz">
          <Button variant="ghost" size="sm" className="text-muted-foreground">← Exit</Button>
        </Link>
        <span className="font-mono text-sm font-semibold text-muted-foreground">
          {current + 1} <span className="font-normal opacity-50">/</span> {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-10 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Question type badge */}
            {isTF && (
              <span className="mb-3 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                True / False
              </span>
            )}

            {/* Question text */}
            <h2 className="mb-8 text-xl font-bold leading-snug text-foreground sm:text-2xl">
              {q.question_text}
            </h2>

            {/* Options */}
            {isTF ? (
              <TFOptions
                selected={selected}
                feedback={feedback}
                disabled={feedback === 'correct'}
                onPick={handleOptionClick}
              />
            ) : (
              <div className="space-y-3">
                {mcqOpts.map(({ key, text }) => (
                  <MCQOption
                    key={key}
                    optKey={key}
                    text={text}
                    selected={selected}
                    feedback={feedback}
                    disabled={feedback === 'correct'}
                    onPick={handleOptionClick}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Feedback message */}
      <div className="mt-8 flex h-8 items-center justify-center">
        <AnimatePresence mode="wait">
          {feedback === 'correct' && (
            <motion.p
              key="ok"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-bold text-green-600"
            >
              <CheckCircle className="h-5 w-5" />
              Correct! Moving on…
            </motion.p>
          )}
          {feedback === 'wrong' && (
            <motion.p
              key="no"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 font-bold text-red-500"
            >
              <XCircle className="h-5 w-5" />
              Not quite — try again!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        {questions.map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i === current ? 1.3 : 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-300',
              i <= current ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>
    </div>
  );
}
