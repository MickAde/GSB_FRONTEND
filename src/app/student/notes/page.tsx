'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteCard } from '@/components/notes/NoteCard';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';

export default function StudentNotesPage() {
  const [search, setSearch]           = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const { data, isLoading } = useNotes();

  const notes = data?.results ?? [];

  const stats = {
    ready:      notes.filter((n) => n.status === 'READY').length,
    review:     notes.filter((n) => n.status === 'AWAITING_STUDENT_APPROVAL').length,
    processing: notes.filter((n) => n.status === 'PENDING_OCR' || n.status === 'PROCESSING_AI').length,
  };

  const subjects = useMemo(() => {
    const set = new Set(notes.map((n) => n.subject).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [notes]);

  const filtered = notes.filter((n) => {
    const matchSearch  = !search || n.file_name.toLowerCase().includes(search.toLowerCase()) || n.subject?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !activeSubject || n.subject === activeSubject;
    return matchSearch && matchSubject;
  });

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-4xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {notes.length === 0
              ? 'No notes yet â€” upload your first one!'
              : `${notes.length} note${notes.length !== 1 ? 's' : ''} in your library`}
          </p>
        </div>
        <Link href="/student/notes/upload">
          <Button className="shrink-0 bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Note
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {notes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.ready}</p>
            <p className="mt-0.5 text-xs font-medium text-emerald-600">Ready to study</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.review}</p>
            <p className="mt-0.5 text-xs font-medium text-amber-600">Needs review</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-violet-700">{stats.processing}</p>
            <p className="mt-0.5 text-xs font-medium text-violet-600">Processing</p>
          </div>
        </div>
      )}

      {/* Search + subject filter chips */}
      {notes.length > 0 && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes or subjectsâ€¦"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSubject(null)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                  activeSubject === null
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
                )}
              >
                All
              </button>
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSubject(s === activeSubject ? null : s)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    activeSubject === s
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes grid / empty states */}
      {notes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Your study library is empty</h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Upload a PDF, photo of your notes, or a voice recording â€” our AI will turn it into a study guide.
          </p>
          <Link href="/student/notes/upload" className="mt-5 inline-block">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Upload Your First Note
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          <p className="font-medium">No notes match your search</p>
          <p className="mt-1 text-sm">Try a different keyword or clear the subject filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} basePath="/student/notes" />
          ))}
        </div>
      )}
    </div>
  );
}
