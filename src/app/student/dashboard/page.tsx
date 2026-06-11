'use client';
import Link from 'next/link';
import { Upload, BookOpen, CheckCircle, Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyContentBanner } from '@/components/common/DailyContentBanner';
import { NoteCard } from '@/components/notes/NoteCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotes } from '@/hooks/useNotes';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';

export default function StudentDashboardPage() {
  const { data: user }              = useCurrentUser();
  const { data: notes, isLoading }  = useNotes();

  const greeting = useTimeGreeting();

  const totalNotes  = notes?.count ?? 0;
  const readyNotes  = notes?.results?.filter((n) => n.status === 'READY').length ?? 0;
  const subjects    = [...new Set(notes?.results?.map((n) => n.subject).filter(Boolean))].length;
  const needsReview = notes?.results?.filter((n) => n.status === 'AWAITING_STUDENT_APPROVAL').length ?? 0;

  const statCards = [
    { label: 'Total Notes',     value: totalNotes, icon: Layers,      bg: 'from-violet-50 to-white',   ring: 'text-primary',        iconBg: 'bg-primary/10' },
    { label: 'Summaries Ready', value: readyNotes, icon: CheckCircle, bg: 'from-emerald-50 to-white',  ring: 'text-emerald-600',    iconBg: 'bg-emerald-100' },
    { label: 'Subjects',        value: subjects,   icon: BookOpen,    bg: 'from-amber-50 to-white',    ring: 'text-amber-600',      iconBg: 'bg-amber-100' },
  ];

  return (
    <div className="max-w-5xl space-y-7">

      {/* ── Greeting header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {greeting && (
            <p className="text-sm font-medium text-muted-foreground">{greeting.text} {greeting.emoji}</p>
          )}
          <h1 className="mt-0.5 text-3xl font-bold font-display text-foreground">
            Hey, {user?.first_name ?? '…'}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            {totalNotes === 0 ? "Let's upload your first note and get studying 🚀" : 'Ready to keep learning?'}
          </p>
        </div>
        <Link href="/student/notes/upload">
          <Button className="gradient-primary h-11 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
            <Upload className="h-4 w-4" /> Upload Note
          </Button>
        </Link>
      </div>

      {/* ── Needs review alert ── */}
      {needsReview > 0 && (
        <Link href="/student/notes" className="block">
          <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
                <span className="text-lg">✏️</span>
              </div>
              <div>
                <p className="font-bold text-amber-800">
                  {needsReview} note{needsReview > 1 ? 's need' : ' needs'} your review
                </p>
                <p className="text-sm text-amber-600">Check the OCR text before your summary is generated.</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-amber-500" />
          </div>
        </Link>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, ring, iconBg }) => (
          <div
            key={label}
            className={`glass-panel rounded-2xl bg-gradient-to-br ${bg} p-5`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${ring}`} />
            </div>
            <p className={`mt-4 text-3xl font-black font-display ${ring}`}>{value}</p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Daily content banner ── */}
      <DailyContentBanner />

      {/* ── Recent notes ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-foreground">Recent Notes</h2>
          <Link href="/student/notes">
            <Button variant="ghost" className="gap-1 font-semibold text-primary hover:text-primary/80">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : notes?.results?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {notes.results.slice(0, 4).map((note) => (
              <NoteCard key={note.id} note={note} basePath="/student/notes" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">No notes yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Upload your first note to get started</p>
            </div>
            <Link href="/student/notes/upload">
              <Button className="gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90">
                Upload your first note →
              </Button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
