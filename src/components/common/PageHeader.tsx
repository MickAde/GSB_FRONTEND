import { cn } from '@/lib/utils';

interface Props {
  title:        string;
  description?: string;
  actions?:     React.ReactNode;
  className?:   string;
}

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn('mb-6 flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
