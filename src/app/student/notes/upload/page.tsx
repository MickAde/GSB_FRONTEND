'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { NoteUploadDropzone } from '@/components/notes/NoteUploadDropzone';
import { uploadNote, combinedUploadNotes } from '@/lib/api/notes';
import { STANDARD_SUBJECTS } from '@/lib/subjects';
import { ArrowLeft, Lightbulb, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  subject:  z.string().min(1, 'Subject is required'),
  topic:    z.string().optional(),
  subtopic: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

function getNoteType(f: File): string {
  if (f.type === 'application/pdf') return 'pdf';
  if (f.type.startsWith('image/'))  return 'image';
  if (f.type.startsWith('audio/'))  return 'voice';
  if (f.type === 'text/plain')       return 'text';
  // Word, PowerPoint, Excel, and any other file → AI-powered doc extraction
  return 'doc';
}

export default function StudentNoteUploadPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const prefilledSubject = searchParams.get('subject') ?? '';
  const subjectLocked    = prefilledSubject !== '';

  const [files, setFiles]         = useState<File[]>([]);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { subject: prefilledSubject, topic: '', subtopic: '' },
  });

  useEffect(() => {
    if (prefilledSubject) form.setValue('subject', prefilledSubject, { shouldValidate: true });
  }, [prefilledSubject, form]);

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
        router.push(`/student/notes/${result.note_id}/status`);
      } else {
        // Multiple files — combine into ONE note with ONE summary
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        fd.append('subject', meta.subject);
        if (meta.topic)    fd.append('topic',    meta.topic);
        if (meta.subtopic) fd.append('subtopic', meta.subtopic);

        const result = await combinedUploadNotes(fd, setProgress);
        toast.success(`${files.length} files combined into one note — extracting text now…`);
        router.push(`/student/notes/${result.note_id}/status`);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const subjectValue = form.watch('subject');

  return (
    <div className="max-w-2xl space-y-5">

      <div>
        <Link href="/student/notes">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {subjectLocked ? prefilledSubject : 'My Notes'}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subjectLocked
            ? `Uploading under ${prefilledSubject}. AI will build a smart study guide automatically.`
            : 'Upload up to 10 notes at once — PDF, images, Word, PowerPoint, audio, or text.'}
        </p>
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Tip:</strong> Clear, well-lit photos of handwritten notes give the best results.
          Word and PowerPoint files are processed automatically — no scanning needed.
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

            <div className="space-y-2">
              <Label className="font-semibold">
                Subject{' '}
                {subjectLocked
                  ? <span className="inline-flex items-center gap-1 font-normal text-muted-foreground"><Lock className="h-3 w-3" /> locked</span>
                  : <span className="font-normal text-red-500">*</span>
                }
              </Label>

              {subjectLocked ? (
                <div className="flex h-10 items-center rounded-xl border border-primary/40 bg-primary/5 px-3 text-sm font-semibold text-primary">
                  {prefilledSubject}
                </div>
              ) : (
                <>
                  <Input
                    {...form.register('subject')}
                    placeholder="Type or pick a subject below…"
                    disabled={uploading}
                    className={form.formState.errors.subject ? 'border-red-400 focus-visible:ring-red-400' : ''}
                  />
                  {form.formState.errors.subject && (
                    <p className="text-xs text-red-500">{form.formState.errors.subject.message}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {STANDARD_SUBJECTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => form.setValue('subject', subjectValue === s ? '' : s, { shouldValidate: true })}
                        disabled={uploading}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                          subjectValue === s
                            ? 'border-primary bg-primary text-white'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Topic <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input {...form.register('topic')} placeholder="e.g. Photosynthesis" disabled={uploading} />
              </div>
              <div className="space-y-1">
                <Label>Subtopic <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <Input {...form.register('subtopic')} placeholder="e.g. Light reactions" disabled={uploading} />
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
                ? `Upload ${files.length} Notes & Build Study Guides →`
                : 'Upload & Build Study Guide →'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
