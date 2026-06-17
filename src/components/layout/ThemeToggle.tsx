'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'light',  icon: Sun,     label: 'Light'  },
  { value: 'system', icon: Monitor, label: 'System' },
  { value: 'dark',   icon: Moon,    label: 'Dark'   },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={cn(
            'flex flex-1 items-center justify-center rounded-lg p-1.5 transition-all duration-200',
            theme === value
              ? 'bg-background text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
