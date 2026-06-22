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
import { uploadNote } from '@/lib/api/notes';
import { PageHeader } from '@/components/common/PageHeader';

export default function VisitorNoteUploadPage() {
  const router = useRouter();
  const [file, setFile]           = useState<File | null>(null);
  const [progress, setProgress]   = useState(0);
  const [uploading, setUploading] = useState(false);

  const getNoteType = (f: File): string => {
    if (f.type === 'application/pdf')  return 'pdf';
    if (f.type.startsWith('image/'))   return 'image';
    if (f.type.startsWith('audio/'))   return 'voice';
    return 'text';
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first'); return; }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('note_type', getNoteType(file));

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadNote(fd, setProgress);
      toast.success('Note uploaded! Processing now…');
      router.push(`/visitor/notes/${result.note_id}/status`);
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
        <PageHeader title="Upload a Note" description="Analyse and summarise your study notes with AI." />
      </div>

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Tip:</strong> Clear, well-lit photos of handwritten notes give the best results.
          PDFs with selectable text are processed faster than scanned images.
        </span>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-5">
          <NoteUploadDropzone
            onFile={setFile}
            file={file}
            onClear={() => setFile(null)}
            disabled={uploading}
          />

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

          <Button
            className="w-full bg-primary py-5 text-base hover:bg-primary/90"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? `Uploading… ${progress}%` : 'Upload & Build Study Guide →'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
