'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Brain, Flame, Trophy, BookOpen, Zap,
  Target, TrendingUp, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { PerformanceAreaChart } from '@/components/quiz/PerformanceAreaChart';
import { getPerformanceStats, getPerformanceHistory } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { PerformanceHistoryPoint, PerformanceStats, QuizDifficulty, RecentAttempt, SubjectPerformance } from '@/types';

// ── Score helpers ──────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-amber-500';
  return 'text-rose-500';
}
function scoreBg(pct: number) {
  if (pct >= 75) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-rose-50 border-rose-200';
}
function scoreRingStroke(pct: number) {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#f43f5e';
}
function scoreLabel(pct: number) {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Great';
  if (pct >= 60) return 'Good';
  if (pct >= 45) return 'Fair';
  return 'Needs Work';
}
function readinessMeta(score: number): { headline: string; sub: string } {
  if (score === 0)  return { headline: 'No score yet',          sub: 'Your readiness score appears once you start quizzing.' };
  if (score < 40)   return { headline: 'Just Getting Started',  sub: 'Every quiz builds your foundation — keep going!' };
  if (score < 60)   return { headline: 'Making Progress',       sub: "You're picking things up. Focus on your weaker subjects." };
  if (score < 75)   return { headline: 'On the Right Track',    sub: 'Solid foundation! Try harder quizzes to push your score up.' };
  if (score < 90)   return { headline: 'Great Performance',     sub: 'You clearly know your stuff — stay consistent!' };
  return              { headline: 'Outstanding!',                sub: "You're mastering this material. Truly impressive work." };
}
function streakMeta(streak: number): string {
  if (streak === 0)  return 'Take a quiz today to start your streak!';
  if (streak === 1)  return 'Day 1 — great start!';
  if (streak < 4)    return 'Keep it going — you\'re building a habit!';
  if (streak < 7)    return 'Almost a full week — you\'re on a roll!';
  if (streak < 14)   return `${streak} days strong — you're on fire!`;
  if (streak < 30)   return `${streak} days straight — absolutely incredible!`;
  return               `${streak} days — you're unstoppable!`;
}

const DIFF_META: Record<QuizDifficulty, { label: string; desc: string; color: string; bg: string; stroke: string }> = {
  easy:      { label: 'Easy',     desc: 'Foundation',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', stroke: '#10b981' },
  moderate:  { label: 'Moderate', desc: 'Application',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     stroke: '#f59e0b' },
  difficult: { label: 'Difficult',desc: 'Mastery',      color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',       stroke: '#f43f5e' },
};

// ── Animated count-up hook ─────────────────────────────────────

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = t < 1 ? t * t * (3 - 2 * t) : 1;
      setVal(Math.round(target * ease));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return val;
}

// ── Readiness SVG ring ─────────────────────────────────────────

function ReadinessRing({ score }: { score: number }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);
  const { headline, sub } = readinessMeta(score);
  const displayed = useCountUp(score, 1200);

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Readiness Score</p>
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10"
            className="stroke-muted/40" />
          {/* Progress */}
          <motion.circle
            cx="60" cy="60" r={R}
            fill="none"
            stroke={scoreRingStroke(score)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.3, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-4xl font-extrabold tabular-nums leading-none', scoreColor(score))}>
            {displayed}
          </span>
          <span className="mt-0.5 text-xs font-medium text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn('text-base font-bold', scoreColor(score))}>{headline}</p>
        <p className="mt-1 max-w-[22ch] text-center text-xs text-muted-foreground">{sub}</p>
      </div>
      <p className="max-w-[24ch] text-center text-[10px] leading-relaxed text-muted-foreground">
        Weights your last 10 quizzes — harder quizzes count 1.5× more.
      </p>
    </div>
  );
}

// ── Streak card ────────────────────────────────────────────────

function StreakCard({ streak }: { streak: number }) {
  const displayed = useCountUp(streak, 700);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-4 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4"
    >
      <motion.div
        animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100"
      >
        <Flame className={cn('h-6 w-6', streak > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
      </motion.div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold tabular-nums text-orange-600">{displayed}</span>
          <span className="text-sm font-medium text-orange-500">day{streak !== 1 ? 's' : ''}</span>
        </div>
        <p className="text-xs text-orange-700">{streakMeta(streak)}</p>
      </div>
    </motion.div>
  );
}

// ── Mini stat ──────────────────────────────────────────────────

function MiniStat({
  icon: Icon, label, value, delay = 0,
}: { icon: React.ElementType; label: string; value: string | number; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Subject bar ────────────────────────────────────────────────

function SubjectBar({ s, index }: { s: SubjectPerformance; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.07 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{s.subject || 'General'}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{s.attempts} quiz{s.attempts !== 1 ? 'zes' : ''}</span>
          <span className={cn('font-bold tabular-nums', scoreColor(s.average))}>
            {s.average.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: scoreRingStroke(s.average) }}
          initial={{ width: 0 }}
          animate={{ width: `${s.average}%` }}
          transition={{ duration: 1, delay: 0.2 + index * 0.07, ease: 'easeOut' }}
        />
      </div>
      <p className="text-right text-[10px] text-muted-foreground">{scoreLabel(s.average)}</p>
    </motion.div>
  );
}

// ── Recent attempt row ─────────────────────────────────────────

function RecentRow({ a, index }: { a: RecentAttempt; index: number }) {
  const meta = DIFF_META[a.difficulty];
  const date = new Date(a.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.06 * index }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold tabular-nums',
        scoreBg(a.percentage), scoreColor(a.percentage),
      )}>
        {Math.round(a.percentage)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{a.quiz_title}</p>
        <p className="text-xs text-muted-foreground">{a.score}/{a.total} correct · {date}</p>
      </div>
      <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', meta.bg, meta.color)}>
        {meta.label}
      </span>
    </motion.div>
  );
}

