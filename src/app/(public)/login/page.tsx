'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen, BrainCircuit, Sparkles, ArrowLeft,
  Eye, EyeOff, Loader2, GraduationCap, Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SchoolGrid } from '@/components/schools/SchoolGrid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { login } from '@/lib/api/auth';
import { getActiveSchools } from '@/lib/api/schools';
import { setTokens, decodeTokenSync } from '@/lib/token';
import { useAuthStore } from '@/stores/authStore';
import { useSchoolStore } from '@/stores/schoolStore';
import { queryKeys } from '@/lib/query-keys';
import type { SchoolPublic, UserRole } from '@/types';
import type { Resolver } from 'react-hook-form';

type AuthStep = 'schools' | 'role' | 'form';
type RoleChoice = 'STUDENT' | 'TEACHER' | 'ADMIN';

const studentSchema = z.object({
  identifier: z.string().min(1, 'Required'),
  password:   z.string().min(1, 'Required'),
});
const emailSchema = z.object({
  identifier: z.string().email('Enter a valid email'),
  password:   z.string().min(1, 'Required'),
});
type Fields = z.infer<typeof studentSchema>;

const ROLE_OPTIONS: { role: RoleChoice; emoji: string; label: string; color: string; activeColor: string }[] = [
  { role: 'STUDENT', emoji: '🎓', label: 'Student', color: 'border-border hover:border-emerald-400', activeColor: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  { role: 'TEACHER', emoji: '👨‍🏫', label: 'Teacher', color: 'border-border hover:border-blue-400',    activeColor: 'border-blue-500 bg-blue-50 text-blue-700'         },
  { role: 'ADMIN',   emoji: '🛡️', label: 'Admin',   color: 'border-border hover:border-purple-400',  activeColor: 'border-purple-500 bg-purple-50 text-purple-700'   },
];

const ROLE_MAP: Record<RoleChoice, UserRole> = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN:   'MAIN_ADMIN',
};

const ROLE_ROUTES: Record<string, string> = {
  STUDENT:    '/student/dashboard',
  TEACHER:    '/teacher/dashboard',
  MAIN_ADMIN: '/admin/dashboard',
  SUB_ADMIN:  '/admin/dashboard',
  VISITOR:    '/visitor/dashboard',
};

