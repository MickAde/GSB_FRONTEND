'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Upload, BarChart2, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyContentBanner } from '@/components/common/DailyContentBanner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotes } from '@/hooks/useNotes';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';
import { getConformityReports } from '@/lib/api/notes';
import { queryKeys } from '@/lib/query-keys';

export default function TeacherDashboardPage() {
  const { data: user }        = useCurrentUser();
  const { data: notes }       = useNotes({ page: 1 });
  const greeting              = useTimeGreeting();
  const { data: conformity }  = useQuery({
    queryKey: queryKeys.conformity.all(),
    queryFn:  () => getConformityReports(),
  });

  const statCards = [
    { label: 'My Notes',          value: notes?.count        ?? '—', icon: BookOpen,  bg: 'from-primary/5 to-white',  ring: 'text-primary'     },
    { label: 'Conformity Reports',value: conformity?.count   ?? '—', icon: BarChart2, bg: 'from-emerald-50 to-white', ring: 'text-emerald-600' },
  ];

  return (
    <div className="max-w-5xl space-y-7">

      <div className="flex items-start justify-between gap-4">
        <div>
          {greeting && (
            <p className="text-sm font-medium text-muted-foreground">{greeting.text} {greeting.emoji}</p>
          )}
          <h1 className="mt-0.5 text-3xl font-bold font-display text-foreground">
            Hey, {user?.first_name ?? '…'}!
          </h1>
          <p className="mt-1 text-muted-foreground">Here&apos;s your teaching overview.</p>
        </div>
        <Link href="/teacher/notes/upload">
          <Button className="gradient-primary h-11 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
            <Upload className="h-4 w-4" /> Upload Note
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map(({ label, value, icon: Icon, bg, ring }) => (
          <div key={label} className={`glass-panel rounded-2xl bg-gradient-to-br ${bg} p-5`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10`}>
              <Icon className={`h-5 w-5 ${ring}`} />
            </div>
            <p className={`mt-4 text-3xl font-black font-display ${ring}`}>{value}</p>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <DailyContentBanner />

      <div className="flex gap-3">
        <Link href="/teacher/notes/upload">
          <Button className="gradient-primary rounded-xl font-bold text-white shadow-md shadow-primary/25 hover:opacity-90">
            Upload Note
          </Button>
        </Link>
        <Link href="/teacher/conformity/new">
          <Button variant="outline" className="rounded-xl gap-2">
            <BarChart2 className="h-4 w-4" /> New Conformity Report
          </Button>
        </Link>
        <Link href="/teacher/notes/school">
          <Button variant="ghost" className="rounded-xl gap-1 text-primary">
            Browse school notes <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
