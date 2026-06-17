'use client';
import Link from 'next/link';
import { FileText, Image, Mic, AlignLeft, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { NoteStatusBadge } from './NoteStatusBadge';
import { formatDate } from '@/lib/utils';
import type { NoteListItem, NoteType } from '@/types';

const typeConfig: Record<NoteType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  pdf:   { icon: FileText,  bg: 'bg-red-50',    iconColor: 'text-red-500'    },
  image: { icon: Image,     bg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
  voice: { icon: Mic,       bg: 'bg-purple-50', iconColor: 'text-purple-500' },
  text:  { icon: AlignLeft, bg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
};

const statusBorderColor: Record<string, string> = {
  READY:                     'border-l-emerald-400',
  AWAITING_STUDENT_APPROVAL: 'border-l-amber-400',
  PROCESSING_AI:             'border-l-violet-400',
  PENDING_OCR:               'border-l-blue-400',
  FAILED:                    'border-l-red-400',
};

interface Props { note: NoteListItem; basePath: string }

export function NoteCard({ note, basePath }: Props) {
  const cfg  = typeConfig[note.note_type] ?? typeConfig.pdf;
  const Icon = cfg.icon;
  const isProcessing = note.status === 'PENDING_OCR' || note.status === 'PROCESSING_AI';

  return (
    <div className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md border-l-4 ${statusBorderColor[note.status] ?? 'border-l-gray-200'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">

          {/* File type icon */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
            {isProcessing
              ? <Loader2 className={`h-6 w-6 animate-spin ${cfg.iconColor}`} />
              : <Icon className={`h-6 w-6 ${cfg.iconColor}`} />
            }
          </div>

          <div className="min-w-0 flex-1">
            {/* Subject / topic tag */}
            {note.subject && (
              <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {note.subject}{note.topic ? ` · ${note.topic}` : ''}
              </span>
            )}

            {/* File name */}
            <Link href={`${basePath}/${note.id}`} className="group/link block">
              <p className="truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover/link:text-primary">
                {note.file_name}
              </p>
            </Link>

            {/* Status + date */}
            <div className="mt-2 flex items-center justify-between">
              <NoteStatusBadge status={note.status} />
              <span className="text-[11px] text-muted-foreground/60">{formatDate(note.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Action strip */}
        {note.status === 'AWAITING_STUDENT_APPROVAL' && (
          <Link
            href={`${basePath}/${note.id}/review`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Review OCR Text →
          </Link>
        )}
        {note.status === 'PROCESSING_AI' && (
          <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 py-2 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            AI is building your study guide…
          </div>
        )}
        {note.status === 'FAILED' && (
          <Link
            href={`${basePath}/${note.id}/review`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Retry — edit text →
          </Link>
        )}
      </div>
    </div>
  );
}
