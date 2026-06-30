'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { PerformanceHistoryPoint } from '@/types';

const PRIMARY = 'hsl(250, 85%, 60%)';

function formatTick(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload as PerformanceHistoryPoint;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-lg text-center">
      <p className="text-[11px] text-muted-foreground">
        {new Date(pt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <p className="text-xl font-extrabold" style={{ color: PRIMARY }}>{pt.average.toFixed(1)}%</p>
      <p className="text-[11px] text-muted-foreground">
        {pt.count} quiz{pt.count !== 1 ? 'zes' : ''}
      </p>
    </div>
  );
}

export function PerformanceAreaChart({
  data,
  title,
  subtitle,
  emptyMessage = 'Take more quizzes to see your score trend here.',
}: {
  data: PerformanceHistoryPoint[];
  title: string;
  subtitle?: string;
  emptyMessage?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4">
        <p className="font-bold text-foreground">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.28} />
              <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />

          <Tooltip content={<ChartTooltip />} />

          {/* 75% target line */}
          <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.5} />
          {/* 50% pass line */}
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5} />

          <Area
            type="monotone"
            dataKey="average"
            stroke={PRIMARY}
            strokeWidth={2.5}
            fill="url(#perfGrad)"
            dot={{ fill: PRIMARY, strokeWidth: 0, r: 3 }}
            activeDot={{ fill: PRIMARY, stroke: '#fff', strokeWidth: 2, r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-6 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-5 border-t-2 border-dashed border-emerald-400" />
          75% target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-5 border-t-2 border-dashed border-amber-400" />
          50% pass
        </span>
      </div>
    </div>
  );
}
