'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Flame, Brain, TrendingUp, BookOpen, ChevronRight, FileBarChart2 } from 'lucide-react';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getPerformanceStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

function ReadinessRing({ score }: { score: number }) {
  const color = score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const bg    = score >= 70 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-2xl border p-8', bg)}>
      <Brain className={cn('h-10 w-10', color)} />
      <p className={cn('text-6xl font-black', color)}>{Math.round(score)}%</p>
      <p className="text-sm font-semibold text-foreground">Readiness Score</p>
      <p className="text-xs text-muted-foreground text-center max-w-[180px]">Weighted average of your last 10 quiz attempts</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon: React.ElementType; colorClass: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', colorClass)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const DIFF_COLOR: Record<string, string> = { easy: 'text-emerald-600', moderate: 'text-amber-500', difficult: 'text-red-500' };

export default function AcademicReportPage() {
  const { data: user } = useCurrentUser();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.performance(),
    queryFn:  getPerformanceStats,
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <FileBarChart2 className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.first_name ? `${user.first_name}'s` : 'Your'} academic performance overview
            {user?.student_class_name && <span className="ml-1 font-semibold text-primary">· {user.student_class_name}</span>}
          </p>
        </div>
      </div>

      {isError || !data ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 font-medium text-muted-foreground">No quiz data yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Complete some quizzes to generate your academic report.</p>
          <Link href="/student/quiz" className="mt-4 inline-block text-sm text-primary underline underline-offset-2">
            Go to Quiz Centre →
          </Link>
        </div>
      ) : (
        <>
          {/* Readiness + quick stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <ReadinessRing score={data.readiness_score} />
            </div>
            <StatCard label="Overall Average"  value={`${Math.round(data.overall_average)}%`} icon={TrendingUp} colorClass="bg-blue-500" />
            <StatCard label="Total Attempts"   value={data.total_attempts}                     icon={BookOpen}   colorClass="bg-purple-500" />
            <StatCard label={`Study Streak`}   value={`${data.study_streak}d`}                 icon={Flame}      colorClass="bg-orange-500" />
          </div>

          {/* By Difficulty */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-foreground">Difficulty Breakdown</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              {(['easy', 'moderate', 'difficult'] as const).map((d) => {
                const stats = data.difficulty_breakdown[d];
                if (!stats) return null;
                return (
                  <div key={d} className="rounded-xl border bg-muted/30 p-5">
                    <p className={cn('text-3xl font-black', DIFF_COLOR[d])}>{Math.round(stats.average)}%</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-foreground">{d}</p>
                    <p className="text-xs text-muted-foreground">{stats.attempts} attempt{stats.attempts !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject breakdown */}
          {data.subjects.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Subject Performance</h2>
                <Link href="/student/subjects" className="text-xs text-primary hover:underline flex items-center gap-1">
                  View Subjects <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Subject</th>
                      <th className="pb-2 font-medium text-right">Attempts</th>
                      <th className="pb-2 font-medium text-right">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.subjects.map((s) => (
                      <tr key={s.subject} className="group">
                        <td className="py-3">
                          <Link
                            href={`/student/subjects/${encodeURIComponent(s.subject)}`}
                            className="font-medium text-foreground group-hover:text-primary transition-colors"
                          >
                            {s.subject || 'No subject'}
                          </Link>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{s.attempts}</td>
                        <td className={cn('py-3 text-right font-bold', s.average >= 70 ? 'text-emerald-600' : s.average >= 50 ? 'text-amber-500' : 'text-red-500')}>
                          {Math.round(s.average)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent attempts */}
          {data.recent_attempts.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Quiz Attempts</h2>
                <Link href="/student/quiz" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Quiz Centre <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {data.recent_attempts.map((a) => (
                  <Link
                    key={a.id}
                    href={`/student/quiz/${a.id}/results`}
                    className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30 hover:border-primary/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{a.quiz_title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{a.difficulty} · {new Date(a.completed_at).toLocaleDateString()}</p>
                    </div>
                    <span className={cn('ml-4 shrink-0 text-xl font-black', a.percentage >= 70 ? 'text-emerald-600' : a.percentage >= 50 ? 'text-amber-500' : 'text-red-500')}>
                      {Math.round(a.percentage)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
