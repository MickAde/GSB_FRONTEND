'use client';
import { LayoutDashboard, Building2 } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/platform/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/platform/schools',   icon: Building2,       label: 'Schools'   },
];

export function PlatformSidebar() {
  return <Sidebar links={links} />;
}
