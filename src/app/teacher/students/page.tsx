'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Search, TrendingUp, Trophy, AlertTriangle,
  BookOpen, Clock, ArrowUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { PerformanceAreaChart } from '@/components/quiz/PerformanceAreaChart';
import { getTeacherStudentStats, getClassPerformanceHistory } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn, formatDate } from '@/lib/utils';
import type { PerformanceHistoryPoint, StudentPerformanceSummary } from '@/types';

// ── Helpers ────────────────────────────────────────────────────

type SortKey = 'name' | 'score' | 'attempts' | 'last_active';
type SortDir = 'asc' | 'desc';

function scoreColor(avg: number | null) {
  if (avg === null) return 'text-muted-foreground';
  if (avg >= 75) return 'text-emerald-600';
  if (avg >= 50) return 'text-amber-600';
  return 'text-rose-600';
}
function scoreBg(avg: number | null) {
  if (avg === null) return 'bg-muted/40 border-border text-muted-foreground';
  if (avg >= 75) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (avg >= 50) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-rose-50 border-rose-200 text-rose-700';
}
function scoreRingStroke(avg: number | null) {
  if (avg === null) return '#94a3b8';
  if (avg >= 75) return '#10b981';
  if (avg >= 50) return '#f59e0b';
  return '#f43f5e';
}
function scoreGrade(avg: number | null): string {
  if (avg === null) return 'No data';
  if (avg >= 90) return 'Excellent';
  if (avg >= 75) return 'Great';
  if (avg >= 60) return 'Good';
  if (avg >= 45) return 'Fair';
  return 'Needs Help';
}

// ── Mini score ring ────────────────────────────────────────────

function ScoreRing({ avg }: { avg: number | null }) {
  const pct = avg ?? 0;
  const R = 20;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" strokeWidth="5"
          className="stroke-muted/40" />
        <motion.circle
          cx="24" cy="24" r={R}
          fill="none"
          stroke={scoreRingStroke(avg)}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-[10px] font-bold tabular-nums', scoreColor(avg))}>
          {avg !== null ? `${Math.round(avg)}` : '—'}
        </span>
      </div>
    </div>
  );
}

// ── Student card ───────────────────────────────────────────────

function StudentCard({ s, index }: { s: StudentPerformanceSummary; index: number }) {
  const noActivity = s.total_attempts === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={cn(
        'flex items-center gap-4 rounded-2xl border px-4 py-3.5 transition-colors',
        noActivity
          ? 'border-border/50 bg-muted/30'
          : s.average_score !== null && s.average_score < 50
            ? 'border-rose-200 bg-rose-50/40'
            : 'border-border bg-card',
      )}
    >
      {/* Score ring */}
      <ScoreRing avg={s.average_score} />

      {/* Name + grade */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{s.full_name || s.username}</p>
        <p className="text-xs text-muted-foreground">@{s.username}</p>
        <span className={cn(
          'mt-1 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
          scoreBg(s.average_score),
        )}>
          {scoreGrade(s.average_score)}
        </span>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right">
        <p className={cn('text-lg font-extrabold tabular-nums', scoreColor(s.average_score))}>
          {s.average_score !== null ? `${Math.round(s.average_score)}%` : '—'}
        </p>
        <p className="text-xs text-muted-foreground">
          {s.total_attempts} quiz{s.total_attempts !== 1 ? 'zes' : ''}
        </p>
        {s.last_active && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(s.last_active)}</p>
        )}
      </div>

      {/* Alert if needs help */}
      {!noActivity && s.average_score !== null && s.average_score < 50 && (
        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
      )}
    </motion.div>
  );
}

// ── Class overview cards ───────────────────────────────────────

