import { cn } from '@/lib/utils';

interface Props { className?: string; size?: 'sm' | 'md' | 'lg' }

export function LoadingSpinner({ className, size = 'md' }: Props) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('animate-spin rounded-full border-2 border-border border-t-primary', sizes[size], className)}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
