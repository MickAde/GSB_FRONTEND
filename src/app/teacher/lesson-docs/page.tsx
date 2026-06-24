'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, FileText, Brain, Clock, CheckCircle, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getLessonDocs } from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { LessonDocListItem, LessonDocStatus } from '@/types';

const STATUS_CONFIG: Record<LessonDocStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft:           { label: 'Draft',           color: 'bg-muted text-muted-foreground',         icon: FileText    },
  generating:      { label: 'Generating…',     color: 'bg-blue-100 text-blue-700',              icon: Loader2     },
  submitted:       { label: 'Submitted',        color: 'bg-amber-100 text-amber-700',            icon: Clock       },
  under_review:    { label: 'Under Review',    color: 'bg-orange-100 text-orange-700',          icon: Clock       },
  revision_needed: { label: 'Needs Revision',  color: 'bg-red-100 text-red-700',               icon: AlertCircle },
  approved:        { label: 'Approved',         color: 'bg-green-100 text-green-700',            icon: CheckCircle },
  distributed:     { label: 'Distributed',     color: 'bg-emerald-100 text-emerald-700',        icon: CheckCircle },
};

type FilterType = 'all' | 'plan' | 'note';
type FilterStatus = 'all' | LessonDocStatus;

function DocCard({ doc }: { doc: LessonDocListItem }) {
  const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  const termLabel = `${doc.term}${doc.term === 1 ? 'st' : doc.term === 2 ? 'nd' : 'rd'} Term`;

  return (
    <Link
      href={`/teacher/lesson-docs/${doc.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', doc.doc_type === 'plan' ? 'bg-blue-100' : 'bg-purple-100')}>
        {doc.doc_type === 'plan' ? <BookOpen className="h-5 w-5 text-blue-600" /> : <Brain className="h-5 w-5 text-purple-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-foreground truncate">{doc.title || doc.topic}</p>
          <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.color)}>
            <Icon className={cn('h-3 w-3', doc.status === 'generating' && 'animate-spin')} />
            {cfg.label}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground truncate">{doc.subject} · {doc.topic}</p>
        <p className="mt-1 text-xs text-muted-foreground">{doc.class_level} · {termLabel}, Week {doc.week}</p>
        {doc.board_summary && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 italic">"{doc.board_summary}"</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1" />
    </Link>
  );
}

export default function LessonDocsListPage() {
  const [typeFilter,   setTypeFilter]   = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.lessonDocs.all({ doc_type: typeFilter === 'all' ? undefined : typeFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
    queryFn:  () => getLessonDocs({
      doc_type: typeFilter   === 'all' ? undefined : typeFilter,
      status:   statusFilter === 'all' ? undefined : statusFilter,
    }),
  });

  const docs = data ?? [];

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lesson Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/teacher/lesson-docs/create">
          <Button className="gradient-primary h-10 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90">
            <Plus className="h-4 w-4" /> New Document
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'plan', 'note'] as FilterType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            {t === 'all' ? 'All Types' : t === 'plan' ? 'Lesson Plans' : 'Lesson Notes'}
          </button>
        ))}
        <span className="text-muted-foreground/40 self-center">|</span>
        {(['all', 'draft', 'submitted', 'revision_needed', 'approved', 'distributed'] as (FilterStatus)[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}
          >
            {s === 'all' ? 'All Status' : STATUS_CONFIG[s as LessonDocStatus]?.label ?? s}
          </button>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Brain className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-4 font-medium text-muted-foreground">No lesson documents yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first AI-generated lesson plan or note.</p>
          <Link href="/teacher/lesson-docs/create">
            <Button className="mt-4 gap-2 rounded-xl" size="sm">
              <Plus className="h-3.5 w-3.5" /> Create Document
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => <DocCard key={doc.id} doc={doc} />)}
        </div>
      )}
    </div>
  );
}
