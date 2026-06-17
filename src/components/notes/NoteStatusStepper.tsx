'use client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step { label: string }

interface Props {
  steps:       Step[];
  currentStep: number;
  failed?:     boolean;
}

export function NoteStatusStepper({ steps, currentStep, failed = false }: Props) {
  return (
    <div className="w-full">
      <div className="relative flex items-start justify-between">

        {/* Track — sits behind circles via absolute positioning */}
        <div className="pointer-events-none absolute inset-x-0 top-4 h-px bg-border" />

        {/* Filled progress */}
        <div
          className={cn(
            'pointer-events-none absolute left-0 top-4 h-px transition-all duration-700',
            failed ? 'bg-destructive' : 'bg-primary',
          )}
          style={{ width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const done   = idx < currentStep;
          const active = idx === currentStep;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center gap-2">
              {/* Circle — bg-background punches through the track line */}
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background text-xs font-bold transition-all duration-500',
                done   && 'border-primary bg-primary text-primary-foreground',
                active && !failed && 'border-primary text-primary ring-4 ring-primary/15',
                active && failed  && 'border-destructive text-destructive ring-4 ring-destructive/15',
                !done && !active  && 'border-border text-muted-foreground',
              )}>
                {done ? <Check className="h-3.5 w-3.5 stroke-[2.5]" /> : idx + 1}
              </div>

              {/* Label */}
              <span className={cn(
                'max-w-[60px] text-center text-[11px] leading-tight',
                done   && 'font-medium text-primary',
                active && !failed && 'font-semibold text-foreground',
                active && failed  && 'font-semibold text-destructive',
                !done && !active  && 'font-medium text-muted-foreground',
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
