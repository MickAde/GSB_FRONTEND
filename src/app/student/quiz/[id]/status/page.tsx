'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Brain, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getQuizStatus } from '@/lib/api/quiz';
import { queryKeys } from '@/lib/query-keys';

export default function QuizStatusPage(props: { params: Promise<{ id: string }> }) {
  const { id }  = use(props.params);
  const router  = useRouter();

  const { data: poll } = useQuery({
    queryKey:        queryKeys.quiz.status(id),
    queryFn:         () => getQuizStatus(id),
    refetchInterval: (q) =>
      q.state.data?.status === 'GENERATING' ? 3000 : false,
  });

  useEffect(() => {
    if (poll?.status === 'READY') {
      router.replace(`/student/quiz/${id}`);
    }
  }, [poll?.status, id, router]);

  if (poll?.status === 'FAILED') {
    return (
      <div className="flex max-w-md flex-col items-center gap-5 pt-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Quiz generation failed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {poll.error_message || 'Something went wrong. Please try again.'}
          </p>
        </div>
        <Link href="/student/quiz/generate">
          <Button className="gradient-primary rounded-xl font-bold text-white">Try Again</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col items-center gap-6 pt-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Brain className="h-10 w-10 animate-pulse text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Building your quiz…</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          AI is generating your questions. This usually takes 10–20 seconds.
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">You can leave — we&apos;ll keep this quiz in your list.</p>
    </div>
  );
}
