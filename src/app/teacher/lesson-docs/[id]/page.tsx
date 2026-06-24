'use client';
import { use, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Trash2, Loader2, Play, BookOpen,
  FileText, Globe, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, History, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LoadingPage, LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  getLessonDocDetail,
  updateLessonDoc,
  submitLessonDoc,
  deleteLessonDoc,
  regenerateSection,
  getLessonDocVersions,
} from '@/lib/api/teaching';
import { queryKeys } from '@/lib/query-keys';
import { formatDate, cn } from '@/lib/utils';
import type { LessonDocStatus, DiagnosticCard, ResourceCard, LessonDocVersion } from '@/types';

// ── Status metadata ───────────────────────────────────────────────────────────

const STATUS_META: Record<LessonDocStatus, { label: string; cls: string; dot?: string }> = {
  draft:            { label: 'Draft',            cls: 'bg-muted text-muted-foreground',        dot: 'bg-muted-foreground' },
  generating:       { label: 'Generating…',      cls: 'bg-blue-100 text-blue-700',             dot: 'bg-blue-500' },
  submitted:        { label: 'Submitted',         cls: 'bg-amber-100 text-amber-700',           dot: 'bg-amber-500' },
  under_review:     { label: 'Under Review',      cls: 'bg-purple-100 text-purple-700',         dot: 'bg-purple-500' },
  revision_needed:  { label: 'Revision Needed',   cls: 'bg-red-100 text-red-700',               dot: 'bg-red-500' },
  approved:         { label: 'Approved',          cls: 'bg-green-100 text-green-700',           dot: 'bg-green-500' },
  distributed:      { label: 'Distributed',       cls: 'bg-emerald-100 text-emerald-700',       dot: 'bg-emerald-500' },
};

// ── Tab type ──────────────────────────────────────────────────────────────────

type RightTab = 'diagnostics' | 'resources' | 'versions';

// ── Simple Myers-inspired line diff ──────────────────────────────────────────

type DiffLine = { type: 'same' | 'added' | 'removed'; text: string };

function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // LCS-based diff via DP
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack
  const trace: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      trace.push({ type: 'same',    text: oldLines[i - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      trace.push({ type: 'added',   text: newLines[j - 1] });
      j--;
    } else {
      trace.push({ type: 'removed', text: oldLines[i - 1] });
      i--;
    }
  }

  return trace.reverse();
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LessonDocStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', meta.cls)}>
      {status === 'generating' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      )}
      {meta.label}
    </span>
  );
}

// ── Resource type icon ────────────────────────────────────────────────────────

function ResourceIcon({ type }: { type: ResourceCard['type'] }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (type) {
    case 'video':          return <Play      className={cn(cls, 'text-red-500')} />;
    case 'textbook':       return <BookOpen  className={cn(cls, 'text-blue-500')} />;
    case 'past_questions': return <FileText  className={cn(cls, 'text-amber-500')} />;
    case 'website':        return <Globe     className={cn(cls, 'text-emerald-500')} />;
  }
}

// ── Diagnostics tab ───────────────────────────────────────────────────────────

function DiagnosticsTab({
  cards,
  onApply,
  hoveredSection,
  onHover,
}: {
  cards: DiagnosticCard[];
  onApply: (section: string, content: string) => void;
  hoveredSection: string | null;
  onHover: (section: string | null) => void;
}) {
  const red    = cards.filter((c) => c.urgency === 'red');
  const yellow = cards.filter((c) => c.urgency === 'yellow');

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        <p className="text-sm font-medium text-muted-foreground">No diagnostic issues found.</p>
      </div>
    );
  }

  const renderCard = (card: DiagnosticCard) => {
    const isHighlighted = hoveredSection === card.section;
    const borderCls = card.urgency === 'red'
      ? 'border-red-300 bg-red-50/60'
      : 'border-amber-300 bg-amber-50/60';

    return (
      <div
        key={card.id}
        data-section={card.section}
        onMouseEnter={() => onHover(card.section)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          'rounded-xl border p-4 space-y-2 transition-all cursor-default',
          borderCls,
          isHighlighted && 'ring-2 ring-offset-1',
          isHighlighted && card.urgency === 'red' ? 'ring-red-400' : 'ring-amber-400',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-semibold text-sm', card.urgency === 'red' ? 'text-red-800' : 'text-amber-800')}>
            {card.title}
          </p>
          <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
            {card.section}
          </span>
        </div>
        <p className={cn('text-xs leading-relaxed', card.urgency === 'red' ? 'text-red-700' : 'text-amber-700')}>
          {card.description}
        </p>
        <p className={cn('text-xs italic', card.urgency === 'red' ? 'text-red-600' : 'text-amber-600')}>
          {card.suggestion}
        </p>
        {card.suggested_content && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-current"
            onClick={() => onApply(card.section, card.suggested_content!)}
          >
            Apply suggestion
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {red.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-600">Critical ({red.length})</p>
          {red.map(renderCard)}
        </div>
      )}
      {yellow.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Warnings ({yellow.length})</p>
          {yellow.map(renderCard)}
        </div>
      )}
    </div>
  );
}

