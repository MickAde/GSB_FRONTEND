'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, GraduationCap, BookOpen, Settings, CalendarDays, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DailyContentBanner } from '@/components/common/DailyContentBanner';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getUsers } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { useTimeGreeting } from '@/hooks/useTimeGreeting';

export default function AdminDashboardPage() {
  const { data: user } = useCurrentUser();
  const greeting       = useTimeGreeting();

  const { data: allUsers }    = useQuery({ queryKey: queryKeys.adminUsers.all(),                         queryFn: () => getUsers({})                        });
  const { data: students }    = useQuery({ queryKey: queryKeys.adminUsers.all({ role: 'STUDENT' }),      queryFn: () => getUsers({ role: 'STUDENT' })        });
  const { data: teachers }    = useQuery({ queryKey: queryKeys.adminUsers.all({ role: 'TEACHER' }),      queryFn: () => getUsers({ role: 'TEACHER' })        });
  const { data: subAdmins }   = useQuery({ queryKey: queryKeys.adminUsers.all({ role: 'SUB_ADMIN' }),    queryFn: () => getUsers({ role: 'SUB_ADMIN' })      });

  const statCards = [
    { label: 'Total Users',  value: allUsers?.length  ?? '—', icon: Users,          bg: 'from-primary/5 to-white',    ring: 'text-primary'      },
    { label: 'Students',     value: students?.length  ?? '—', icon: GraduationCap,  bg: 'from-emerald-50 to-white',   ring: 'text-emerald-600'  },
    { label: 'Teachers',     value: teachers?.length  ?? '—', icon: BookOpen,       bg: 'from-blue-50 to-white',      ring: 'text-blue-600'     },
    { label: 'Sub-Admins',   value: subAdmins?.length ?? '—', icon: Settings,       bg: 'from-amber-50 to-white',     ring: 'text-amber-600'    },
  ];

  const quickLinks = [
    { label: 'Manage Users',    href: '/admin/users',         icon: Users        },
    { label: 'Edit School Info',href: '/admin/school',        icon: Building2    },
    { label: 'School Culture',  href: '/admin/culture',       icon: BookOpen     },
    { label: 'Daily Content',   href: '/admin/daily-content', icon: CalendarDays },
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
          <p className="mt-1 text-muted-foreground">School administration overview</p>
        </div>
        <Link href="/admin/users">
          <Button className="gradient-primary h-11 gap-2 rounded-2xl font-bold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition-opacity">
            <Users className="h-4 w-4" /> Manage Users
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <div>
        <h2 className="mb-4 text-lg font-bold font-display text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 card-hover cursor-pointer">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground leading-tight">{label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
