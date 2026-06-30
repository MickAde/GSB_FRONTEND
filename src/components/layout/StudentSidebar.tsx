'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Brain, Users,
  User, LogOut, Menu, Settings, BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthStore } from '@/stores/authStore';
import { logout as logoutApi } from '@/lib/api/auth';
import { clearTokens, getTokens } from '@/lib/token';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student', TEACHER: 'Teacher',
  MAIN_ADMIN: 'Admin', SUB_ADMIN: 'Admin', VISITOR: 'Visitor',
};

const ROLE_BADGE_COLORS: Record<string, string> = {
  STUDENT:    'bg-emerald-100 text-emerald-700',
  TEACHER:    'bg-blue-100 text-blue-700',
  MAIN_ADMIN: 'bg-purple-100 text-purple-700',
  SUB_ADMIN:  'bg-purple-100 text-purple-700',
  VISITOR:    'bg-orange-100 text-orange-700',
};

export interface SidebarLink { href: string; icon: React.ElementType; label: string; mobileLabel?: string }

function UserSection() {
  const { data: user } = useCurrentUser();
  const { role } = useAuthStore();
  if (!user) return null;
  const initials  = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U';
  const fullName  = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;
  const roleBadge = ROLE_BADGE_COLORS[role ?? ''] ?? 'bg-muted text-muted-foreground';
  const roleLabel = ROLE_LABELS[role ?? ''] ?? role ?? '';
  return (
    <div className="px-4 py-3 border-b border-border/30 bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full shrink-0 bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
          <Badge variant="secondary" className={cn('mt-0.5 text-xs px-1.5 py-0 font-medium', roleBadge)}>{roleLabel}</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 pl-12 truncate">{user.email ?? user.username}</p>
      {user.school_name      && <p className="text-xs text-muted-foreground mt-0.5 pl-12 truncate">{user.school_name}</p>}
      {user.student_class_name && <p className="text-xs font-semibold text-primary mt-0.5 pl-12 truncate">{user.student_class_name}</p>}
    </div>
  );
}

function NavItems({ links, pathname, onNavigate }: { links: SidebarLink[]; pathname: string; onNavigate?: () => void }) {
  const activeHref = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find(l => pathname === l.href || pathname.startsWith(l.href + '/'))?.href ?? null;

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = href === activeHref;
          return (
            <li key={href}>
              <Link href={href} onClick={onNavigate} className={cn('group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium', active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                <Icon className={cn('h-5 w-5 shrink-0 transition-colors', active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary')} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function LogoutButton() {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [loading, setLoading] = useState(false);
  const handleLogout = async () => {
    setLoading(true);
    try { const { refresh } = getTokens(); if (refresh) await logoutApi(refresh); } catch {}
    clearTokens(); clearAuth(); router.push('/'); toast.success('See you soon!'); setLoading(false);
  };
  return (
    <div className="p-4 border-t border-border/30">
      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout} disabled={loading}>
        <LogOut className="w-4 h-4 mr-2" />{loading ? 'Signing out…' : 'Sign Out'}
      </Button>
    </div>
  );
}

function SidebarShell({ links, pathname, onNavigate }: { links: SidebarLink[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-border/50">
      <div className="flex items-center gap-3 p-6 border-b border-border/30">
        <BookOpen className="w-7 h-7 text-primary shrink-0" />
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Genius Study Buddy</h1>
      </div>
      <UserSection />
      <NavItems links={links} pathname={pathname} onNavigate={onNavigate} />
      <div className="px-4 pb-2"><ThemeToggle /></div>
      <LogoutButton />
    </div>
  );
}

const BOTTOM_NAV_MAX = 5;

export function Sidebar({ links }: { links: SidebarLink[] }) {
  const pathname  = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const needsMore  = links.length > BOTTOM_NAV_MAX;
  const bottomLinks = needsMore ? links.slice(0, BOTTOM_NAV_MAX - 1) : links;

  const activeHref = [...links]
    .sort((a, b) => b.href.length - a.href.length)
    .find(l => pathname === l.href || pathname.startsWith(l.href + '/'))?.href ?? null;

  return (
    <>
      <aside className="hidden lg:flex w-64 shrink-0 flex-col h-screen sticky top-0 overflow-y-auto">
        <SidebarShell links={links} pathname={pathname} />
      </aside>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="flex items-stretch justify-around">
          {bottomLinks.map(({ href, icon: Icon, label, mobileLabel }) => {
            const active = href === activeHref;
            return (
              <Link key={href} href={href} className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors', active ? 'text-primary' : 'text-muted-foreground')}>
                <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground/60')} />
                <span className="max-w-[52px] truncate text-center leading-tight">{mobileLabel ?? label}</span>
              </Link>
            );
          })}
          {needsMore && (
            <button onClick={() => setMoreOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-muted-foreground">
              <Menu className="h-5 w-5 opacity-60" /><span>More</span>
            </button>
          )}
        </div>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r-0">
          <SidebarShell links={links} pathname={pathname} onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Student nav ───────────────────────────────────────────────────────────────

const studentLinks: SidebarLink[] = [
  { href: '/student/dashboard',       icon: LayoutDashboard, label: 'Dashboard',       mobileLabel: 'Home'    },
  { href: '/student/subjects',        icon: BookOpen,        label: 'Subjects',        mobileLabel: 'Subjects'},
  { href: '/student/quiz',            icon: Brain,           label: 'Quiz Centre',     mobileLabel: 'Quiz'    },
  { href: '/student/performance',     icon: BarChart2,       label: 'Performance',     mobileLabel: 'Stats'   },
  { href: '/student/study-groups',    icon: Users,           label: 'Study Groups',    mobileLabel: 'Groups'  },
  { href: '/student/profile',         icon: User,            label: 'Profile',                                },
  { href: '/student/settings',        icon: Settings,        label: 'Settings',                               },
];

export function StudentSidebar() {
  return <Sidebar links={studentLinks} />;
}
