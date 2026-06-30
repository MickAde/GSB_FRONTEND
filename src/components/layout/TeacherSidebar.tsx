'use client';
import { LayoutDashboard, FileText, School, BarChart2, User, Users, BookOpen, Brain, Settings } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/teacher/dashboard',    icon: LayoutDashboard, label: 'Dashboard',                              },
  { href: '/teacher/notes',        icon: FileText,        label: 'My Notes',       mobileLabel: 'Notes'   },
  { href: '/teacher/notes/school', icon: School,          label: 'Class Notes',    mobileLabel: 'Class'   },
  { href: '/teacher/conformity',   icon: BarChart2,       label: 'Conformity Reports', mobileLabel: 'Reports' },
  { href: '/teacher/students',     icon: Users,           label: 'Students',                               },
  { href: '/teacher/lesson-docs',  icon: Brain,           label: 'Lesson Documents', mobileLabel: 'Lessons' },
  { href: '/teacher/settings',     icon: Settings,        label: 'Settings',                               },
  { href: '/teacher/profile',      icon: User,            label: 'Profile',                                },
];

export function TeacherSidebar() {
  return <Sidebar links={links} />;
}
