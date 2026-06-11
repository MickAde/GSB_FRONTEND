import { SchoolCard } from './SchoolCard';
import { Skeleton } from '@/components/ui/skeleton';
import { School } from 'lucide-react';
import type { SchoolPublic } from '@/types';

interface Props {
  schools:   SchoolPublic[];
  loading?:  boolean;
  onSelect?: (school: SchoolPublic) => void;
}

export function SchoolGrid({ schools, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl bg-muted/20">
        <School className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">No schools found</p>
        <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {schools.map((school, i) => (
        <SchoolCard key={school.id} school={school} index={i} onSelect={onSelect} />
      ))}
    </div>
  );
}
