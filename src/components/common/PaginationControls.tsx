'use client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  count:       number;
  totalPages:  number;
  currentPage: number;
  pageSize?:   number;
  onPage:      (page: number) => void;
}

export function PaginationControls({ count, totalPages, currentPage, pageSize = 20, onPage }: Props) {
  const start = (currentPage - 1) * pageSize + 1;
  const end   = Math.min(currentPage * pageSize, count);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {count} results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-foreground/80">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
