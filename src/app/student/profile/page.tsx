'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { User, Lock, LogOut, Loader2, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthStore } from '@/stores/authStore';
import { updateMe, logout, uploadAvatar, deleteAvatar } from '@/lib/api/auth';
import { clearTokens, getTokens } from '@/lib/token';
import { queryKeys } from '@/lib/query-keys';

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name:  z.string().min(1, 'Required'),
});
type Fields = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: user }   = useCurrentUser();
  const qc               = useQueryClient();
  const router           = useRouter();
  const clearAuth        = useAuthStore((s) => s.clearAuth);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) form.reset({ first_name: user.first_name, last_name: user.last_name });
  }, [user, form]);

  const onSubmit = async (data: Fields) => {
    try {
      await updateMe(data);
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side validation matching backend rules
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, or GIF files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setAvatarLoading(true);
    try {
      await uploadAvatar(file);
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setAvatarLoading(false);
      // Reset the input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarLoading(true);
    try {
      await deleteAvatar();
      qc.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Profile photo removed');
    } catch {
      toast.error('No profile photo to remove');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      const { refresh } = getTokens();
      if (refresh) await logout(refresh);
    } catch {}
    clearTokens();
    clearAuth();
    toast.success('See you soon!');
    router.push('/');
  };

  const initials  = user ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || 'U' : 'U';
  const fullName  = user ? `${user.first_name} ${user.last_name}`.trim() : '…';
  const roleLabel = user?.role?.replace(/_/g, ' ') ?? '';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Profile & Settings" />

      {/* ── Profile info ── */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Your Profile</h2>
        </div>

        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-border">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </div>
              )}
              {/* Upload overlay */}
              {avatarLoading ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/0 hover:bg-black/40 transition-colors group"
                  title="Change photo"
                >
                  <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name + role + avatar actions */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{fullName}</p>
            <p className="text-sm text-muted-foreground capitalize">{roleLabel.toLowerCase()}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email ?? user?.username}</p>
            {user?.school_name && (
              <p className="text-xs text-muted-foreground/70">{user.school_name}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {user?.avatar_url ? 'Change photo' : 'Upload photo'}
              </button>
              {user?.avatar_url && (
                <>
                  <span className="text-border">·</span>
                  <button
                    onClick={handleAvatarRemove}
                    disabled={avatarLoading}
                    className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First Name</Label>
            <Input className="rounded-xl" {...form.register('first_name')} />
            {form.formState.errors.first_name && (
              <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Last Name</Label>
            <Input className="rounded-xl" {...form.register('last_name')} />
            {form.formState.errors.last_name && (
              <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
            )}
          </div>
          <div className="col-span-2 flex justify-end">
            <Button
              type="submit"
              className="gradient-primary rounded-xl font-semibold text-white shadow-md shadow-primary/25 hover:opacity-90"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : 'Save Changes'
              }
            </Button>
          </div>
        </form>
      </div>

      {/* ── Change password ── */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Change Password</h2>
        </div>
        <ChangePasswordForm />
      </div>

      {/* ── Logout ── */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Sign out</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ends your session and blacklists your refresh token on the server.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing out…</>
              : <><LogOut className="h-4 w-4" /> Sign Out</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
