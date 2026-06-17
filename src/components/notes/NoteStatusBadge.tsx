import { cn } from '@/lib/utils';
import type { NoteStatus, ConformityStatus } from '@/types';

const noteStatusMap: Record<NoteStatus, { label: string; dot: string; className: string }> = {
  PENDING_OCR:               { label: 'Reading text…',   dot: 'bg-blue-400',   className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'     },
  AWAITING_STUDENT_APPROVAL: { label: 'Review needed',   dot: 'bg-amber-400',  className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'   },
  PROCESSING_AI:             { label: 'AI processing…',  dot: 'bg-violet-400', className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' },
  READY:                     { label: 'Ready ✓',         dot: 'bg-emerald-400',className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  FAILED:                    { label: 'Failed',          dot: 'bg-red-400',    className: 'bg-red-50 text-red-700 ring-1 ring-red-200'          },
};

const conformityStatusMap: Record<ConformityStatus, { label: string; dot: string; className: string }> = {
  PENDING:    { label: 'Pending',     dot: 'bg-muted-foreground', className: 'bg-muted text-muted-foreground ring-1 ring-border' },
  PROCESSING: { label: 'Analysing…', dot: 'bg-violet-400', className: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'   },
  DONE:       { label: 'Done ✓',     dot: 'bg-emerald-400',className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  FAILED:     { label: 'Failed',     dot: 'bg-red-400',    className: 'bg-red-50 text-red-700 ring-1 ring-red-200'            },
};

interface NoteProps    { status: NoteStatus;        type?: 'note' }
interface ConformProps { status: ConformityStatus;  type:  'conformity' }

export function NoteStatusBadge(props: NoteProps | ConformProps) {
  const map  = props.type === 'conformity' ? conformityStatusMap : noteStatusMap;
  const item = (map as Record<string, { label: string; dot: string; className: string }>)[props.status];
  if (!item) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', item.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', item.dot)} />
      {item.label}
    </span>
  );
}
