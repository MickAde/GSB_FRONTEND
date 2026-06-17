'use client';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';

export default function VisitorNoteUploadPage() {
  return (
    <div className="max-w-md space-y-6">
      <PageHeader title="Upload a Note" description="Analyse and summarise your study notes with AI." />
      <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-border py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="px-6">
          <p className="font-bold text-foreground">Note upload is not available for visitors</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Note uploads require a school account. Ask your school admin to create a student or teacher account for you.
          </p>
        </div>
        <Link href="/visitor/notes">
          <Button variant="outline">Back to My Notes</Button>
        </Link>
      </div>
    </div>
  );
}
