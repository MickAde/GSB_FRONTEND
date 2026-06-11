'use client';
import Link from 'next/link';
import { FileText, Image, Mic, AlignLeft, AlertTriangle } from 'lucide-react';
import { NoteStatusBadge } from './NoteStatusBadge';
import { formatDate } from '@/lib/utils';
import type { NoteListItem, NoteType } from '@/types';

const typeConfig: Record<NoteType, { icon: React.ElementType; bg: string; iconColor: string }> = {
  pdf:   { icon: FileText, bg: 'bg-primary/10',  iconColor: 'text-primary'    },
  image: { icon: Image,    bg: 'bg-blue-50',     iconColor: 'text-blue-500'   },
  voice: { icon: Mic,      bg: 'bg-accent/10',   iconColor: 'text-accent'     },
  text:  { icon: AlignLeft,bg: 'bg-amber-50',    iconColor: 'text-amber-500'  },
};

interface Props { note: NoteListItem; basePath: string }

export function NoteCard({ note, basePath }: Props) {
  const cfg  = typeConfig[note.note_type] ?? typeConfig.pdf;
  const Icon = cfg.icon;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm card-hover">
      {note.status === 'AWAITING_STUDENT_APPROVAL' && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white">
          <AlertTriangle className="h-3.5 w-3.5" />
          Action needed — review OCR text
        </div>
      )}
      {note.status === 'FAILED' && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-500 px-4 py-2 text-xs font-semibold text-white">
          <AlertTriangle className="h-3.5 w-3.5" />
          Processing failed
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
            <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <Link href={`${basePath}/${note.id}`} className="group/link">
              <p className="truncate text-sm font-semibold text-foreground group-hover/link:text-primary transition-colors">
                {note.file_name}
              </p>
            </Link>
            {note.subject && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {note.subject}{note.topic ? ` · ${note.topic}` : ''}
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between">
              <NoteStatusBadge status={note.status} />
              <span className="text-xs text-muted-foreground/60">{formatDate(note.created_at)}</span>
            </div>
          </div>
        </div>
        {note.status === 'AWAITING_STUDENT_APPROVAL' && (
          <Link
            href={`${basePath}/${note.id}/review`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            Review OCR Text →
          </Link>
        )}
      </div>
    </div>
  );
}