// ── Resources tab ─────────────────────────────────────────────────────────────

function ResourcesTab({ cards }: { cards: ResourceCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No resource cards available.
      </div>
    );
  }

  const TYPE_LABEL: Record<ResourceCard['type'], string> = {
    video:          'Video',
    textbook:       'Textbook',
    past_questions: 'Past Questions',
    website:        'Website',
  };

  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ResourceIcon type={card.type} />
            <p className="font-semibold text-sm text-foreground flex-1 truncate">{card.title}</p>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {TYPE_LABEL[card.type]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
          {card.relevance && (
            <p className="text-[11px] font-medium text-primary/80 italic">{card.relevance}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Versions tab ──────────────────────────────────────────────────────────────

function VersionsTab({
  docId,
  currentMarkdown,
  onRestore,
}: {
  docId: string;
  currentMarkdown: string;
  onRestore: (markdown: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: queryKeys.lessonDocs.versions(docId),
    queryFn:  () => getLessonDocVersions(docId),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No saved versions yet. Saving the document creates a version.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {versions.map((v) => {
        const isOpen = expandedId === v.id;
        const diff = isOpen ? computeLineDiff(v.content_markdown, currentMarkdown) : [];
        const hasChanges = diff.some((l) => l.type !== 'same');

        return (
          <div key={v.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
              onClick={() => setExpandedId(isOpen ? null : v.id)}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                v{v.version_number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {v.change_note || `Version ${v.version_number}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {v.saved_by_name && <>{v.saved_by_name} · </>}
                  {formatDate(v.created_at)}
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-border">
                {/* Diff view */}
                <div className="bg-muted/30 p-3 max-h-72 overflow-y-auto">
                  {!hasChanges ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No differences from the current document.
                    </p>
                  ) : (
                    <pre className="text-[11px] leading-5 font-mono whitespace-pre-wrap break-all">
                      {diff.map((line, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'px-2 rounded',
                            line.type === 'added'   && 'bg-green-100 text-green-800',
                            line.type === 'removed' && 'bg-red-100 text-red-800 line-through',
                            line.type === 'same'    && 'text-muted-foreground',
                          )}
                        >
                          {line.type === 'added'   ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                          {line.text}
                        </div>
                      ))}
                    </pre>
                  )}
                </div>
                <div className="flex justify-end px-4 py-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs h-7"
                    onClick={() => {
                      onRestore(v.content_markdown);
                      setExpandedId(null);
                      toast.success(`Restored to version ${v.version_number}`);
                    }}
                  >
                    <History className="h-3 w-3" />
                    Restore this version
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Regenerate popover ────────────────────────────────────────────────────────

function RegeneratePopover({
  heading,
  onConfirm,
  onCancel,
  loading,
}: {
  heading: string;
  onConfirm: (instruction: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [instruction, setInstruction] = useState('');

  return (
    <div className="absolute right-0 top-7 z-30 w-72 rounded-xl border border-border bg-card shadow-lg p-4 space-y-3">
      <p className="text-xs font-semibold text-foreground">Regenerate section</p>
      <p className="text-[11px] text-muted-foreground truncate">
        Section: <span className="font-medium text-foreground">{heading}</span>
      </p>
      <textarea
        className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[60px]"
        placeholder="Optional instruction (e.g. 'Make it more concise')"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        disabled={loading}
      />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => onConfirm(instruction)}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Regenerate
        </Button>
      </div>
    </div>
  );
}

// ── Markdown editor with per-section regenerate ───────────────────────────────

function MarkdownEditor({
  value,
  onChange,
  onSave,
  saving,
  dirty,
  docId,
  onMarkdownUpdate,
  highlightedSection,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
  docId: string;
  onMarkdownUpdate: (markdown: string) => void;
  highlightedSection: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [regenLoading,  setRegenLoading]  = useState<string | null>(null);

  // Extract H2 section headings from markdown
  const headings = value
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^##\s+/, '').trim());

  const handleRegenerate = useCallback(async (heading: string, instruction: string) => {
    setRegenLoading(heading);
    try {
      const res = await regenerateSection(docId, {
        section_heading: heading,
        instruction:     instruction || undefined,
      });
      onMarkdownUpdate(res.content_markdown);
      toast.success(`Section "${heading}" regenerated`);
    } catch {
      toast.error('Failed to regenerate section. Try again.');
    } finally {
      setRegenLoading(null);
      setActivePopover(null);
    }
  }, [docId, onMarkdownUpdate]);

  // Scroll textarea to a section when highlighted from diagnostics
  useEffect(() => {
    if (!highlightedSection || !textareaRef.current) return;
    const lines = value.split('\n');
    const lineIdx = lines.findIndex((l) =>
      l.startsWith('## ') && l.toLowerCase().includes(highlightedSection.toLowerCase())
    );
    if (lineIdx < 0) return;
    const charsBefore = lines.slice(0, lineIdx).join('\n').length;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charsBefore, charsBefore);
    // Approximate scroll
    const lineHeight = 20;
    textareaRef.current.scrollTop = lineIdx * lineHeight;
  }, [highlightedSection]);

  return (
    <div className="flex flex-col h-full">
      {/* Section headings quick-nav + regenerate buttons */}
      {headings.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {headings.map((heading) => {
            const isLoading = regenLoading === heading;
            const isOpen    = activePopover === heading;
            return (
              <div key={heading} className="relative">
                <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/60 pr-1 pl-3 py-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[120px]">
                    {heading}
                  </span>
                  <button
                    title={`Regenerate "${heading}"`}
                    className={cn(
                      'ml-1 flex h-5 w-5 items-center justify-center rounded-full transition-colors',
                      isLoading
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:bg-primary/10 hover:text-primary text-muted-foreground',
                    )}
                    onClick={() => !isLoading && setActivePopover(isOpen ? null : heading)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <RefreshCw className="h-3 w-3" />
                    }
                  </button>
                </div>
                {isOpen && (
                  <RegeneratePopover
                    heading={heading}
                    onConfirm={(instruction) => handleRegenerate(heading, instruction)}
                    onCancel={() => setActivePopover(null)}
                    loading={isLoading}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Textarea */}
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full h-full min-h-[480px] resize-none rounded-xl border border-border bg-background',
            'px-4 py-3 text-sm font-mono text-foreground leading-relaxed',
            'placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
            'transition-colors',
          )}
          placeholder="Start writing your lesson document in Markdown…"
          spellCheck
        />
        {regenLoading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
            <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium text-foreground">Regenerating section…</span>
            </div>
          </div>
        )}
      </div>

      {/* Save bar */}
      <div className="mt-3 flex items-center justify-between">
        <p className={cn('text-xs', dirty ? 'text-amber-600 font-medium' : 'text-muted-foreground')}>
          {dirty ? 'Unsaved changes' : 'All changes saved'}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={!dirty || saving}
          onClick={onSave}
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}

// ── Generating state ──────────────────────────────────────────────────────────

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5 rounded-2xl border border-blue-200 bg-blue-50/50 p-10">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
      <div className="text-center space-y-1">
        <p className="font-bold text-blue-800 text-lg">Generating your document</p>
        <p className="text-sm text-blue-600 max-w-xs">
          The AI is building your lesson document. This typically takes 20–60 seconds.
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LessonDocWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();
  const qc      = useQueryClient();

  const [markdown,        setMarkdown]        = useState('');
  const [dirty,           setDirty]           = useState(false);
  const [activeTab,       setActiveTab]       = useState<RightTab>('diagnostics');
  const [hoveredSection,  setHoveredSection]  = useState<string | null>(null);
  const [confirmSubmit,   setConfirmSubmit]   = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(false);
  const [deleting,        setDeleting]        = useState(false);

  // Fetch doc — poll every 3s while generating
  const { data: doc, isLoading } = useQuery({
    queryKey:       queryKeys.lessonDocs.detail(id),
    queryFn:        () => getLessonDocDetail(id),
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? 3000 : false,
  });

  // Sync markdown from server when first loaded (or when not dirty)
  useEffect(() => {
    if (doc && !dirty) {
      setMarkdown(doc.content_markdown ?? '');
    }
  }, [doc?.id, doc?.status]);

  // Save mutation
  const saveMut = useMutation({
    mutationFn: () => updateLessonDoc(id, { content_markdown: markdown }),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.lessonDocs.detail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.lessonDocs.versions(id) });
      setDirty(false);
      toast.success('Document saved');
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  });

  // Submit mutation
  const submitMut = useMutation({
    mutationFn: () => submitLessonDoc(id),
    onSuccess: (updated) => {
      qc.setQueryData(queryKeys.lessonDocs.detail(id), updated);
      qc.invalidateQueries({ queryKey: queryKeys.lessonDocs.all() });
      toast.success('Submitted for review');
      setConfirmSubmit(false);
    },
    onError: () => toast.error('Failed to submit. Please try again.'),
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteLessonDoc(id);
      qc.invalidateQueries({ queryKey: queryKeys.lessonDocs.all() });
      toast.success('Document deleted');
      router.push('/teacher/lesson-docs');
    } catch {
      toast.error('Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleMarkdownChange = (v: string) => {
    setMarkdown(v);
    setDirty(true);
  };

  const handleMarkdownUpdate = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
    setDirty(true);
  };

  // Apply a diagnostic suggestion: replace the section's content block
  const handleApplySuggestion = (section: string, content: string) => {
    setMarkdown((prev) => {
      const lines      = prev.split('\n');
      const startIdx   = lines.findIndex(
        (l) => l.startsWith('## ') && l.replace(/^##\s+/, '').trim() === section,
      );
      if (startIdx < 0) {
        toast.error(`Section "${section}" not found in editor`);
        return prev;
      }
      // Find where the next H2 (or end) is
      const endIdx = lines.findIndex(
        (l, i) => i > startIdx && l.startsWith('## '),
      );
      const before  = lines.slice(0, startIdx + 1);
      const after   = endIdx >= 0 ? lines.slice(endIdx) : [];
      const newLines = [...before, '', content.trim(), '', ...after];
      return newLines.join('\n');
    });
    setDirty(true);
    toast.success(`Suggestion applied to "${section}"`);
  };

  // Restore from a version
  const handleRestoreVersion = (versionMarkdown: string) => {
    setMarkdown(versionMarkdown);
    setDirty(true);
  };

  if (isLoading || !doc) return <LoadingPage />;

  const isGenerating    = doc.status === 'generating';
  const isErrored       = doc.status === 'draft' && !!doc.generation_error;
  const isEditable      = doc.status === 'draft' || doc.status === 'revision_needed';
  const canSubmit       = isEditable && !!markdown.trim();
  const canDelete       = isEditable;

  const tabs: { id: RightTab; label: string; count?: number }[] = [
    { id: 'diagnostics', label: 'Diagnostics', count: doc.diagnostic_cards?.length ?? 0 },
    { id: 'resources',   label: 'Resources',   count: doc.resource_cards?.length ?? 0   },
    { id: 'versions',    label: 'Versions',    count: doc.version_count ?? 0             },
  ];

  return (
    <div className="flex flex-col gap-5 h-full min-h-screen pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Link href="/teacher/lesson-docs">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0 mt-0.5">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">
                {doc.title || doc.topic}
              </h1>
              <StatusBadge status={doc.status} />
              {doc.distributed_to_class && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Distributed
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {doc.subject} · {doc.class_level} · Term {doc.term}, Week {doc.week}
              {doc.class_name && <> · {doc.class_name}</>}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2 mt-0.5">
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 hover:text-red-700 hover:border-red-300"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
            {canSubmit && (
              <Button
                size="sm"
                className="gap-1.5 gradient-primary text-white font-semibold shadow-sm hover:opacity-90"
                onClick={() => setConfirmSubmit(true)}
                disabled={submitMut.isPending}
              >
                {submitMut.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />
                }
                Submit for Review
              </Button>
            )}
          </div>
        </div>

        {/* Board summary */}
        {doc.board_summary && (
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Board summary: </span>
            {doc.board_summary}
          </div>
        )}

        {/* Admin comments banner */}
        {doc.admin_comments && doc.status === 'revision_needed' && (
          <div className="flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Reviewer feedback</p>
              <p className="text-sm text-red-700 mt-0.5">{doc.admin_comments}</p>
            </div>
          </div>
        )}

        {/* Approved banner */}
        {doc.status === 'approved' && (
          <div className="flex items-center gap-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <p className="text-sm text-green-800">
              <span className="font-semibold">Approved</span>
              {doc.approved_by_name && <> by {doc.approved_by_name}</>}
              {doc.approval_timestamp && <> on {formatDate(doc.approval_timestamp)}</>}
            </p>
          </div>
        )}
      </div>

      {/* ── Generating state ── */}
      {isGenerating && <GeneratingState />}

      {/* ── Generation error state ── */}
      {isErrored && doc.generation_error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-red-700 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            Generation failed
          </div>
          <p className="text-sm text-red-600">{doc.generation_error}</p>
          <p className="text-xs text-muted-foreground">
            Please delete this document and create a new one to try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete document
          </Button>
        </div>
      )}

      {/* ── Main workspace (only when not generating) ── */}
      {!isGenerating && (
        <div className="flex flex-col lg:flex-row gap-5 flex-1">

          {/* Left: Markdown editor — 60% */}
          <div className="lg:w-[60%] flex flex-col">
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col flex-1 min-h-[560px]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Document Editor
                </p>
                {!isEditable && (
                  <span className="text-[11px] text-muted-foreground italic">
                    Read-only · {STATUS_META[doc.status].label}
                  </span>
                )}
              </div>

              {isEditable ? (
                <MarkdownEditor
                  value={markdown}
                  onChange={handleMarkdownChange}
                  onSave={() => saveMut.mutate()}
                  saving={saveMut.isPending}
                  dirty={dirty}
                  docId={id}
                  onMarkdownUpdate={handleMarkdownUpdate}
                  highlightedSection={hoveredSection}
                />
              ) : (
                <div className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed overflow-y-auto min-h-[480px]">
                  {markdown || <span className="text-muted-foreground italic">No content yet.</span>}
                </div>
              )}
            </div>
          </div>

          {/* Right: Tabs panel — 40% */}
          <div className="lg:w-[40%] flex flex-col">
            <div className="rounded-2xl border border-border bg-card flex flex-col flex-1 min-h-[560px]">
              {/* Tab bar */}
              <div className="flex gap-0.5 p-2 border-b border-border">
                {tabs.map(({ id: tabId, label, count }) => (
                  <button
                    key={tabId}
                    onClick={() => setActiveTab(tabId)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all',
                      activeTab === tabId
                        ? 'bg-card text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    {label}
                    {typeof count === 'number' && count > 0 && (
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                        activeTab === tabId ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        {count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'diagnostics' && (
                  <DiagnosticsTab
                    cards={doc.diagnostic_cards ?? []}
                    onApply={handleApplySuggestion}
                    hoveredSection={hoveredSection}
                    onHover={setHoveredSection}
                  />
                )}
                {activeTab === 'resources' && (
                  <ResourcesTab cards={doc.resource_cards ?? []} />
                )}
                {activeTab === 'versions' && (
                  <VersionsTab
                    docId={id}
                    currentMarkdown={markdown}
                    onRestore={handleRestoreVersion}
                  />
                )}
              </div>

              {/* Footer meta */}
              <div className="border-t border-border px-4 py-2.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>Updated {formatDate(doc.updated_at)}</span>
                {doc.version_count > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <span>{doc.version_count} version{doc.version_count !== 1 ? 's' : ''}</span>
                  </>
                )}
                {doc.teacher_name && (
                  <>
                    <span className="text-border">·</span>
                    <span className="truncate">{doc.teacher_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <ConfirmDialog
        open={confirmSubmit}
        onOpenChange={setConfirmSubmit}
        title="Submit for review?"
        description="Once submitted, the document will be reviewed by an admin. You won't be able to edit it until they respond."
        confirmLabel="Submit"
        onConfirm={() => submitMut.mutate()}
        loading={submitMut.isPending}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this document?"
        description="This action cannot be undone. All versions and content will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
