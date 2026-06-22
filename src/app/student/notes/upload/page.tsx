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
import { uploadNote } from '@/lib/api/notes';
import { STANDARD_SUBJECTS } from '@/lib/subjects';
import { ArrowLeft, Lightbulb, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  subject:  z.string().min(1, 'Subject is required'),
  topic:    z.string().optional(),
  subtopic: z.string().optional(),
});
type Fields = z.infer<typeof schema>;

export default function StudentNoteUploadPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Subject from URL param — when navigating from a subject row in notes page
  const prefilledSubject = searchParams.get('subject') ?? '';
  const subjectLocked    = prefilledSubject !== '';

  const [file, setFile]           = useState<File | null>(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { subject: prefilledSubject, topic: '', subtopic: '' },
  });

  // Sync prefilled subject if URL param changes after mount
  useEffect(() => {
    if (prefilledSubject) form.setValue('subject', prefilledSubject, { shouldValidate: true });
  }, [prefilledSubject, form]);

  const getNoteType = (f: File): string => {
    if (f.type === 'application/pdf')  return 'pdf';
    if (f.type.startsWith('image/'))   return 'image';
    if (f.type.startsWith('audio/'))   return 'voice';
    return 'text';
  };

  const handleSubmit = async (meta: Fields) => {
    if (!file) { toast.error('Please select a file first'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('note_type', getNoteType(file));
    fd.append('subject', meta.subject);
    if (meta.topic)    fd.append('topic',    meta.topic);
    if (meta.subtopic) fd.append('subtopic', meta.subtopic);

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadNote(fd, setProgress);
      toast.success('Note uploaded! Processing now…');
      router.push(`/student/notes/${result.note_id}/status`);
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  const subjectValue = form.watch('subject');

  return (
    <div className="max-w-2xl space-y-5">

      {/* Back + heading */}
      <div>
        <Link href="/student/notes">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {subjectLocked ? `${prefilledSubject}` : 'My Notes'}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Add a Note</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subjectLocked
            ? `Uploading under ${prefilledSubject}. AI will build a smart study guide automatically.`
            : 'Upload any note and our AI will build you a smart study guide automatically.'}
        </p>
      </div>

      {/* Tip banner */}
      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Tip:</strong> Clear, well-lit photos of handwritten notes give the best results.
          For PDFs, digital text files are processed faster than scanned ones.
        </span>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-5">

          {/* Dropzone */}
          <NoteUploadDropzone
            onFile={setFile}
            file={file}
            onClear={() => setFile(null)}
            disabled={uploading}
          />

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading your note…</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">Don&apos;t close this tab while uploading.</p>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* Subject — required */}
            <div className="space-y-2">
              <Label className="font-semibold">
                Subject{' '}
                {subjectLocked
                  ? <span className="inline-flex items-center gap-1 font-normal text-muted-foreground"><Lock className="h-3 w-3" /> locked</span>
                  : <span className="font-normal text-red-500">*</span>
                }
              </Label>

              {subjectLocked ? (
                /* Read-only locked chip */
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
                  {/* Quick-pick chips — all standard subjects */}
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

            {/* Topic + Subtopic */}
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

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-primary py-5 text-base hover:bg-primary/90"
              disabled={!file || uploading}
            >
              {uploading ? `Uploading… ${progress}%` : 'Upload & Build Study Guide →'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
