'use client';
import { useDailyContent } from '@/hooks/useDailyContent';

const TYPE_CONFIG = {
  STUDENT_QUOTE: { label: 'Quote of the Day',   emoji: '💬', gradient: 'from-primary/80 to-primary'     },
  TEACHER_TIP:   { label: 'Teacher Tip',        emoji: '💡', gradient: 'from-amber-500 to-orange-500'    },
  ADMIN_INSIGHT: { label: 'Insight of the Day', emoji: '✨', gradient: 'from-emerald-500 to-teal-500'    },
};

export function DailyContentBanner() {
  const { data } = useDailyContent();
  if (!data) return null;

  const cfg = TYPE_CONFIG[data.content_type] ?? TYPE_CONFIG.STUDENT_QUOTE;

  return (
    <div className="glass-panel overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-primary/3 to-accent/5 p-5">
      <div className="flex items-start gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.gradient} shadow-sm`}>
          <span className="text-lg leading-none">{cfg.emoji}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-primary">{cfg.label}</p>
          <p className="text-sm font-medium leading-relaxed text-foreground">{data.body}</p>
          {data.author && (
            <p className="mt-2 text-xs font-semibold text-primary/70">— {data.author}</p>
          )}
        </div>
      </div>
    </div>
  );
}
