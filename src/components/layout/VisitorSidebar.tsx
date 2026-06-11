'use client';
import { LayoutDashboard, FileText, User } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/visitor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/visitor/notes',     icon: FileText,        label: 'My Notes'  },
  { href: '/visitor/profile',   icon: User,            label: 'Profile'   },
];

export function VisitorSidebar() {
  return <Sidebar links={links} />;
}
