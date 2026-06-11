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

export default function StudentNoteUploadPage() {
  const router = useRouter();
  const [file, setFile]       = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const getNoteType = (file: File): string => {
    if (file.type === 'application/pdf') return 'pdf';
    if (file.type.startsWith('image/'))  return 'image';
    if (file.type.startsWith('audio/'))  return 'voice';
    return 'text';
  };

  const handleSubmit = async (meta: Fields) => {
    if (!file) { toast.error('Please select a file first'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('note_type', getNoteType(file));
    if (meta.subject)  fd.append('subject', meta.subject);
    if (meta.topic)    fd.append('topic', meta.topic);
    if (meta.subtopic) fd.append('subtopic', meta.subtopic);

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadNote(fd, setProgress);
      toast.success('Note uploaded successfully');
      router.push(`/student/notes/${result.note_id}/status`);
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Upload a Note" description="Upload a PDF, image, audio, or text file for AI summarisation." />

      <Card>
        <CardContent className="space-y-5 pt-5">
          <NoteUploadDropzone
            onFile={setFile}
            file={file}
            onClear={() => setFile(null)}
            disabled={uploading}
          />

          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input {...form.register('subject')} placeholder="e.g. Biology" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Topic</Label>
                <Input {...form.register('topic')} placeholder="e.g. Photosynthesis" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Subtopic</Label>
                <Input {...form.register('subtopic')} placeholder="Optional" disabled={uploading} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" type="button" onClick={() => router.back()} disabled={uploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                disabled={!file || uploading}
              >
                {uploading ? `Uploading ${progress}%…` : 'Upload & Process Note →'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
