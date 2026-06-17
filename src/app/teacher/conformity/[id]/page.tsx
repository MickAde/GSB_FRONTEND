'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, Printer, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConformityScoreRing } from '@/components/conformity/ConformityScoreRing';
import { getConformityReport } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

export default function ConformityDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: report, isLoading, isError } = useQuery({
    queryKey: queryKeys.conformity.detail(id),
    queryFn:  () => getConformityReport(id),
    enabled:  !!id,
  });

  if (isLoading) return <LoadingPage />;
  if (isError || !report) return (
    <div className="flex max-w-md flex-col items-center gap-5 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground">Report not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This report may have been deleted or you don&apos;t have permission to view it.
        </p>
      </div>
      <Link href="/teacher/conformity">
        <Button variant="outline">← Back to Reports</Button>
      </Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/conformity">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Reports</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conformity Report</h1>
          <p className="text-sm text-muted-foreground">{formatDate(report.generated_at)}</p>
        </div>
      </div>

      {/* Score + meta */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-start">
        <ConformityScoreRing percentage={parseFloat(report.conformity_percentage ?? '0')} />
        <div className="min-w-0 flex-1 space-y-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Student</p>
            <p className="font-semibold text-foreground">{report.student_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Subject</p>
            <p className="font-medium text-foreground/80">{report.subject}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-muted-foreground">Student Note</p>
              <Link
                href={`/teacher/notes/school/${report.student_note_id}`}
                className="text-primary text-xs hover:underline"
              >
                View note
              </Link>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teacher Reference</p>
              <Link
                href={`/teacher/notes/${report.teacher_note_id}`}
                className="text-primary text-xs hover:underline"
              >
                View note
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Similarity Analysis */}
      {report.similarity_analysis && (
        <Card>
          <CardHeader><CardTitle>AI Analysis</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {report.similarity_analysis}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Download as PDF
        </Button>
        <Link href="/teacher/conformity/new">
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Create Another Report
          </Button>
        </Link>
      </div>
    </div>
  );
}
