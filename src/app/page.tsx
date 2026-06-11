'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight, GraduationCap, Zap, Star, Trophy, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

const features = [
  { icon: Brain,  color: 'bg-primary/10 text-primary',       title: 'AI-Powered Summaries', desc: 'Upload any note and get a clear, concise summary in seconds.'          },
  { icon: Zap,    color: 'bg-amber-100 text-amber-600',       title: 'Instant Processing',   desc: 'PDF, images, voice notes — we read it all for you, fast.'              },
  { icon: Trophy, color: 'bg-emerald-100 text-emerald-600',   title: 'Track Your Progress',  desc: "See how your notes grow and how much you've been studying."            },
  { icon: Star,   color: 'bg-accent/10 text-accent',          title: 'Teacher Insights',     desc: 'Teachers can compare student notes and give smarter feedback.'         },
];

const stats = [
  { value: '5,000+', label: 'Students Learning' },
  { value: '98%',    label: 'Accuracy Rate'      },
  { value: '< 30s',  label: 'Processing Time'    },
];

export default function LandingPage() {
  const { isAuthenticated, role, isStaff } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Use mounted to avoid SSR/client auth mismatch (Zustand persist reads localStorage)
  const authed = mounted && isAuthenticated;

  const dashboardRoute = () => {
    if (isStaff) return '/platform/dashboard';
    const routes: Record<string, string> = {
      STUDENT:    '/student/dashboard',
      TEACHER:    '/teacher/dashboard',
      MAIN_ADMIN: '/admin/dashboard',
      SUB_ADMIN:  '/admin/dashboard',
      VISITOR:    '/visitor/dashboard',
    };
    return routes[role ?? ''] ?? '/';
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold font-display text-foreground">Genius Study Buddy</span>
        </div>
        <div className="flex items-center gap-3">
          {authed ? (
            <Button
              className="rounded-xl gradient-primary font-semibold text-white shadow-md hover:opacity-90"
              onClick={() => router.push(dashboardRoute())}
            >
              Go to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="font-semibold text-muted-foreground hover:text-primary">Log in</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-xl gradient-primary font-semibold text-white shadow-md hover:opacity-90">
                  Try for Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-1 flex-col items-center overflow-hidden px-6 py-20 text-center lg:py-28">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-[300px] w-[300px] rounded-full bg-accent/10 blur-[80px]" />

        <h1 className="relative max-w-3xl text-5xl font-bold font-display leading-tight text-foreground lg:text-6xl">
          Study smarter,{' '}
          <span className="gradient-text">achieve more.</span>
        </h1>

        <p className="relative mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          GSB turns your handwritten notes, PDFs and voice recordings into clear AI summaries —
          helping Nigerian secondary school students hit their full potential.
        </p>

        <div className="relative mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {authed ? (
            <Button
              size="lg"
              className="h-12 rounded-2xl px-8 gradient-primary text-lg font-semibold text-white shadow-xl hover:opacity-90 transition-opacity"
              onClick={() => router.push(dashboardRoute())}
            >
              Continue Learning <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <>
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 rounded-2xl px-8 gradient-primary text-lg font-semibold text-white shadow-xl hover:opacity-90 transition-opacity"
                >
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/schools">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-2xl border-border px-8 text-lg font-semibold text-foreground hover:bg-muted"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Enter via School
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="relative mt-16 grid grid-cols-3 gap-6 sm:gap-12">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold font-display text-foreground">{value}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-muted/30 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold font-display text-foreground">Everything you need to excel</h2>
            <p className="mt-3 text-base text-muted-foreground">Built specifically for secondary school students and teachers in Nigeria.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-sm card-hover">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-16 lg:px-10">
        <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl gradient-primary p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-bold font-display text-white">Ready to boost your grades?</h2>
          <p className="mt-3 text-base text-white/80">Join thousands of students across Nigeria already studying smarter.</p>
          <Link href="/register">
            <Button
              size="lg"
              className="mt-8 h-12 rounded-2xl bg-white px-8 text-base font-semibold text-primary shadow-lg hover:bg-white/90"
            >
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card px-6 py-6">
        <p className="text-center text-sm text-muted-foreground">
          © 2026 Genius Study Buddy · Built for Nigerian secondary schools
        </p>
      </footer>

    </div>
  );
}
