'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Menu, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/lib/api/auth';
import { clearTokens, getTokens } from '@/lib/token';

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student', TEACHER: 'Teacher',
  MAIN_ADMIN: 'Admin', SUB_ADMIN: 'Admin', VISITOR: 'Visitor',
};

interface Props { onMenuToggle?: () => void }

export function TopBar({ onMenuToggle }: Props) {
  const router  = useRouter();
  const { data: user }  = useCurrentUser();
  const { role }        = useAuthStore();
  const clearAuth       = useAuthStore((s) => s.clearAuth);
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : '';

  const handleLogout = async () => {
    setLoggingOut(true);
    try { const { refresh } = getTokens(); if (refresh) await logout(refresh); } catch {}
    clearTokens();
    clearAuth();
    router.push('/');
    toast.success('See you soon! 👋');
    setLoggingOut(false);
  };

  const profilePath = role === 'STUDENT'   ? '/student/profile'
                    : role === 'TEACHER'   ? '/teacher/profile'
                    : role === 'VISITOR'   ? '/visitor/profile'
                    : role === 'MAIN_ADMIN' || role === 'SUB_ADMIN' ? '/admin/profile'
                    : '/platform/profile';

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 shadow-sm backdrop-blur-sm lg:px-6">
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3 py-1.5 shadow-xs transition-shadow hover:shadow-sm">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-sm"
              style={{ background: 'var(--primary)' }}
            >
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-bold leading-tight text-foreground">
                {user ? `${user.first_name} ${user.last_name}` : '…'}
              </p>
              {roleLabel && <p className="text-xs font-medium text-muted-foreground">{roleLabel}</p>}
            </div>
            <svg className="ml-1 hidden h-3.5 w-3.5 text-muted-foreground md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl">
          <DropdownMenuLabel className="px-3 py-2">
            <p className="text-sm font-bold text-foreground">{user ? `${user.first_name} ${user.last_name}` : '…'}</p>
            <p className="text-xs text-muted-foreground">{user?.email ?? user?.username}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(profilePath)} className="rounded-xl gap-2.5 py-2">
            <User className="h-4 w-4" /> Profile & Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl gap-2.5 py-2 text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? 'Logging out…' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
