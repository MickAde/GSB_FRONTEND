'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, X, Check, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';
import { useAuthStore } from '@/stores/authStore';
import { getPerformanceStats } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';
import { STANDARD_SUBJECTS } from '@/lib/subjects';
import { cn } from '@/lib/utils';

const STORAGE_KEY = (uid: string) => `gsb_custom_subjects_${uid}`;

function SubjectCard({
  subject,
  noteCount,
  quizCount,
  avgScore,
}: {
  subject: string;
  noteCount: number;
  quizCount: number;
  avgScore: number | null;
}) {
  const scoreColor =
    avgScore === null ? 'text-muted-foreground'
    : avgScore >= 70  ? 'text-emerald-600'
    : avgScore >= 50  ? 'text-amber-500'
    : 'text-red-500';

  return (
    <Link
      href={`/student/subjects/${encodeURIComponent(subject)}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <BookOpen className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{subject}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {noteCount} {noteCount === 1 ? 'note' : 'notes'} · {quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'}
        </p>
      </div>
      {avgScore !== null && (
        <span className={cn('shrink-0 text-sm font-bold', scoreColor)}>{Math.round(avgScore)}%</span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </Link>
  );
}

function AddSubjectRow({
  onAdd,
}: {
  onAdd: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-5 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary w-full"
      >
        <Plus className="h-4 w-4" /> Add Subject
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-card px-4 py-3">
      <Input
        autoFocus
        placeholder="Subject name…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setOpen(false); }}
        className="h-8 flex-1 text-sm"
      />
      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={commit}><Check className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
    </div>
  );
}

export default function SubjectsPage() {
  const { userId } = useAuthStore();
  const { data: notesData, isLoading } = useNotes({ page: 1 });
  const { data: perf } = useQuery({ queryKey: queryKeys.quiz.performance(), queryFn: getPerformanceStats });

  const [customSubjects, setCustomSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY(userId));
      setCustomSubjects(stored ? JSON.parse(stored) : []);
    } catch { setCustomSubjects([]); }
  }, [userId]);

  const saveCustom = (list: string[]) => {
    setCustomSubjects(list);
    if (userId) localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(list));
  };

  const addSubject = (name: string) => {
    const all = [...STANDARD_SUBJECTS as unknown as string[]];
    if (all.includes(name) || customSubjects.includes(name)) return;
    saveCustom([...customSubjects, name]);
  };

  // Build note + quiz counts per subject
  const allNotes = notesData?.results ?? [];
  const noteCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of allNotes) {
      if (n.subject) map[n.subject] = (map[n.subject] ?? 0) + 1;
    }
    return map;
  }, [allNotes]);

  const quizCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of perf?.subjects ?? []) {
      map[s.subject] = s.attempts;
    }
    return map;
  }, [perf]);

  const avgScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of perf?.subjects ?? []) {
      map[s.subject] = s.average;
    }
    return map;
  }, [perf]);

  // Only show subjects that have notes OR are standard (always visible)
  const allSubjectNames = [...STANDARD_SUBJECTS as unknown as string[], ...customSubjects];
  const enrolledSubjects = allSubjectNames.filter(
    (s) => (noteCounts[s] ?? 0) > 0 || (quizCounts[s] ?? 0) > 0
  );
  const emptySubjects = allSubjectNames.filter(
    (s) => (noteCounts[s] ?? 0) === 0 && (quizCounts[s] ?? 0) === 0
  );

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {enrolledSubjects.length} active · {allSubjectNames.length} total
          </p>
        </div>
        <Link href="/student/notes/upload">
          <Button className="gradient-primary h-10 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90">
            <Plus className="h-4 w-4" /> Upload Note
          </Button>
        </Link>
      </div>

      {enrolledSubjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Active Subjects</h2>
          <div className="space-y-2">
            {enrolledSubjects.map((s) => (
              <SubjectCard
                key={s}
                subject={s}
                noteCount={noteCounts[s] ?? 0}
                quizCount={quizCounts[s] ?? 0}
                avgScore={avgScores[s] ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {emptySubjects.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">All Subjects</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {emptySubjects.map((s) => (
              <Link
                key={s}
                href={`/student/subjects/${encodeURIComponent(s)}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                <span className="truncate">{s}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AddSubjectRow onAdd={addSubject} />
    </div>
  );
}
