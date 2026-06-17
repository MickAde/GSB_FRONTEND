import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';

interface Props {
  error:   unknown;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: Props) {
  const message = getErrorMessage(error);
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-red-50 p-4 dark:bg-red-950/30">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
