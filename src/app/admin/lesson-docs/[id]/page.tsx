'use client';
import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Brain, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, MessageSquare } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getAdminLessonDocDetail, reviewLessonDoc } from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { DiagnosticCard, LessonDocDetail } from '@/types';

// ── Pure-TS minimal markdown → HTML (for read-only preview) ────────────────
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-5 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-extrabold mt-6 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2 text-sm leading-relaxed">')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : `<p class="mb-2 text-sm leading-relaxed">${m}</p>`);
}

// ── Diagnostic Card ────────────────────────────────────────────────────────
function DiagCard({ card, expanded, onToggle }: { card: DiagnosticCard; expanded: boolean; onToggle: () => void }) {
  const isRed = card.urgency === 'red';
  return (
    <div className={cn('rounded-xl border p-4', isRed ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50')}>
      <button className="flex w-full items-start justify-between gap-2 text-left" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn('h-4 w-4 shrink-0', isRed ? 'text-red-500' : 'text-amber-500')} />
          <span className={cn('text-sm font-semibold', isRed ? 'text-red-800' : 'text-amber-800')}>{card.title}</span>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">{card.description}</p>
          {card.section && <p className="text-xs text-muted-foreground">Section: <span className="font-medium">{card.section}</span></p>}
          {card.suggestion && <p className={cn('text-xs font-medium mt-1', isRed ? 'text-red-700' : 'text-amber-700')}>{card.suggestion}</p>}
        </div>
      )}
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  submitted:       'bg-amber-100 text-amber-700',
  under_review:    'bg-orange-100 text-orange-700',
  revision_needed: 'bg-red-100 text-red-700',
  approved:        'bg-green-100 text-green-700',
  distributed:     'bg-emerald-100 text-emerald-700',
  draft:           'bg-muted text-muted-foreground',
  generating:      'bg-blue-100 text-blue-700',
};

export default function AdminLessonDocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [adminComments, setAdminComments] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { data: doc, isLoading } = useQuery({
    queryKey: queryKeys.lessonDocs.adminDetail(id),
    queryFn:  () => getAdminLessonDocDetail(id),
  });

  const { mutate: review, isPending } = useMutation({
    mutationFn: ({ action, comments }: { action: 'approve' | 'request_revision'; comments?: string }) =>
      reviewLessonDoc(id, { action, admin_comments: comments }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.lessonDocs.adminDetail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.lessonDocs.adminAll() });
      toast.success(updated.status === 'approved' ? 'Document approved.' : 'Revision requested.');
      router.push('/admin/lesson-docs');
    },
    onError: () => toast.error('Action failed. Please try again.'),
  });

  const toggleCard = (cardId: string) =>
    setExpandedCards((prev) => { const n = new Set(prev); n.has(cardId) ? n.delete(cardId) : n.add(cardId); return n; });

  if (isLoading || !doc) return <LoadingPage />;

  const canReview = ['submitted', 'under_review'].includes(doc.status);
  const redCards  = doc.diagnostic_cards?.filter((c) => c.urgency === 'red')  ?? [];
  const yellowCards = doc.diagnostic_cards?.filter((c) => c.urgency === 'yellow') ?? [];

  return (
    <div className="flex h-full min-h-screen flex-col gap-0">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', doc.doc_type === 'plan' ? 'bg-blue-100' : 'bg-purple-100')}>
                {doc.doc_type === 'plan' ? <BookOpen className="h-4 w-4 text-blue-600" /> : <Brain className="h-4 w-4 text-purple-600" />}
              </div>
              <div>
                <p className="font-semibold text-foreground leading-tight">{doc.title || doc.topic}</p>
                <p className="text-xs text-muted-foreground">{doc.teacher_name} · {doc.subject} · {doc.class_level}</p>
              </div>
            </div>
          </div>
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_COLORS[doc.status] ?? 'bg-muted text-muted-foreground')}>
            {doc.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-0 overflow-hidden">
        {/* Left: Document content */}
        <div className="flex-1 overflow-y-auto p-6 border-r border-border">
          {doc.board_summary && (
            <div className="mb-6 rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Board Summary</p>
              <p className="text-sm text-foreground italic">"{doc.board_summary}"</p>
            </div>
          )}

          <div
            className="prose prose-sm max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content_markdown ?? '') }}
          />

          <p className="mt-8 text-xs text-muted-foreground">
            Submitted {formatDate(doc.updated_at)} · Week {doc.week}, Term {doc.term}
          </p>
        </div>

        {/* Right: Review panel */}
        <div className="w-full md:w-[360px] shrink-0 overflow-y-auto p-6 space-y-6">

          {/* Diagnostic summary */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">AI Diagnostics</h3>
            {doc.diagnostic_cards?.length ? (
              <div className="space-y-2">
                {redCards.length > 0 && (
                  <p className="text-xs text-red-600 font-medium">{redCards.length} critical issue{redCards.length > 1 ? 's' : ''}</p>
                )}
                {yellowCards.length > 0 && (
                  <p className="text-xs text-amber-600 font-medium">{yellowCards.length} improvement suggestion{yellowCards.length > 1 ? 's' : ''}</p>
                )}
                <div className="space-y-2 pt-1">
                  {doc.diagnostic_cards.map((card) => (
                    <DiagCard
                      key={card.id}
                      card={card}
                      expanded={expandedCards.has(card.id)}
                      onToggle={() => toggleCard(card.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No diagnostic issues flagged.</p>
            )}
          </div>

          {/* Resources */}
          {doc.resource_cards && doc.resource_cards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Suggested Resources</h3>
              <div className="space-y-2">
                {doc.resource_cards.map((res) => (
                  <div key={res.id} className="rounded-lg border border-border bg-card p-3">
                    <p className="text-xs font-semibold text-foreground">{res.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{res.description}</p>
                    <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">{res.type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing admin comments */}
          {doc.admin_comments && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground">Previous Comments</p>
              </div>
              <p className="text-sm text-foreground">{doc.admin_comments}</p>
            </div>
          )}

          {/* Review actions */}
          {canReview ? (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Review Decision</h3>

              <div className="space-y-1.5">
                <Label className="text-xs">Comments for Teacher <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea
                  value={adminComments}
                  onChange={(e) => setAdminComments(e.target.value)}
                  placeholder="Feedback, revision instructions, or approval notes…"
                  rows={4}
                  className="rounded-xl resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                  disabled={isPending}
                  onClick={() => review({ action: 'approve', comments: adminComments || undefined })}
                >
                  <CheckCircle className="h-4 w-4" />
                  {isPending ? 'Processing…' : doc.doc_type === 'note' ? 'Approve & Distribute to Students' : 'Approve Document'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 rounded-xl border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                  disabled={isPending}
                  onClick={() => {
                    if (!adminComments.trim()) {
                      toast.warning('Please add comments explaining what needs to be revised.');
                      return;
                    }
                    review({ action: 'request_revision', comments: adminComments });
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Request Revision
                </Button>
              </div>

              {doc.doc_type === 'note' && (
                <p className="text-[11px] text-muted-foreground text-center leading-tight">
                  Approving a Lesson Note automatically distributes it to all students in {doc.teacher_name}'s class.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {doc.status === 'approved' || doc.status === 'distributed'
                  ? 'This document has been approved.'
                  : 'This document is not ready for review.'}
              </p>
              {(doc.status === 'approved' || doc.status === 'distributed') && doc.approved_by_name && (
                <p className="text-xs text-muted-foreground mt-1">Approved by {doc.approved_by_name} on {formatDate(doc.approval_timestamp ?? '')}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
