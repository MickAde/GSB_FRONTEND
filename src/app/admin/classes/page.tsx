'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getClasses, createClass, renameClass, deleteClass } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { SchoolClass } from '@/types';

// ── Inline-edit row ───────────────────────────────────────────

function ClassRow({
  cls,
  onRename,
  onDelete,
}: {
  cls: SchoolClass;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(cls.name);
  const [saving,  setSaving]  = useState(false);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === cls.name) { setEditing(false); return; }
    setSaving(true);
    try {
      await onRename(cls.id, trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {editing ? (
        <>
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(cls.name); setEditing(false); }}}
            className="h-8 flex-1 text-sm"
            disabled={saving}
          />
          <button type="button" onClick={save} disabled={saving} className="text-primary hover:text-primary/80 disabled:opacity-40">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => { setValue(cls.name); setEditing(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-semibold text-foreground">{cls.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {cls.member_count} member{cls.member_count !== 1 ? 's' : ''}
          </span>
          <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onDelete(cls.id, cls.name)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Add class form ────────────────────────────────────────────

function AddClassRow({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
  const [open,  setOpen]  = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    try {
      await onAdd(name);
      setValue('');
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-4 w-4" />
        Add Class
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-2">
      <Plus className="h-4 w-4 shrink-0 text-primary" />
      <Input
        autoFocus
        placeholder="Class name (e.g. JSS 1A)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }}
        className="h-8 flex-1 border-0 bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
        disabled={saving}
      />
      <button type="button" onClick={submit} disabled={!value.trim() || saving} className="text-primary hover:text-primary/80 disabled:opacity-40">
        <Check className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function AdminClassesPage() {
  const qc = useQueryClient();

  const { data: classes = [], isLoading } = useQuery({
    queryKey: queryKeys.adminClasses(),
    queryFn:  getClasses,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.adminClasses() });

  const createMut = useMutation({
    mutationFn: (name: string) => createClass(name),
    onSuccess:  (cls) => { invalidate(); toast.success(`"${cls.name}" created.`); },
    onError:    (err: unknown) => {
      const msg = (err as { response?: { data?: { name?: string[] } } })?.response?.data?.name?.[0];
      toast.error(msg ?? 'Failed to create class.');
    },
  });

  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameClass(id, name),
    onSuccess:  () => { invalidate(); toast.success('Class renamed.'); },
    onError:    () => toast.error('Failed to rename class.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteClass(id),
    onSuccess:  () => { invalidate(); toast.success('Class deleted.'); },
    onError:    () => toast.error('Failed to delete class.'),
  });

  const handleAdd    = async (name: string) => { await createMut.mutateAsync(name); };
  const handleRename = async (id: string, name: string) => { await renameMut.mutateAsync({ id, name }); };
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete class "${name}"? Students and teachers assigned to it will become unclassified.`)) {
      deleteMut.mutate(id);
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Classes</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage school classes. Assign students and teachers to a class when creating accounts.
        </p>
      </div>

      {/* Stats chip */}
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        {classes.length} class{classes.length !== 1 ? 'es' : ''} · {classes.reduce((s, c) => s + c.member_count, 0)} total members
      </div>

      {/* Class list */}
      <div className="space-y-2">
        {classes.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No classes yet. Add your first class below.
          </div>
        )}
        {classes.map((cls) => (
          <ClassRow
            key={cls.id}
            cls={cls}
            onRename={handleRename}
            onDelete={handleDelete}
          />
        ))}
        <AddClassRow onAdd={handleAdd} />
      </div>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Common Nigerian secondary school classes: JSS 1A–3C, SS 1A–3C.
        Teachers assigned to a class only see students from that class in their monitoring dashboard.
      </p>
    </div>
  );
}
