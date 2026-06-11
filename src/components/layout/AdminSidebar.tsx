'use client';
import { LayoutDashboard, Building2, Heart, CalendarDays, Users, User } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/admin/school',        icon: Building2,       label: 'School Info'   },
  { href: '/admin/culture',       icon: Heart,           label: 'School Culture'},
  { href: '/admin/daily-content', icon: CalendarDays,    label: 'Daily Content' },
  { href: '/admin/users',         icon: Users,           label: 'Users'         },
  { href: '/admin/profile',       icon: User,            label: 'Profile'       },
];

export function AdminSidebar() {
  return <Sidebar links={links} />;
}
