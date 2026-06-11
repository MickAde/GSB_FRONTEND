import type { LucideIcon } from 'lucide-react';
import { InboxIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  icon?:        LucideIcon;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon = InboxIcon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && (
        <Button className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
