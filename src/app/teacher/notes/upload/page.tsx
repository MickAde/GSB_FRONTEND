'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/common/PageHeader';
import { NoteUploadDropzone } from '@/components/notes/NoteUploadDropzone';
import { uploadNote } from '@/lib/api/notes';

const schema = z.object({
  subject:  z.string().optional(),
  topic:    z.string().optional(),
  subtopic: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

function getNoteType(f: File): string {
  if (f.type === 'application/pdf') return 'pdf';
  if (f.type.startsWith('image/'))  return 'image';
  if (f.type.startsWith('audio/'))  return 'voice';
  if (f.type === 'text/plain')       return 'text';
  return 'doc';
}

export default function TeacherNoteUploadPage() {
  const router = useRouter();
  const [files, setFiles]         = useState<File[]>([]);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);
  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...incoming.filter((f) => !existing.has(f.name + f.size))].slice(0, 1);
    });
  };

  const handleSubmit = async (meta: Fields) => {
    if (!files.length) { toast.error('Please select a file first'); return; }
    const file = files[0];
    const fd = new FormData();
    fd.append('file',      file);
    fd.append('note_type', getNoteType(file));
    if (meta.subject)  fd.append('subject',  meta.subject);
    if (meta.topic)    fd.append('topic',    meta.topic);
    if (meta.subtopic) fd.append('subtopic', meta.subtopic);

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadNote(fd, setProgress);
      toast.success('Note uploaded successfully');
      router.push(`/teacher/notes/${result.note_id}/status`);
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Upload a Reference Note" description="Upload a teacher note for comparison in conformity reports." />
      <Card>
        <CardContent className="space-y-5 pt-5">
          <NoteUploadDropzone
            onFiles={handleFiles}
            files={files}
            onClear={(i) => setFiles((prev) => i === undefined ? [] : prev.filter((_, idx) => idx !== i))}
            disabled={uploading}
            maxFiles={1}
          />
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input {...form.register('subject')} placeholder="e.g. Chemistry" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Topic</Label>
                <Input {...form.register('topic')} placeholder="e.g. Organic Chemistry" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Subtopic</Label>
                <Input {...form.register('subtopic')} placeholder="Optional" disabled={uploading} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={uploading}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={!files.length || uploading}>
                {uploading ? `Uploading ${progress}%…` : 'Upload Note →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
