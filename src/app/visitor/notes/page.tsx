'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { NoteCard } from '@/components/notes/NoteCard';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';

export default function VisitorNotesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useNotes();

  const notes    = data?.results ?? [];
  const filtered = search
    ? notes.filter(
        (n) =>
          n.file_name.toLowerCase().includes(search.toLowerCase()) ||
          n.subject?.toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="My Notes"
          description={`${data?.count ?? 0} total notes`}
        />
        <Link href="/visitor/notes/upload">
          <Button className="shrink-0 gradient-primary text-white rounded-xl shadow-md shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> Upload Note
          </Button>
        </Link>
      </div>
      <Input
        placeholder="Search by filename or subjectâ€¦"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="font-medium">No notes yet</p>
          <p className="mt-1 text-sm">Upload your first note to try AI summarisation.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} basePath="/visitor/notes" />
          ))}
        </div>
      )}
    </div>
  );
}
