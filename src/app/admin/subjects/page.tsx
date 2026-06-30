'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, X, Globe, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getSubjects, createSubject, updateSubject, deleteSubject, getClasses } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import type { Subject, SchoolClass } from '@/types';

// ── Class picker ──────────────────────────────────────────────

function ClassPicker({
  classes,
  selected,
  onChange,
  disabled,
}: {
  classes: SchoolClass[];
  selected: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {classes.map((c) => (
        <button
          key={c.id}
          type="button"
          disabled={disabled}
          onClick={() => toggle(c.id)}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
            selected.includes(c.id)
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-primary',
          )}
        >
          {c.name}
        </button>
      ))}
      {classes.length === 0 && (
        <span className="text-xs text-muted-foreground">No classes yet — add classes first.</span>
      )}
    </div>
  );
}

// ── Subject row (view + inline edit) ─────────────────────────

function SubjectRow({
  subject,
  classes,
  onSave,
  onDelete,
}: {
  subject: Subject;
  classes: SchoolClass[];
  onSave:   (id: string, name: string, isGeneral: boolean, classIds: string[]) => Promise<void>;
  onDelete: (id: string, name: string) => void;
}) {
  const [editing,   setEditing]   = useState(false);
  const [name,      setName]      = useState(subject.name);
  const [isGeneral, setIsGeneral] = useState(subject.is_general);
  const [classIds,  setClassIds]  = useState<string[]>(subject.class_ids);
  const [saving,    setSaving]    = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(subject.id, trimmed, isGeneral, classIds);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setName(subject.name);
    setIsGeneral(subject.is_general);
    setClassIds(subject.class_ids);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') cancel(); }}
          className="h-8 text-sm"
          disabled={saving}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGeneral(!isGeneral)}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              isGeneral
                ? 'border-green-400 bg-green-50 text-green-700'
                : 'border-border bg-card text-muted-foreground hover:border-primary/40',
            )}
          >
            <Globe className="h-3 w-3" />
            {isGeneral ? 'General (all classes)' : 'General subject'}
          </button>
          <span className="text-xs text-muted-foreground">or assign to specific classes:</span>
        </div>

        {!isGeneral && (
          <ClassPicker classes={classes} selected={classIds} onChange={setClassIds} disabled={saving} />
        )}

        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !name.trim()} className="gap-1">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground">{subject.name}</span>
        <div className="mt-0.5 flex flex-wrap gap-1">
          {subject.is_general ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Globe className="h-3 w-3" /> All classes
            </span>
          ) : subject.class_names.length > 0 ? (
            subject.class_names.map((n) => (
              <span key={n} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {n}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No classes assigned</span>
          )}
        </div>
      </div>
      <button type="button" onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary transition-colors">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onDelete(subject.id, subject.name)} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Add subject form ──────────────────────────────────────────

function AddSubjectRow({
  classes,
  onAdd,
}: {
  classes: SchoolClass[];
  onAdd: (name: string, isGeneral: boolean, classIds: string[]) => Promise<void>;
}) {
  const [open,      setOpen]      = useState(false);
  const [name,      setName]      = useState('');
  const [isGeneral, setIsGeneral] = useState(false);
  const [classIds,  setClassIds]  = useState<string[]>([]);
  const [saving,    setSaving]    = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onAdd(trimmed, isGeneral, classIds);
      setName('');
      setIsGeneral(false);
      setClassIds([]);
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
        <Plus className="h-4 w-4" /> Add Subject
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <Input
        autoFocus
        placeholder="Subject name (e.g. Further Mathematics)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
        className="h-8 text-sm"
        disabled={saving}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setIsGeneral(!isGeneral)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            isGeneral
              ? 'border-green-400 bg-green-50 text-green-700'
              : 'border-border bg-card text-muted-foreground hover:border-primary/40',
          )}
        >
          <Globe className="h-3 w-3" />
          {isGeneral ? 'General — visible to all classes' : 'Mark as general subject'}
        </button>
      </div>

      {!isGeneral && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Assign to specific classes:</p>
          <ClassPicker classes={classes} selected={classIds} onChange={setClassIds} disabled={saving} />
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={saving || !name.trim()} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Subject
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default function AdminSubjectsPage() {
  const qc = useQueryClient();

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: queryKeys.adminSubjects(),
    queryFn:  getSubjects,
  });

  const { data: classes = [] } = useQuery({
    queryKey: queryKeys.adminClasses(),
    queryFn:  getClasses,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.adminSubjects() });

  const createMut = useMutation({
    mutationFn: ({ name, isGeneral, classIds }: { name: string; isGeneral: boolean; classIds: string[] }) =>
      createSubject({ name, is_general: isGeneral, class_ids: classIds }),
    onSuccess: (s) => { invalidate(); toast.success(`"${s.name}" added.`); },
    onError:   (err: unknown) => {
      const msg = (err as { response?: { data?: { name?: string[] } } })?.response?.data?.name?.[0];
      toast.error(msg ?? 'Failed to add subject.');
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, name, isGeneral, classIds }: { id: string; name: string; isGeneral: boolean; classIds: string[] }) =>
      updateSubject(id, { name, is_general: isGeneral, class_ids: classIds }),
    onSuccess: () => { invalidate(); toast.success('Subject updated.'); },
    onError:   () => toast.error('Failed to update subject.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess:  () => { invalidate(); toast.success('Subject deleted.'); },
    onError:    () => toast.error('Failed to delete subject.'),
  });

  const handleAdd    = (name: string, isGeneral: boolean, classIds: string[]) =>
    createMut.mutateAsync({ name, isGeneral, classIds });

  const handleSave   = (id: string, name: string, isGeneral: boolean, classIds: string[]) =>
    updateMut.mutateAsync({ id, name, isGeneral, classIds });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete subject "${name}"? This won't affect existing notes or lesson plans.`))
      deleteMut.mutate(id);
  };

  if (loadingSubjects) return <LoadingPage />;

  const generalCount   = subjects.filter((s) => s.is_general).length;
  const specificCount  = subjects.length - generalCount;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage subjects offered by your school. General subjects appear in every class; class-specific subjects only appear for the assigned classes.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Globe className="h-3.5 w-3.5 text-green-600" />
          {generalCount} general subject{generalCount !== 1 ? 's' : ''}
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          {specificCount} class-specific
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-2">
        {subjects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No subjects yet. Add your first subject below.
          </div>
        )}
        {subjects.map((s) => (
          <SubjectRow
            key={s.id}
            subject={s}
            classes={classes}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
        <AddSubjectRow classes={classes} onAdd={handleAdd} />
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: Mark core subjects (Mathematics, English, etc.) as <strong>General</strong> so they appear for every class automatically.
        Add class-specific subjects (e.g. Further Mathematics for SS2 only) by assigning them to individual classes.
      </p>
    </div>
  );
}
