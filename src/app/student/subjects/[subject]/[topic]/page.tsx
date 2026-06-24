'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, Brain, TrendingUp, TrendingDown, Minus,
  BookOpen, Target, Lightbulb, Clock, ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { useNotes } from '@/hooks/useNotes';
import { getTopicStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { NoteListItem, ConfidenceTrend } from '@/types';

type Tab = 'notes' | 'quiz' | 'performance';

// ── Shared helpers ────────────────────────────────────────────────────────────

function MasteryBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
    </div>
  );
}

function TrendIcon({ trend }: { trend: ConfidenceTrend }) {
  if (trend === 'improving')         return <TrendingUp   className="h-4 w-4 text-emerald-600" />;
  if (trend === 'declining')         return <TrendingDown className="h-4 w-4 text-red-500" />;
  if (trend === 'stable')            return <Minus        className="h-4 w-4 text-amber-500" />;
  return <span className="text-xs text-muted-foreground">—</span>;
}

const TREND_LABEL: Record<ConfidenceTrend, string> = {
  improving:       'Improving',
  stable:          'Stable',
  declining:       'Declining',
  not_enough_data: 'Not enough data',
};

// ── Tab: Notes ────────────────────────────────────────────────────────────────

function NotesTab({ notes, subject, topic }: { notes: NoteListItem[]; subject: string; topic: string }) {
  if (notes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium text-muted-foreground">No notes in this topic yet.</p>
        <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`}>
          <Button className="mt-4 gap-2 rounded-xl text-sm" size="sm">
            <Upload className="h-3.5 w-3.5" /> Upload Note
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => {
        const href = note.status === 'AWAITING_STUDENT_APPROVAL' || note.status === 'FAILED'
          ? `/student/notes/${note.id}/review`
          : `/student/notes/${note.id}`;
        return (
          <Link
            key={note.id}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
          >
            <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-primary">{note.note_type}</span>
            <span className="flex-1 truncate font-medium text-foreground">{note.file_name}</span>
            <NoteStatusBadge status={note.status} />
            <span className="shrink-0 text-[11px] text-muted-foreground/60">{formatDate(note.created_at)}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
          </Link>
        );
      })}
      <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`}>
        <Button variant="outline" className="w-full gap-2 rounded-xl text-sm mt-2">
          <Upload className="h-3.5 w-3.5" /> Upload another note
        </Button>
      </Link>
    </div>
  );
}

// ── Tab: Quiz ─────────────────────────────────────────────────────────────────

function QuizTab({ subject, topic }: { subject: string; topic: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.quiz.topicStats(subject, topic),
    queryFn:  () => getTopicStats(subject, topic),
  });

  if (isLoading) return <div className="animate-pulse h-48 rounded-2xl bg-muted" />;

  const mastery = data?.mastery_level ?? null;
  const last    = data?.last_score ?? null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground mb-2">Topic Mastery</p>
          {mastery !== null ? (
            <>
              <p className={cn('text-4xl font-black', mastery >= 70 ? 'text-emerald-600' : mastery >= 50 ? 'text-amber-500' : 'text-red-500')}>
                {Math.round(mastery)}%
              </p>
              <div className="mt-3"><MasteryBar value={mastery} /></div>
            </>
          ) : (
            <p className="text-2xl font-black text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground mb-2">Last Score</p>
          {last !== null ? (
            <p className={cn('text-4xl font-black', last >= 70 ? 'text-emerald-600' : last >= 50 ? 'text-amber-500' : 'text-red-500')}>
              {Math.round(last)}%
            </p>
          ) : (
            <p className="text-2xl font-black text-muted-foreground">—</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{data?.quizzes_taken ?? 0} taken</p>
        </div>
      </div>

      <Link href={`/student/quiz/generate?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`}>
        <Button className="w-full gradient-primary h-12 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90">
          <Brain className="h-5 w-5" /> Start Quiz on {topic}
        </Button>
      </Link>
    </div>
  );
}

// ── Tab: Performance ──────────────────────────────────────────────────────────

function PerformanceTab({ subject, topic }: { subject: string; topic: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.quiz.topicStats(subject, topic),
    queryFn:  () => getTopicStats(subject, topic),
  });

  if (isLoading) return <div className="animate-pulse h-64 rounded-2xl bg-muted" />;
  if (isError || !data) {
    return (
      <div className="rounded-2xl border p-8 text-center text-sm text-muted-foreground">
        No performance data yet. Complete a quiz to unlock analytics.
      </div>
    );
  }

  const { recommendation } = data;

  return (
    <div className="space-y-5">
      {/* Confidence trend */}
      <div className="flex items-center gap-3 rounded-xl border bg-card px-5 py-4">
        <TrendIcon trend={data.confidence_trend} />
        <div>
          <p className="text-sm font-semibold text-foreground">Confidence: {TREND_LABEL[data.confidence_trend]}</p>
          <p className="text-xs text-muted-foreground">Based on recent quiz results</p>
        </div>
      </div>

      {/* Subtopic breakdown */}
      {data.subtopic_breakdown.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Subtopic Breakdown</h3>
          <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
            {data.subtopic_breakdown.map((sub) => (
              <div key={sub.subtopic} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate text-foreground">{sub.subtopic}</span>
                <span className="text-xs text-muted-foreground">{sub.attempts} attempts</span>
                {sub.avg_score !== null ? (
                  <span className={cn('text-xs font-bold', sub.avg_score >= 70 ? 'text-emerald-600' : sub.avg_score >= 50 ? 'text-amber-500' : 'text-red-500')}>
                    {Math.round(sub.avg_score)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GSB Study Recommendation */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary shrink-0" />
          <h3 className="font-semibold text-foreground text-sm">GSB Study Recommendation</h3>
        </div>

        {recommendation.weak_areas.length > 0 ? (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.weak_areas.map((area) => (
                  <span key={area} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{area}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{recommendation.estimated_study_hours}h study time</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <Target className="h-3.5 w-3.5" />
                <span>+{recommendation.expected_improvement_pct}% projected</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-emerald-700 font-medium">
            Excellent! All subtopics are above 70%. Keep up the great work!
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TopicPage({ params }: { params: Promise<{ subject: string; topic: string }> }) {
  const { subject: encodedSubject, topic: encodedTopic } = use(params);
  const subject = decodeURIComponent(encodedSubject);
  const topic   = decodeURIComponent(encodedTopic);
  const router  = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('notes');

  const { data: notesData, isLoading } = useNotes({ subject, page: 1 });
  const topicNotes = (notesData?.results ?? []).filter(
    (n) => (n.topic || 'Uncategorised') === topic
  );

  if (isLoading) return <LoadingPage />;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'notes',       label: 'Notes'       },
    { id: 'quiz',        label: 'Quiz'        },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{subject}</p>
          <h1 className="text-2xl font-bold text-foreground truncate">{topic}</h1>
        </div>
        <Link href={`/student/notes/upload?subject=${encodeURIComponent(subject)}`}>
          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl">
            <Upload className="h-3.5 w-3.5" /> Upload
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              activeTab === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'notes'       && <NotesTab       notes={topicNotes} subject={subject} topic={topic} />}
      {activeTab === 'quiz'        && <QuizTab        subject={subject}  topic={topic} />}
      {activeTab === 'performance' && <PerformanceTab subject={subject}  topic={topic} />}
    </div>
  );
}
