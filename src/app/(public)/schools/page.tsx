'use client';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, Loader2 } from 'lucide-react';
import { SchoolGrid } from '@/components/schools/SchoolGrid';
import { getActiveSchools } from '@/lib/api/schools';
import { queryKeys } from '@/lib/query-keys';

export default function SchoolsPage() {
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.schools.active(),
    queryFn:  getActiveSchools,
  });

  const filtered = query
    ? (data ?? []).filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.slug.toLowerCase().includes(query.toLowerCase())
      )
    : (data ?? []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left Hero ── */}
      <div className="relative hidden lg:flex flex-col justify-center p-12 bg-primary overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/30 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white/90 mb-10">
            <BookOpen className="w-8 h-8" />
            <span className="text-xl font-bold font-display">Genius Study Buddy</span>
          </div>

          <h1 className="text-5xl font-display font-bold text-white mb-5 leading-tight">
            Find your school<br />
            <span className="text-white/80">and start learning.</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md leading-relaxed">
            Select your school from the list to sign in as a student, teacher, or admin.
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col bg-background min-h-screen">
        <div className="flex-1 p-6 md:p-10 max-w-xl mx-auto w-full">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BookOpen className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold font-display text-primary">Genius Study Buddy</span>
          </div>

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Select Your School</h2>
            <p className="text-muted-foreground text-sm mt-1">Choose your school to continue</p>
          </div>

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search school name…"
              value={query}
              onChange={handleSearch}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
            />
          </div>

          {/* Schools grid */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading schools…
            </div>
          ) : (
            <SchoolGrid schools={filtered} />
          )}


        </div>
      </div>

    </div>
  );
}
