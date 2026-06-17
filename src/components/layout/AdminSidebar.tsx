'use client';
import { LayoutDashboard, Building2, Heart, CalendarDays, Users, User, ClipboardCheck } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/admin/dashboard',     icon: LayoutDashboard,  label: 'Dashboard',              },
  { href: '/admin/school',        icon: Building2,        label: 'School Info',   mobileLabel: 'School'  },
  { href: '/admin/culture',       icon: Heart,            label: 'School Culture', mobileLabel: 'Culture' },
  { href: '/admin/daily-content', icon: CalendarDays,     label: 'Daily Content', mobileLabel: 'Daily'   },
  { href: '/admin/users',         icon: Users,            label: 'Users',                  },
  { href: '/admin/lesson-plans',  icon: ClipboardCheck,   label: 'Lesson Plans',  mobileLabel: 'Plans'   },
  { href: '/admin/profile',       icon: User,             label: 'Profile',                },
];

export function AdminSidebar() {
  return <Sidebar links={links} />;
}
