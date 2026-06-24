'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, AlertCircle, ChevronRight, BookOpen, Brain, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAdminLessonDocs } from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { LessonDocListItem, LessonDocStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted:       { label: 'Submitted',       color: 'bg-amber-100 text-amber-700',   icon: Clock       },
  under_review:    { label: 'Under Review',    color: 'bg-orange-100 text-orange-700', icon: Clock       },
  revision_needed: { label: 'Needs Revision',  color: 'bg-red-100 text-red-700',       icon: AlertCircle },
  approved:        { label: 'Approved',         color: 'bg-green-100 text-green-700',   icon: CheckCircle },
  distributed:     { label: 'Distributed',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

type FilterType = 'all' | 'plan' | 'note';
type FilterStatus = 'all' | 'submitted' | 'under_review' | 'revision_needed' | 'approved' | 'distributed';

function DocRow({ doc }: { doc: LessonDocListItem }) {
  const cfg = STATUS_CONFIG[doc.status] ?? { label: doc.status, color: 'bg-muted text-muted-foreground', icon: FileText };
  const Icon = cfg.icon;
  return (
    <Link
      href={`/admin/lesson-docs/${doc.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', doc.doc_type === 'plan' ? 'bg-blue-100' : 'bg-purple-100')}>
        {doc.doc_type === 'plan' ? <BookOpen className="h-4 w-4 text-blue-600" /> : <Brain className="h-4 w-4 text-purple-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{doc.title || doc.topic}</p>
        <p className="text-xs text-muted-foreground">{doc.teacher_name} · {doc.subject} · {doc.class_level}</p>
      </div>
      <span className={cn('shrink-0 hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', cfg.color)}>
        <Icon className="h-3 w-3" /> {cfg.label}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground hidden md:block">{formatDate(doc.updated_at)}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary" />
    </Link>
  );
}

export default function AdminLessonDocsPage() {
  const [typeFilter,   setTypeFilter]   = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('submitted');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.lessonDocs.adminAll({ doc_type: typeFilter === 'all' ? undefined : typeFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
    queryFn:  () => getAdminLessonDocs({ doc_type: typeFilter === 'all' ? undefined : typeFilter, status: statusFilter === 'all' ? undefined : statusFilter }),
  });

  const docs = data ?? [];

  const counts = {
    submitted:       docs.filter((d) => d.status === 'submitted').length,
    under_review:    docs.filter((d) => d.status === 'under_review').length,
    revision_needed: docs.filter((d) => d.status === 'revision_needed').length,
    approved:        docs.filter((d) => d.status === 'approved').length,
    distributed:     docs.filter((d) => d.status === 'distributed').length,
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Lesson Document Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and approve teacher-submitted lesson plans and notes.</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {statusFilter === 'all' && (
          Object.entries(counts).map(([s, count]) => {
            const cfg = STATUS_CONFIG[s];
            if (!cfg || count === 0) return null;
            const Icon = cfg.icon;
            return (
              <span key={s} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium', cfg.color)}>
                <Icon className="h-3 w-3" /> {count} {cfg.label}
              </span>
            );
          })
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'plan', 'note'] as FilterType[]).map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {t === 'all' ? 'All Types' : t === 'plan' ? 'Lesson Plans' : 'Lesson Notes'}
          </button>
        ))}
        <span className="text-muted-foreground/40 self-center">|</span>
        {(['all', 'submitted', 'under_review', 'revision_needed', 'approved', 'distributed'] as FilterStatus[]).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
            {s === 'all' ? 'All Status' : STATUS_CONFIG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No documents match the selected filters.
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => <DocRow key={doc.id} doc={doc} />)}
        </div>
      )}
    </div>
  );
}
