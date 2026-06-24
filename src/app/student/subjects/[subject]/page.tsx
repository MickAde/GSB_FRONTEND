'use client';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ChevronRight, BookOpen, Brain, Target } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';
import { getSubjectStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

function ScorePill({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const color = value >= 70 ? 'text-emerald-600 bg-emerald-50' : value >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', color)}>{Math.round(value)}%</span>;
}

function SubjectMiniDashboard({ subject }: { subject: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.subjectStats(subject),
    queryFn: () => getSubjectStats(subject),
  });

  if (isLoading) {
    return <div className="rounded-2xl border bg-card p-6 animate-pulse h-48" />;
  }
  if (isError || !data) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        No quiz data yet. Take a quiz to see analytics.
      </div>
    );
  }

  const avgColor =
    data.average_score === null ? 'text-muted-foreground'
    : data.average_score >= 70  ? 'text-emerald-600'
    : data.average_score >= 50  ? 'text-amber-500'
    : 'text-red-500';

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Subject Overview</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Avg Score</p>
          <p className={cn('mt-1 text-3xl font-black', avgColor)}>
            {data.average_score !== null ? `${Math.round(data.average_score)}%` : '—'}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Quizzes Taken</p>
          <p className="mt-1 text-3xl font-black text-foreground">{data.quizzes_taken}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Notes</p>
          <p className="mt-1 text-3xl font-black text-foreground">{data.notes_count}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Topics</p>
          <p className="mt-1 text-3xl font-black text-foreground">{data.topics_count}</p>
        </div>
      </div>

      {data.topics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">By Topic</h3>
          <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
            {data.topics.map((t) => (
              <div key={t.topic} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate text-foreground">{t.topic}</span>
                <span className="text-xs text-muted-foreground">{t.quizzes} quiz</span>
                <ScorePill value={t.avg_score} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: encodedSubject } = use(params);
  const subject = decodeURIComponent(encodedSubject);
  const router = useRouter();

  const { data: notesData, isLoading } = useNotes({ subject, page: 1 });

  const notes = notesData?.results ?? [];

  // Group notes by topic
  const topicMap: Record<string, typeof notes> = {};
  for (const note of notes) {
    const topic = note.topic || 'Uncategorised';
    topicMap[topic] = [...(topicMap[topic] ?? []), note];
  }
  const topics = Object.keys(topicMap).sort();

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{subject}</h1>
          <p className="text-sm text-muted-foreground">{notes.length} notes · {topics.length} topics</p>
        </div>
        <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`}>
          <Button className="gradient-primary h-9 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 text-sm">
            <Plus className="h-3.5 w-3.5" /> Upload Note
          </Button>
        </Link>
      </div>

      {/* Split pane */}
      <div className="flex gap-6 items-start">
        {/* Left — topic list */}
        <div className="flex-1 min-w-0 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Topics</h2>

          {topics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No notes uploaded for {subject} yet.
              <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`} className="ml-1 text-primary underline underline-offset-2">
                Upload one now →
              </Link>
            </div>
          ) : (
            topics.map((topic) => {
              const topicNotes = topicMap[topic];
              return (
                <Link
                  key={topic}
                  href={`/student/subjects/${encodedSubject}/${encodeURIComponent(topic)}`}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{topic}</p>
                    <p className="text-xs text-muted-foreground">{topicNotes.length} {topicNotes.length === 1 ? 'note' : 'notes'}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              );
            })
          )}

          {/* Quick actions */}
          <div className="flex gap-2 pt-2">
            <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2 rounded-xl text-sm">
                <Plus className="h-3.5 w-3.5" /> Add Note
              </Button>
            </Link>
            <Link href={`/student/quiz?subject=${encodeURIComponent(subject)}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2 rounded-xl text-sm">
                <Brain className="h-3.5 w-3.5" /> Start Quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Right — analytics mini-dashboard */}
        <div className="w-72 shrink-0 hidden lg:block">
          <SubjectMiniDashboard subject={subject} />
        </div>
      </div>

      {/* Mobile analytics */}
      <div className="lg:hidden">
        <SubjectMiniDashboard subject={subject} />
      </div>
    </div>
  );
}
