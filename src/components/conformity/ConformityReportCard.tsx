import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { formatDate } from '@/lib/utils';
import type { ConformityReport } from '@/types';

interface Props { report: ConformityReport; basePath: string }

export function ConformityReportCard({ report, basePath }: Props) {
  const pct = parseFloat(report.conformity_percentage ?? '0');
  const pctColor =
    pct >= 90 ? 'text-green-600'
    : pct >= 70 ? 'text-blue-600'
    : pct >= 50 ? 'text-amber-600'
    : 'text-red-600';

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{report.student_name}</p>
            <p className="text-sm text-muted-foreground">{report.subject}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(report.generated_at)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {report.status === 'DONE' ? (
              <span className={`text-2xl font-bold ${pctColor}`}>{pct.toFixed(1)}%</span>
            ) : (
              <NoteStatusBadge status={report.status} type="conformity" />
            )}
          </div>
        </div>
        <Link
          href={`${basePath}/${report.id}`}
          className="mt-3 block text-xs font-medium text-primary hover:underline"
        >
          View Report →
        </Link>
      </CardContent>
    </Card>
  );
}
