'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConformityScoreRing } from '@/components/conformity/ConformityScoreRing';
import { NoteStatusBadge } from '@/components/notes/NoteStatusBadge';
import { getConformityReports } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

export default function ConformityListPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.conformity.all(),
    queryFn:  () => getConformityReports(),
  });

  if (isLoading) return <LoadingPage />;

  const reports = data?.results ?? [];
  const count   = data?.count ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Conformity Reports"
        description={`${count} report${count !== 1 ? 's' : ''}`}
        actions={
          <Link href="/teacher/conformity/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          </Link>
        }
      />

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="font-medium">No conformity reports yet</p>
          <p className="mt-1 text-sm">Create a report to compare a student note against a teacher reference.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link key={report.id} href={`/teacher/conformity/${report.id}`}>
              <Card className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  {report.status === 'DONE' && (
                    <div className="shrink-0 scale-50 origin-left">
                      <ConformityScoreRing percentage={parseFloat(report.conformity_percentage ?? '0')} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">
                      {report.student_name} · {report.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(report.generated_at)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium
                    ${report.status === 'DONE'       ? 'bg-green-100 text-green-700' : ''}
                    ${report.status === 'FAILED'     ? 'bg-red-100 text-red-700' : ''}
                    ${report.status === 'PENDING'    ? 'bg-muted text-muted-foreground' : ''}
                    ${report.status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' : ''}
                  `}>
                    {report.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
