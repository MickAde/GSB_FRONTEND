'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getTeacherStudentStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

export default function TeacherStudentsPage() {
  const [threshold, setThreshold] = useState<string>('');

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.teacherStudents(),
    queryFn: getTeacherStudentStats,
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !data) {
    return <div className="py-20 text-center text-muted-foreground">Could not load student data.</div>;
  }

  const limit = threshold !== '' ? Number(threshold) : null;
  const filtered = limit !== null
    ? data.filter((s) => s.average_score !== null && s.average_score < limit)
    : data;

  const avgAll = data.length > 0
    ? data.reduce((sum, s) => sum + (s.average_score ?? 0), 0) / data.length
    : 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.length} student{data.length !== 1 ? 's' : ''} · Class avg{' '}
            <span className={`font-semibold ${avgAll >= 70 ? 'text-green-600' : avgAll >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {Math.round(avgAll)}%
            </span>
          </p>
        </div>
      </div>

      {/* Threshold filter */}
      <div className="flex items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <Filter className="mb-2 h-4 w-4 text-muted-foreground shrink-0" />
        <div className="space-y-1">
          <Label htmlFor="threshold" className="text-sm">Show students scoring below</Label>
          <div className="flex items-center gap-2">
            <Input
              id="threshold"
              type="number"
              min={0}
              max={100}
              placeholder="e.g. 60"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-28 rounded-lg"
            />
            <span className="text-sm text-muted-foreground">%</span>
            {threshold && (
              <button
                onClick={() => setThreshold('')}
                className="text-xs text-muted-foreground hover:text-muted-foreground underline"
              >
                clear
              </button>
            )}
          </div>
        </div>
        {limit !== null && (
          <p className="mb-1 ml-auto text-sm text-amber-600 font-medium">
            {filtered.length} student{filtered.length !== 1 ? 's' : ''} below {limit}%
          </p>
        )}
      </div>

      {/* Student table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Users className="h-10 w-10" />
          <p>{limit !== null ? `No students below ${limit}%` : 'No students found'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium text-right">Attempts</th>
                <th className="px-5 py-3 font-medium text-right">Avg Score</th>
                <th className="px-5 py-3 font-medium text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => {
                const avg = s.average_score;
                const avgColor = avg === null ? 'text-muted-foreground' : avg >= 70 ? 'text-green-600' : avg >= 50 ? 'text-amber-500' : 'text-red-500';
                return (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-foreground">{s.full_name || s.username}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{s.total_attempts}</td>
                    <td className={`px-5 py-3.5 text-right font-bold ${avgColor}`}>
                      {avg !== null ? `${Math.round(avg)}%` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">
                      {s.last_active ? formatDate(s.last_active) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
