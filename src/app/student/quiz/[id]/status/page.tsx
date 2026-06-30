'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Sparkles, BookOpen, CheckCircle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getQuizStatus } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

const STEPS = [
  { Icon: BookOpen,     text: 'Reading your notes…' },
  { Icon: Brain,        text: 'Crafting questions…' },
  { Icon: Sparkles,     text: 'Polishing answers…' },
  { Icon: CheckCircle,  text: 'Almost ready!' },
] as const;

export default function QuizStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id }         = use(props.params);
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const [stepIdx, setStepIdx]         = useState(0);
  const [checking, setChecking]       = useState(false);

  const { data: poll, isError } = useQuery({
    queryKey: queryKeys.quiz.status(id),
    queryFn:  () => getQuizStatus(id),
    // Keep polling while generating OR while we have no data yet (handles initial API errors)
    refetchInterval: (q) => {
      const st = q.state.data?.status;
      if (st === 'READY' || st === 'FAILED') return false;
      return 3000; // poll when GENERATING or when data is undefined (no successful fetch yet)
    },
    retry: 3, // retry failed requests before giving up
  });

  useEffect(() => {
    if (poll?.status === 'READY') {
      router.replace(`/student/quiz/${id}`);
    }
  }, [poll?.status, id, router]);

  // Cycle through steps while generating
  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((p) => (p < STEPS.length - 1 ? p + 1 : p));
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // "Check Again" — re-fetch once manually (in case quiz is now READY after transient failure)
  const handleCheckAgain = async () => {
    setChecking(true);
    try {
      await queryClient.refetchQueries({ queryKey: queryKeys.quiz.status(id) });
    } finally {
      setChecking(false);
    }
  };

  if (poll?.status === 'FAILED') {
    return (
      <div className="flex max-w-md flex-col items-center gap-5 pt-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50"
        >
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </motion.div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Quiz generation failed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {poll.error_message || 'Something went wrong. Please try again.'}
          </p>
        </div>
        <div className="flex gap-3">
          {/* Check again — in case Celery retried and it's now READY */}
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={handleCheckAgain}
            disabled={checking}
          >
            <RefreshCcw className={cn('h-4 w-4', checking && 'animate-spin')} />
            Check Again
          </Button>
          <Link href="/student/quiz/generate">
            <Button className="gradient-primary rounded-xl font-bold text-white">Try Again</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Network / API error (not a FAILED quiz status — just a failed HTTP call)
  if (isError && !poll) {
    return (
      <div className="flex max-w-md flex-col items-center gap-5 pt-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Can&apos;t reach the server</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your quiz is still being generated. Check your connection and try refreshing.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={handleCheckAgain}
          disabled={checking}
        >
          <RefreshCcw className={cn('h-4 w-4', checking && 'animate-spin')} />
          Refresh
        </Button>
      </div>
    );
  }

  const { Icon: StepIcon } = STEPS[stepIdx];

  return (
    <div className="flex max-w-md flex-col items-center gap-8 pt-20 text-center">

      {/* Brain with pulsing rings */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/20"
            animate={{ scale: [1, 1.4 + i * 0.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{
              duration:  2.5,
              delay:     i * 0.6,
              repeat:    Infinity,
              ease:      'easeInOut',
            }}
          />
        ))}
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Brain className="h-10 w-10 text-primary" />
        </motion.div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground">Building your quiz…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes 10–20 seconds.
        </p>
      </div>

      {/* Cycling step message */}
      <div className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary/5 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={stepIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 text-sm font-medium text-primary"
          >
            <StepIcon className="h-4 w-4 shrink-0" />
            {STEPS[stepIdx].text}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i === stepIdx ? 1.4 : 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'h-2 w-2 rounded-full transition-colors duration-300',
              i <= stepIdx ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        You can leave — we&apos;ll keep this quiz in your list.
      </p>
    </div>
  );
}
