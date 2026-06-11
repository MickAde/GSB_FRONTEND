'use client';
import { use } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConformityPoller } from '@/hooks/useConformityPoller';

export default function ConformityStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const { data } = useConformityPoller(id);

  const status     = data?.status ?? 'PENDING';
  const isTerminal = ['DONE', 'FAILED'].includes(status);

  return (
    <div className="flex max-w-lg flex-col items-center space-y-6 pt-10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
        {status === 'DONE'   && <CheckCircle className="h-10 w-10 text-green-500" />}
        {status === 'FAILED' && <AlertTriangle className="h-10 w-10 text-red-500" />}
        {!isTerminal         && <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />}
      </div>

      <div className="text-center">
        {status === 'DONE' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Report Ready!</h1>
            <p className="mt-2 text-gray-500">
              Conformity score: <strong>{parseFloat(data?.conformity_percentage ?? '0').toFixed(1)}%</strong>
            </p>
          </>
        )}
        {status === 'FAILED' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Failed</h1>
            <p className="mt-2 text-gray-500">Something went wrong. Please try again.</p>
          </>
        )}
        {!isTerminal && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Analysing Notes…</h1>
            <p className="mt-2 text-gray-500">
              Our AI is comparing the notes. This usually takes 15–60 seconds.
            </p>
          </>
        )}
      </div>

      <span className={`rounded-full px-3 py-1 text-xs font-semibold
        ${status === 'DONE'       ? 'bg-green-100 text-green-700' : ''}
        ${status === 'FAILED'     ? 'bg-red-100 text-red-700' : ''}
        ${status === 'PENDING'    ? 'bg-gray-100 text-gray-600' : ''}
        ${status === 'PROCESSING' ? 'bg-blue-100 text-blue-600' : ''}
      `}>
        {status}
      </span>

      {status === 'DONE' && (
        <Link href={`/teacher/conformity/${id}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">View Report →</Button>
        </Link>
      )}
      {status === 'FAILED' && (
        <Link href="/teacher/conformity/new">
          <Button variant="outline">Try Again</Button>
        </Link>
      )}
      <Link href="/teacher/conformity" className="text-sm text-indigo-600 hover:underline">
        ← Back to Reports
      </Link>
    </div>
  );
}
