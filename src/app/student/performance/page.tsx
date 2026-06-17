'use client';
import { useQuery } from '@tanstack/react-query';
import { Flame, Brain, TrendingUp, BookOpen } from 'lucide-react';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getPerformanceStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';

function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const bg = score >= 70 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  return (
    <div className={`flex flex-col items-center gap-1 rounded-2xl border p-6 ${bg}`}>
      <Brain className={`h-8 w-8 ${color}`} />
      <p className={`text-5xl font-black ${color}`}>{Math.round(score)}%</p>
      <p className="text-sm font-medium text-muted-foreground">Readiness Score</p>
      <p className="mt-1 text-xs text-muted-foreground text-center">Weighted avg of last 10 attempts</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className={`rounded-full p-3 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

const DIFF_LABEL: Record<string, string> = { easy: 'Easy', moderate: 'Moderate', difficult: 'Difficult' };
const DIFF_COLOR: Record<string, string> = { easy: 'text-green-600', moderate: 'text-amber-500', difficult: 'text-red-500' };

export default function PerformancePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.performance(),
    queryFn: getPerformanceStats,
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !data) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Could not load performance data. Complete some quizzes first.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Your Performance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Across all quizzes and subjects</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReadinessGauge score={data.readiness_score} />
        <StatCard label="Overall Average" value={`${Math.round(data.overall_average)}%`} icon={TrendingUp} color="bg-blue-500" />
        <StatCard label="Total Attempts" value={data.total_attempts} icon={BookOpen} color="bg-purple-500" />
        <StatCard label="Study Streak" value={`${data.study_streak} day${data.study_streak !== 1 ? 's' : ''}`} icon={Flame} color="bg-orange-500" />
      </div>

      {/* Difficulty breakdown */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-foreground">By Difficulty</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(['easy', 'moderate', 'difficult'] as const).map((d) => {
            const stats = data.difficulty_breakdown[d];
            if (!stats) return null;
            return (
              <div key={d} className="rounded-lg border p-4">
                <p className={`text-lg font-bold ${DIFF_COLOR[d]}`}>{Math.round(stats.average)}%</p>
                <p className="text-sm font-medium text-foreground/80">{DIFF_LABEL[d]}</p>
                <p className="text-xs text-muted-foreground">{stats.attempts} attempt{stats.attempts !== 1 ? 's' : ''}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject breakdown */}
      {data.subjects.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-foreground">By Subject</h2>
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
                  <tr key={s.subject}>
                    <td className="py-2.5 font-medium text-foreground">{s.subject || 'No subject'}</td>
                    <td className="py-2.5 text-right text-muted-foreground">{s.attempts}</td>
                    <td className={`py-2.5 text-right font-semibold ${s.average >= 70 ? 'text-green-600' : s.average >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
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
          <h2 className="mb-4 font-semibold text-foreground">Recent Attempts</h2>
          <div className="space-y-3">
            {data.recent_attempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{a.quiz_title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.completed_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-lg font-bold ${a.percentage >= 70 ? 'text-green-600' : a.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {Math.round(a.percentage)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
