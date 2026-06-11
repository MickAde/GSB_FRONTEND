'use client';
import { LayoutDashboard, FileText, School, BarChart2, User } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/teacher/dashboard',    icon: LayoutDashboard, label: 'Dashboard'          },
  { href: '/teacher/notes',        icon: FileText,        label: 'My Notes'           },
  { href: '/teacher/notes/school', icon: School,          label: 'School Notes'       },
  { href: '/teacher/conformity',   icon: BarChart2,       label: 'Conformity Reports' },
  { href: '/teacher/profile',      icon: User,            label: 'Profile'            },
];

export function TeacherSidebar() {
  return <Sidebar links={links} />;
}