function OverviewCard({
  icon: Icon, label, value, sub, accent, delay = 0,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; accent: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4"
    >
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ── Sort button ────────────────────────────────────────────────

function SortBtn({
  label, sortKey, active, dir, onClick,
}: { label: string; sortKey: SortKey; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30',
      )}
    >
      {label}
      {active
        ? dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        : <ArrowUpDown className="h-3 w-3 opacity-50" />}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function TeacherStudentsPage() {
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showLow, setShowLow] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.teacherStudents(),
    queryFn:  getTeacherStudentStats,
    staleTime: 60_000,
  });

  const { data: classHistory = [] } = useQuery<PerformanceHistoryPoint[]>({
    queryKey: queryKeys.quiz.classHistory(),
    queryFn:  getClassPerformanceHistory,
    staleTime: 60_000,
    enabled:  !!data && data.length > 0,
  });

  const sorted = useMemo(() => {
    if (!data) return [];
    let list = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) => s.full_name?.toLowerCase().includes(q) || s.username.toLowerCase().includes(q),
      );
    }

    // Low-score filter
    if (showLow) list = list.filter((s) => s.average_score !== null && s.average_score < 60);

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = (a.full_name || a.username).localeCompare(b.full_name || b.username);
      } else if (sortKey === 'score') {
        cmp = (a.average_score ?? -1) - (b.average_score ?? -1);
      } else if (sortKey === 'attempts') {
        cmp = a.total_attempts - b.total_attempts;
      } else if (sortKey === 'last_active') {
        cmp = (a.last_active ?? '').localeCompare(b.last_active ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [data, search, sortKey, sortDir, showLow]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (isLoading) return <LoadingPage />;
  if (isError || !data) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Could not load student data. Try refreshing.
      </div>
    );
  }

  const withData    = data.filter((s) => s.total_attempts > 0);
  const noActivity  = data.filter((s) => s.total_attempts === 0);
  const needsHelp   = data.filter((s) => s.average_score !== null && s.average_score < 50);
  const classAvg    = withData.length > 0
    ? withData.reduce((sum, s) => sum + (s.average_score ?? 0), 0) / withData.length
    : null;
  const topStudent  = withData.length > 0
    ? withData.reduce((best, s) =>
        (s.average_score ?? 0) > (best.average_score ?? 0) ? s : best, withData[0])
    : null;

  return (
    <div className="max-w-2xl space-y-8 py-2 pb-24">

      {/* ── Heading ──────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Student Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track how your students are performing across their quizzes.
        </p>
      </motion.div>

      {/* ── Class overview ────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OverviewCard
          icon={Users}      label="Students"    value={data.length}
          sub="in your class"
          accent="bg-primary"  delay={0.05}
        />
        <OverviewCard
          icon={TrendingUp} label="Class Avg"
          value={classAvg !== null ? `${Math.round(classAvg)}%` : '—'}
          sub={withData.length > 0 ? `${withData.length} active` : 'no attempts yet'}
          accent={classAvg !== null && classAvg >= 75 ? 'bg-emerald-500' : classAvg !== null && classAvg >= 50 ? 'bg-amber-500' : 'bg-rose-500'}
          delay={0.1}
        />
        <OverviewCard
          icon={AlertTriangle} label="Need Help" value={needsHelp.length}
          sub="below 50%"
          accent="bg-rose-500" delay={0.15}
        />
        <OverviewCard
          icon={BookOpen} label="Inactive" value={noActivity.length}
          sub="no quizzes yet"
          accent="bg-slate-400" delay={0.2}
        />
      </div>

      {/* Top student shoutout */}
      {topStudent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4"
        >
          <Trophy className="h-6 w-6 shrink-0 text-amber-500" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Top Performer</p>
            <p className="truncate font-bold text-foreground">{topStudent.full_name || topStudent.username}</p>
          </div>
          <span className="shrink-0 text-2xl font-extrabold text-amber-600">
            {Math.round(topStudent.average_score ?? 0)}%
          </span>
        </motion.div>
      )}

      {/* ── Class trend chart ─────────────────────────────────── */}
      <PerformanceAreaChart
        data={classHistory}
        title="Class Performance Trend"
        subtitle="Daily average score across all students in your class"
        emptyMessage="Class trend appears once students have quizzed on at least 2 different days."
      />

      {/* ── Controls ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Sort + filter row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort:</span>
          <SortBtn label="Score"    sortKey="score"       active={sortKey === 'score'}       dir={sortDir} onClick={() => toggleSort('score')} />
          <SortBtn label="Name"     sortKey="name"        active={sortKey === 'name'}        dir={sortDir} onClick={() => toggleSort('name')} />
          <SortBtn label="Quizzes"  sortKey="attempts"    active={sortKey === 'attempts'}    dir={sortDir} onClick={() => toggleSort('attempts')} />
          <SortBtn label="Activity" sortKey="last_active" active={sortKey === 'last_active'} dir={sortDir} onClick={() => toggleSort('last_active')} />

          <div className="ml-auto">
            <button
              onClick={() => setShowLow((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
                showLow
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-border bg-card text-muted-foreground hover:border-rose-200',
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              Below 60%
              {showLow && ` (${needsHelp.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* ── Student list ──────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          <Users className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {showLow ? 'No students below 60% — great news!' : 'No students match your search.'}
          </p>
          {showLow && (
            <Button variant="ghost" size="sm" onClick={() => setShowLow(false)}>
              Show all students
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((s, i) => (
            <StudentCard key={s.id} s={s} index={i} />
          ))}
          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            {sorted.length} student{sorted.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      )}

      {/* ── Inactive students callout ─────────────────────────── */}
      {noActivity.length > 0 && !showLow && !search && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700">
              {noActivity.length} student{noActivity.length !== 1 ? 's have' : ' has'} not taken any quizzes yet.
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {noActivity.map((s) => s.full_name || s.username).join(', ')}
          </p>
        </motion.div>
      )}
    </div>
  );
}
