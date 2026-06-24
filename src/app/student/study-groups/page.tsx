'use client';
import { Users } from 'lucide-react';

export default function StudyGroupsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
        <Users className="h-10 w-10 text-primary" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Study Groups</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Collaborate with classmates, share notes, and study together. Coming soon.
        </p>
      </div>
      <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">Coming Soon</span>
    </div>
  );
}