// ── Empty state ────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-24 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <Brain className="h-10 w-10 text-primary" />
      </motion.div>
      <div>
        <h2 className="text-xl font-bold text-foreground">No quiz data yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Take your first quiz and all your analytics will appear right here.
        </p>
      </div>
      <Link href="/student/quiz">
        <Button className="gradient-primary rounded-xl font-bold text-white">
          <Brain className="mr-2 h-4 w-4" /> Go to Quiz Centre
        </Button>
      </Link>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function StudentPerformancePage() {
  const { data: stats, isLoading } = useQuery<PerformanceStats>({
    queryKey: queryKeys.quiz.performance(),
    queryFn:  getPerformanceStats,
    staleTime: 30_000,
  });

  const { data: history = [] } = useQuery<PerformanceHistoryPoint[]>({
    queryKey: queryKeys.quiz.performanceHistory(),
    queryFn:  getPerformanceHistory,
    staleTime: 30_000,
    enabled:  !!stats && stats.total_attempts > 0,
  });

  if (isLoading || !stats) return <LoadingPage />;
  if (stats.total_attempts === 0) return <EmptyState />;

  const activeDiffs = (['easy', 'moderate', 'difficult'] as QuizDifficulty[]).filter(
    (d) => stats.difficulty_breakdown[d],
  );

  return (
    <div className="max-w-2xl space-y-10 py-2 pb-24">

      {/* ── Heading ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">My Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A snapshot of how you&apos;re doing across all your quizzes.
        </p>
      </motion.div>

      {/* ── Hero: ring + streak + quick stats ────────────────── */}
      <div className="grid gap-5 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <ReadinessRing score={stats.readiness_score} />
        </motion.div>

        <div className="flex flex-col gap-4">
          <StreakCard streak={stats.study_streak} />
          <MiniStat icon={Target}  label="Quiz Average"  value={`${stats.overall_average.toFixed(1)}%`} delay={0.42} />
          <MiniStat icon={Trophy}  label="Total Quizzes" value={stats.total_attempts}                    delay={0.52} />
        </div>
      </div>

      {/* ── Score trend chart ────────────────────────────────── */}
      <PerformanceAreaChart
        data={history}
        title="Score Trend"
        subtitle="Your average quiz score for each day you studied"
        emptyMessage="Take quizzes on at least 2 different days to see your score trend here."
      />

      {/* ── Subject performance ───────────────────────────────── */}
      {stats.subjects.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Performance by Subject</h2>
          </div>
          <div className="space-y-5">
            {stats.subjects.map((s, i) => (
              <SubjectBar key={s.subject} s={s} index={i} />
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Focus on subjects in amber or red — those are your biggest opportunities.
          </p>
        </section>
      )}

      {/* ── Difficulty breakdown ──────────────────────────────── */}
      {activeDiffs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-foreground">Difficulty Breakdown</h2>
          </div>
          <div className={cn('grid gap-3', activeDiffs.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
            {activeDiffs.map((d, i) => {
              const meta = DIFF_META[d];
              const bd   = stats.difficulty_breakdown[d];
              return (
                <motion.div
                  key={d}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.09 }}
                  className={cn('rounded-2xl border px-4 py-5 text-center', meta.bg)}
                >
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest', meta.color)}>{meta.label}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{meta.desc}</p>
                  <p className={cn('mt-3 text-3xl font-extrabold tabular-nums', meta.color)}>
                    {bd.average.toFixed(0)}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bd.attempts} quiz{bd.attempts !== 1 ? 'zes' : ''}
                  </p>
                </motion.div>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Difficult quizzes count <strong>1.5×</strong> toward your readiness score — they&apos;re worth the extra effort.
          </p>
        </section>
      )}

      {/* ── Recent quizzes ────────────────────────────────────── */}
      {stats.recent_attempts.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-foreground">Recent Quizzes</h2>
            </div>
            <Link href="/student/quiz" className="text-xs font-semibold text-primary hover:underline">
              All quizzes →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent_attempts.map((a, i) => (
              <RecentRow key={a.id} a={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Encouragement footer ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 text-center"
      >
        <TrendingUp className="mx-auto mb-2 h-6 w-6 text-primary" />
        <p className="font-semibold text-foreground">
          {stats.study_streak > 0
            ? `You've quizzed ${stats.study_streak} day${stats.study_streak !== 1 ? 's' : ''} in a row — consistency is how learning sticks.`
            : 'Consistency is how learning sticks — aim for at least one quiz every day!'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a difficult quiz to push your readiness score even higher.
        </p>
        <Link href="/student/quiz/generate" className="mt-4 inline-block">
          <Button size="sm" className="gradient-primary rounded-xl font-bold text-white">
            Take a Quiz Now
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
