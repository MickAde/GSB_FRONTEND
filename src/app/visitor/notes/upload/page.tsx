'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { NoteUploadDropzone } from '@/components/notes/NoteUploadDropzone';
import { uploadNote, combinedUploadNotes } from '@/lib/api/notes';
import { PageHeader } from '@/components/common/PageHeader';

function getNoteType(f: File): string {
  if (f.type === 'application/pdf') return 'pdf';
  if (f.type.startsWith('image/'))  return 'image';
  if (f.type.startsWith('audio/'))  return 'voice';
  if (f.type === 'text/plain')       return 'text';
  return 'doc';
}

export default function VisitorNoteUploadPage() {
  const router = useRouter();

  const [files, setFiles]         = useState<File[]>([]);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async () => {
    if (!files.length) { toast.error('Please select at least one file'); return; }

    setUploading(true);
    setProgress(0);

    try {
      if (files.length === 1) {
        const fd = new FormData();
        fd.append('file',      files[0]);
        fd.append('note_type', getNoteType(files[0]));

        const result = await uploadNote(fd, setProgress);
        toast.success('Note uploaded! Processing now…');
        router.push(`/visitor/notes/${result.note_id}/status`);
      } else {
        // Multiple files — combine into ONE note with ONE summary
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));

        const result = await combinedUploadNotes(fd, setProgress);
        toast.success(`${files.length} files combined into one note — extracting text now…`);
        router.push(`/visitor/notes/${result.note_id}/status`);
      }
    } catch {
      toast.error('Upload failed. Please try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <Link href="/visitor/notes">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 text-muted-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" /> My Notes
          </Button>
        </Link>
        <PageHeader title="Upload Notes" description="Upload up to 10 notes at once — AI will summarise each one automatically." />
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Tip:</strong> Clear, well-lit photos of handwritten notes give the best results.
          Word and PowerPoint files are supported — no scanning needed.
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

          <Button
            className="w-full bg-primary py-5 text-base hover:bg-primary/90"
            disabled={!files.length || uploading}
            onClick={handleUpload}
          >
            {uploading
              ? `Uploading… ${progress}%`
              : files.length > 1
              ? `Upload ${files.length} Notes →`
              : 'Upload & Build Study Guide →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
