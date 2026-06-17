'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/PageHeader';
import { NoteCard } from '@/components/notes/NoteCard';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';

export default function TeacherNotesPage() {
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
      <PageHeader
        title="My Notes"
        description={`${data?.count ?? 0} total`}
        actions={
          <Link href="/teacher/notes/upload">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Upload Note
            </Button>
          </Link>
        }
      />
      <Input
        placeholder="Search by filename or subjectâ€¦"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="font-medium">No notes yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} basePath="/teacher/notes" />
          ))}
        </div>
      )}
    </div>
  );
}
