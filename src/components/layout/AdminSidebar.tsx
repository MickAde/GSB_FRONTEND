'use client';
import { LayoutDashboard, Building2, Heart, CalendarDays, Users, GraduationCap, Brain, User, BookOpen, ClipboardCheck } from 'lucide-react';
import { Sidebar, type SidebarLink } from './StudentSidebar';

const links: SidebarLink[] = [
  { href: '/admin/dashboard',     icon: LayoutDashboard,  label: 'Dashboard',                              },
  { href: '/admin/school',        icon: Building2,        label: 'School Info',      mobileLabel: 'School'  },
  { href: '/admin/culture',       icon: Heart,            label: 'School Culture',   mobileLabel: 'Culture' },
  { href: '/admin/daily-content', icon: CalendarDays,     label: 'Daily Content',    mobileLabel: 'Daily'   },
  { href: '/admin/users',         icon: Users,            label: 'Users',                                  },
  { href: '/admin/classes',       icon: GraduationCap,    label: 'Classes',          mobileLabel: 'Classes' },
  { href: '/admin/subjects',      icon: BookOpen,         label: 'Subjects',         mobileLabel: 'Subjects'},
  { href: '/admin/lesson-docs',   icon: Brain,            label: 'Lesson Documents', mobileLabel: 'Lessons' },
  { href: '/admin/lesson-plans',  icon: ClipboardCheck,   label: 'Lesson Plans',     mobileLabel: 'Plans'   },
  { href: '/admin/profile',       icon: User,             label: 'Profile',                                },
];

export function AdminSidebar() {
  return <Sidebar links={links} />;
}