export default function LoginPage() {
  const router            = useRouter();
  const setAuth           = useAuthStore((s) => s.setTokens);
  const setSelectedSchool = useSchoolStore((s) => s.setSelectedSchool);

  const [step, setStep]           = useState<AuthStep>('schools');
  const [school, setSchool]       = useState<SchoolPublic | null>(null);
  const [roleChoice, setRole]     = useState<RoleChoice>('STUDENT');
  const [showPassword, setShow]   = useState(false);
  const [searchQuery, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.schools.active(),
    queryFn:  getActiveSchools,
  });

  const filtered = searchQuery
    ? (data ?? []).filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (data ?? []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleSchoolSelect = (selected: SchoolPublic) => {
    setSchool(selected);
    setSelectedSchool(selected);
    setStep('role');
  };

  const isStudent = roleChoice === 'STUDENT';
  const schema    = isStudent ? studentSchema : emailSchema;
  const form      = useForm<Fields>({ resolver: zodResolver(schema) as Resolver<Fields> });

  const onSubmit = async (data: Fields) => {
    const attemptLogin = async (role: UserRole) => {
      const tokens  = await login({
        role,
        identifier: data.identifier,
        password:   data.password,
        school_id:  school!.id,
      });
      const decoded = decodeTokenSync(tokens.access);
      if (!decoded) throw new Error('Invalid token');
      setTokens(tokens.access, tokens.refresh);
      setAuth(tokens.access, tokens.refresh, decoded);
      sessionStorage.removeItem('gsb_selected_school_id');
      sessionStorage.removeItem('gsb_selected_school_name');
      router.push(
        decoded.is_staff ? '/platform/dashboard' : (ROLE_ROUTES[decoded.role] ?? '/')
      );
    };

    const showError = (err: unknown) => {
      const e    = err as { response?: { data?: { detail?: string; error_code?: string } } };
      const code = e?.response?.data?.error_code;
      if (code === 'SCHOOL_REQUIRED' || code === 'WRONG_SCHOOL') {
        toast.error('School mismatch. Please go back and select the correct school.');
        setStep('schools');
      } else if (code === 'INVALID_CREDENTIALS') {
        toast.error('Incorrect username or password.');
      } else if (code === 'ROLE_MISMATCH') {
        toast.error('The selected role does not match this account.');
      } else if (code === 'ACCOUNT_DISABLED') {
        toast.error('This account has been deactivated. Contact your school admin.');
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email before logging in.');
      } else {
        toast.error(e?.response?.data?.detail ?? 'Login failed. Please try again.');
      }
    };

    try {
      await attemptLogin(ROLE_MAP[roleChoice]);
    } catch (firstErr: unknown) {
      const code = (firstErr as { response?: { data?: { error_code?: string } } })?.response?.data?.error_code;
      if (code === 'ROLE_MISMATCH' && roleChoice === 'ADMIN') {
        try { await attemptLogin('SUB_ADMIN'); return; } catch (secondErr) { showError(secondErr); return; }
      }
      showError(firstErr);
    }
  };

  // ── Left hero copy varies per step ──
  const heroTitle = step === 'schools'
    ? <>Find your school<br /><span className="text-white/80">and start learning.</span></>
    : step === 'role'
    ? <>Who are you<br /><span className="text-white/80">signing in as?</span></>
    : <>Welcome back<br /><span className="text-white/80">to {school?.name ?? 'your school'}.</span></>;

  const heroSub = step === 'schools'
    ? 'Select your school from the list to sign in as a student, teacher, or admin.'
    : step === 'role'
    ? 'Choose your role so we know where to take you after login.'
    : 'Enter your credentials to access your dashboard.';

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left Hero ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/30 blur-[120px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white/90 mb-8">
            <BookOpen className="w-8 h-8" />
            <span className="text-xl font-bold font-display">Genius Study Buddy</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">{heroTitle}</h1>
          <p className="text-lg text-primary-foreground/80 max-w-lg leading-relaxed">{heroSub}</p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-5">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <BrainCircuit className="w-7 h-7 text-white mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Smart Summaries</h3>
            <p className="text-white/70 text-sm">Turn messy notes into clear study guides.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
            <Sparkles className="w-7 h-7 text-white mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Active Recall</h3>
            <p className="text-white/70 text-sm">Auto-generated quizzes to test your knowledge.</p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col bg-background min-h-screen">
        <div className="flex-1 p-6 md:p-10 max-w-xl mx-auto w-full">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <BookOpen className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold font-display text-primary">Genius Study Buddy</span>
          </div>

          {/* ── Step 1: School Selection ── */}
          {step === 'schools' && (
            <>
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Select Your School</h2>
                <p className="text-muted-foreground text-sm mt-1">Choose your school to continue</p>
              </div>

              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search school name…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading schools…
                </div>
              ) : (
                <SchoolGrid schools={filtered} onSelect={handleSchoolSelect} />
              )}

              <p className="mt-8 text-center text-sm text-muted-foreground">
                Not a school user?{' '}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Register as a visitor
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: Role Selection ── */}
          {step === 'role' && (
            <>
              <button
                onClick={() => setStep('schools')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {/* School badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 mb-6">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt={school.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-foreground">{school?.name}</p>
                  <p className="text-xs text-muted-foreground">School portal</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">I am a&hellip;</h2>
                <p className="text-sm text-muted-foreground mt-1">Choose your role to continue</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {ROLE_OPTIONS.map(({ role, emoji, label, activeColor, color }) => (
                  <button
                    key={role}
                    onClick={() => setRole(role)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      roleChoice === role ? activeColor : `border-border hover:bg-muted/50 ${color}`
                    }`}
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <div className="font-semibold text-xs">{label}</div>
                  </button>
                ))}
              </div>

              <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep('form')}>
                Continue
              </Button>
            </>
          )}

          {/* ── Step 3: Login Form ── */}
          {step === 'form' && (
            <>
              <button
                onClick={() => { setStep('role'); form.reset(); }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {/* School badge */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 mb-6">
                {school?.logo_url ? (
                  <img src={school.logo_url} alt={school?.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-foreground">{school?.name}</p>
                  <p className="text-xs text-muted-foreground">School portal</p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {roleChoice === 'STUDENT' ? 'Student' : roleChoice === 'ADMIN' ? 'Admin' : 'Teacher'} Login
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Signing in to {school?.name}
                </p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    {isStudent ? 'Admission Number' : 'Email Address'}
                  </Label>
                  <Input
                    id="identifier"
                    type={isStudent ? 'text' : 'email'}
                    placeholder={isStudent ? 'e.g. ADM/2024/001' : 'name@school.edu.ng'}
                    {...form.register('identifier')}
                  />
                  {form.formState.errors.identifier && (
                    <p className="text-xs text-destructive">{form.formState.errors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...form.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShow((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : `Sign In as ${roleChoice === 'STUDENT' ? 'Student' : roleChoice === 'ADMIN' ? 'Admin' : 'Teacher'}`
                  }
                </Button>

                <div className="text-center">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
