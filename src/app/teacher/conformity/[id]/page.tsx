'use client';
import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { ConformityScoreRing } from '@/components/conformity/ConformityScoreRing';
import { getConformityReport } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';
import { formatDate } from '@/lib/utils';

export default function ConformityDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data: report, isLoading } = useQuery({
    queryKey: queryKeys.conformity.detail(id),
    queryFn:  () => getConformityReport(id),
    enabled:  !!id,
  });

  if (isLoading) return <LoadingPage />;
  if (!report)   return <p className="p-6 text-red-500">Report not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/teacher/conformity">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Reports</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conformity Report</h1>
          <p className="text-sm text-gray-400">{formatDate(report.generated_at)}</p>
        </div>
      </div>

      {/* Score + meta */}
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-white p-6 sm:flex-row sm:items-start">
        <ConformityScoreRing percentage={parseFloat(report.conformity_percentage ?? '0')} />
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs text-gray-400">Student</p>
            <p className="font-semibold text-gray-900">{report.student_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Subject</p>
            <p className="font-medium text-gray-700">{report.subject}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Student Note</p>
              <Link
                href={`/teacher/notes/school`}
                className="text-indigo-600 text-xs hover:underline"
              >
                View note
              </Link>
            </div>
            <div>
              <p className="text-xs text-gray-400">Teacher Reference</p>
              <Link
                href={`/teacher/notes/${report.teacher_note_id}`}
                className="text-indigo-600 text-xs hover:underline"
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
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {report.similarity_analysis}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
