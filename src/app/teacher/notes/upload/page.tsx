'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { NoteUploadDropzone } from '@/components/notes/NoteUploadDropzone';
import { uploadNote, combinedUploadNotes } from '@/lib/api/notes';
import { getSubjectsForClass } from '@/lib/api/schools';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

const schema = z.object({
  subject:  z.string().min(1, 'Subject is required'),
  topic:    z.string().optional(),
  subtopic: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

function getNoteType(f: File): string {
  if (f.type === 'application/pdf')  return 'pdf';
  if (f.type.startsWith('image/'))   return 'image';
  if (f.type.startsWith('audio/'))   return 'voice';
  if (f.type === 'text/plain')        return 'text';
  return 'doc';
}

export default function TeacherNoteUploadPage() {
  const router = useRouter();
  const [files, setFiles]         = useState<File[]>([]);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

  // Fetch all school subjects (no classId = school-wide)
  const { data: subjects = [] } = useQuery({
    queryKey: queryKeys.subjects(null),
    queryFn:  () => getSubjectsForClass(null),
    staleTime: 5 * 60 * 1000,
  });

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', topic: '', subtopic: '' },
  });

  const subjectValue = form.watch('subject');

  const handleFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const fresh    = incoming.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...fresh].slice(0, 10);
    });
  };

  const handleClear = (index?: number) => {
    if (index === undefined) { setFiles([]); return; }
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (meta: Fields) => {
    if (!files.length) { toast.error('Please select at least one file'); return; }

    setUploading(true);
    setProgress(0);

    try {
      if (files.length === 1) {
        const fd = new FormData();
        fd.append('file',      files[0]);
        fd.append('note_type', getNoteType(files[0]));
        fd.append('subject',   meta.subject);
        if (meta.topic)    fd.append('topic',    meta.topic);
        if (meta.subtopic) fd.append('subtopic', meta.subtopic);

        const result = await uploadNote(fd, setProgress);
        toast.success('Note uploaded! Processing now…');
        router.push(`/teacher/notes/${result.note_id}/status`);
      } else {
        // Multiple files → combine into ONE note with ONE AI summary
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        fd.append('subject', meta.subject);
        if (meta.topic)    fd.append('topic',    meta.topic);
        if (meta.subtopic) fd.append('subtopic', meta.subtopic);

        const result = await combinedUploadNotes(fd, setProgress);
        toast.success(`${files.length} files combined into one note — extracting text now…`);
        router.push(`/teacher/notes/${result.note_id}/status`);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">

      <div>
        <Link href="/teacher/notes">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> My Notes
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Upload a Reference Note</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload up to 10 files at once — PDF, images, Word, PowerPoint, audio, or text.
          Multiple files are combined into one note for conformity comparison.
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Tip:</strong> The subject you pick here must match what students use
          so conformity reports can correctly compare the two notes.
        </span>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-5">

          <NoteUploadDropzone
            onFiles={handleFiles}
            files={files}
            onClear={handleClear}
            disabled={uploading}
            maxFiles={10}
          />

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading {files.length > 1 ? `${files.length} notes` : 'your note'}…</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">Don&apos;t close this tab while uploading.</p>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Subject — DB-backed chips + free-text input */}
            <div className="space-y-2">
              <Label className="font-semibold">
                Subject <span className="font-normal text-red-500">*</span>
              </Label>
              <Input
                {...form.register('subject')}
                placeholder={subjects.length ? 'Pick a subject below or type one…' : 'e.g. Chemistry'}
                disabled={uploading}
                className={form.formState.errors.subject ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {form.formState.errors.subject && (
                <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
              )}
              {subjects.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        form.setValue('subject', subjectValue === s.name ? '' : s.name, { shouldValidate: true })
                      }
                      disabled={uploading}
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                        subjectValue === s.name
                          ? 'border-primary bg-primary text-white'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Topic <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input {...form.register('topic')} placeholder="e.g. Organic Chemistry" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Subtopic <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input {...form.register('subtopic')} placeholder="e.g. Alkenes" disabled={uploading} />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary py-5 text-base hover:bg-primary/90"
              disabled={!files.length || uploading}
            >
              {uploading
                ? `Uploading… ${progress}%`
                : files.length > 1
                ? `Upload ${files.length} Notes & Combine →`
                : 'Upload Note →'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
