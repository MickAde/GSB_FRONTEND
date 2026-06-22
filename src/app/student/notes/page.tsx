'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, ChevronDown, Upload, Plus, BookOpen,
  FolderOpen, X, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';
import { useAuthStore } from '@/stores/authStore';
import { STANDARD_SUBJECTS } from '@/lib/subjects';
import { formatDate, cn } from '@/lib/utils';
import type { NoteListItem, NoteType } from '@/types';

// ── compact note row ──────────────────────────────────────────────────────────

const TYPE_ICON_COLOR: Record<NoteType, string> = {
  pdf:   'text-red-500',
  image: 'text-blue-500',
  voice: 'text-purple-500',
  text:  'text-amber-500',
};

function NoteRow({ note, basePath }: { note: NoteListItem; basePath: string }) {
  const href = note.status === 'AWAITING_STUDENT_APPROVAL' || note.status === 'FAILED'
    ? `${basePath}/${note.id}/review`
    : `${basePath}/${note.id}`;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <span className={cn('shrink-0 text-xs font-bold uppercase tracking-wide', TYPE_ICON_COLOR[note.note_type])}>
        {note.note_type}
      </span>
      <span className="flex-1 truncate font-medium text-foreground">{note.file_name}</span>
      <NoteStatusBadge status={note.status} />
      <span className="shrink-0 text-[11px] text-muted-foreground/60">{formatDate(note.created_at)}</span>
    </Link>
  );
}

// ── subject accordion row ─────────────────────────────────────────────────────

function SubjectRow({
  subject,
  notes,
  isOpen,
  onToggle,
}: {
  subject: string;
  notes: NoteListItem[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();

  // Group notes by topic within this subject
  const topicGroups = useMemo(() => {
    const map = new Map<string, NoteListItem[]>();
    for (const note of notes) {
      const key = note.topic?.trim() || '';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(note);
    }
    return map;
  }, [notes]);

  const count = notes.length;
  const hasNotes = count > 0;

  return (
    <div className={cn('rounded-2xl border transition-colors', isOpen ? 'border-primary/30 bg-primary/5' : 'border-border bg-card')}>
      {/* Header row — click to expand/collapse */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', isOpen ? 'bg-primary/15' : 'bg-muted')}>
          <BookOpen className={cn('h-4 w-4', isOpen ? 'text-primary' : 'text-muted-foreground')} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('truncate text-sm font-semibold', isOpen ? 'text-primary' : 'text-foreground')}>
            {subject}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasNotes ? `${count} note${count !== 1 ? 's' : ''}` : 'No notes yet'}
          </p>
        </div>

        {hasNotes && (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            {count}
          </span>
        )}

        {isOpen
          ? <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
          : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-primary/20 px-5 pb-5 pt-4 space-y-4">

          {hasNotes ? (
            Array.from(topicGroups.entries()).map(([topic, topicNotes]) => (
              <div key={topic || '__no_topic__'} className="space-y-2">
                {topic && (
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {topic}
                    </p>
                    <span className="text-xs text-muted-foreground/60">({topicNotes.length})</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  {topicNotes.map((note) => (
                    <NoteRow key={note.id} note={note} basePath="/student/notes" />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border py-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">No notes yet for {subject}</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload your first note below.</p>
            </div>
          )}

          <Button
            onClick={() => router.push(`/student/notes/upload?subject=${encodeURIComponent(subject)}`)}
            variant="outline"
            size="sm"
            className="w-full rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            Upload to {subject}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── add subject inline form ───────────────────────────────────────────────────

function AddSubjectRow({ onAdd }: { onAdd: (name: string) => void }) {
  const [open,  setOpen]  = useState(false);
  const [value, setValue] = useState('');

  const submit = () => {
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue('');
    setOpen(false);
    toast.success(`"${name}" added to your subjects.`);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-border px-5 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Add Subject
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border-2 border-primary/30 bg-primary/5 px-5 py-3">
      <Plus className="h-4 w-4 shrink-0 text-primary" />
      <Input
        autoFocus
        placeholder="Subject name…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        className="h-8 flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
      />
      <button type="button" onClick={submit} disabled={!value.trim()} className="text-primary hover:text-primary/80 disabled:opacity-40">
        <Check className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function StudentNotesPage() {
  const { userId } = useAuthStore();
  const storageKey = `gsb_custom_subjects_${userId ?? 'local'}`;

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [customSubjects,  setCustomSubjects]  = useState<string[]>([]);

  // Hydrate custom subjects from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCustomSubjects(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  const addCustomSubject = (name: string) => {
    setCustomSubjects((prev) => {
      const updated = [...prev, name];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
    setExpandedSubject(name); // auto-open the new subject
  };

  const { data, isLoading } = useNotes();
  const notes = data?.results ?? [];

  // Group notes by subject
  const notesBySubject = useMemo(() => {
    const map = new Map<string, NoteListItem[]>();
    for (const note of notes) {
      const subj = note.subject?.trim() || 'Uncategorized';
      if (!map.has(subj)) map.set(subj, []);
      map.get(subj)!.push(note);
    }
    return map;
  }, [notes]);

  // Merge all subjects: standard first, then custom, then any notes subjects not in either list
  const allSubjects = useMemo(() => {
    const noteSubjects = Array.from(notesBySubject.keys()).filter(
      (s) => s !== 'Uncategorized' && !STANDARD_SUBJECTS.includes(s as never) && !customSubjects.includes(s),
    );
    return [...STANDARD_SUBJECTS, ...customSubjects, ...noteSubjects];
  }, [notesBySubject, customSubjects]);

  // Stats
  const stats = {
    total:      notes.length,
    ready:      notes.filter((n) => n.status === 'READY').length,
    review:     notes.filter((n) => n.status === 'AWAITING_STUDENT_APPROVAL').length,
    processing: notes.filter((n) => n.status === 'PENDING_OCR' || n.status === 'PROCESSING_AI').length,
  };

  const uncategorized = notesBySubject.get('Uncategorized') ?? [];

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-2xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Notes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {stats.total === 0 ? 'Select a subject below to upload your first note.' : `${stats.total} note${stats.total !== 1 ? 's' : ''} across your subjects`}
          </p>
        </div>
        <Link href="/student/notes/upload">
          <Button className="shrink-0 gradient-primary text-white rounded-xl shadow-md shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> New Note
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.ready}</p>
            <p className="mt-0.5 text-xs font-medium text-emerald-600">Ready</p>
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

      {/* Subject list */}
      <div className="space-y-2">
        {allSubjects.map((subject) => (
          <SubjectRow
            key={subject}
            subject={subject}
            notes={notesBySubject.get(subject) ?? []}
            isOpen={expandedSubject === subject}
            onToggle={() => setExpandedSubject((prev) => (prev === subject ? null : subject))}
          />
        ))}

        {/* Uncategorized notes (no subject set) */}
        {uncategorized.length > 0 && (
          <SubjectRow
            key="Uncategorized"
            subject="Uncategorized"
            notes={uncategorized}
            isOpen={expandedSubject === 'Uncategorized'}
            onToggle={() => setExpandedSubject((prev) => (prev === 'Uncategorized' ? null : 'Uncategorized'))}
          />
        )}

        {/* Add subject */}
        <AddSubjectRow onAdd={addCustomSubject} />
      </div>
    </div>
  );
}
