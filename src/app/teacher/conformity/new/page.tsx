'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { useNotes } from '@/hooks/useNotes';
import { useSchoolNotes } from '@/hooks/useNotes';
import { createConformityReport } from '@/lib/api/notes';

const schema = z.object({
  teacher_note_id: z.string().min(1, 'Select your reference note'),
  student_note_id: z.string().min(1, 'Select a student note'),
});
type Fields = z.infer<typeof schema>;

export default function NewConformityPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const { data: myNotes,     isLoading: loadingMine   } = useNotes({ status: 'READY' });
  const { data: schoolNotes, isLoading: loadingSchool } = useSchoolNotes({ status: 'READY' });

  const form = useForm<Fields>({ resolver: zodResolver(schema) });
  const selectedTeacherNote = form.watch('teacher_note_id');

  const onSubmit = async (data: Fields) => {
    try {
      const result = await createConformityReport(data);
      toast.success('Conformity report started');
      router.push(`/teacher/conformity/${result.report_id}/status`);
    } catch {
      toast.error('Failed to create report. Please try again.');
    }
  };

  if (loadingMine || loadingSchool) return <LoadingPage />;

  const myReadyNotes     = myNotes?.results.filter((n) => n.status === 'READY') ?? [];
  const studentReadyNotes = (schoolNotes?.results ?? []).filter(
    (n) => n.status === 'READY' && n.owner_id !== undefined
  );

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New Conformity Report"
        description="Compare a student's note against your reference note."
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold
              ${step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Select your note' : 'Select student note'}
            </span>
            {s < 2 && <div className="mx-1 h-px w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle>Step 1: Your Reference Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myReadyNotes.length === 0 ? (
                <p className="text-sm text-amber-600">
                  You have no processed notes yet. Upload and process a note first before creating a conformity report.
                </p>
              ) : (
                <>
                  <Label>Select your reference note (READY only)</Label>
                  <Select
                    value={form.watch('teacher_note_id')}
                    onValueChange={(v) => form.setValue('teacher_note_id', v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a note…" />
                    </SelectTrigger>
                    <SelectContent>
                      {myReadyNotes.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.file_name}{n.subject ? ` · ${n.subject}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.teacher_note_id && (
                    <p className="text-xs text-red-500">{form.formState.errors.teacher_note_id.message}</p>
                  )}
                </>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={!selectedTeacherNote}
                  onClick={() => setStep(2)}
                >
                  Next →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle>Step 2: Select Student Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {studentReadyNotes.length === 0 ? (
                <p className="text-sm text-amber-600">
                  No student notes with READY status found. Students must upload and process their notes first.
                </p>
              ) : (
                <>
                  <Label>Select a student note to compare (READY only)</Label>
                  <Select
                    value={form.watch('student_note_id')}
                    onValueChange={(v) => form.setValue('student_note_id', v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a student note…" />
                    </SelectTrigger>
                    <SelectContent>
                      {studentReadyNotes.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {n.owner_name} — {n.file_name}{n.subject ? ` · ${n.subject}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.student_note_id && (
                    <p className="text-xs text-red-500">{form.formState.errors.student_note_id.message}</p>
                  )}
                </>
              )}
              <div className="flex justify-between gap-2">
                <Button variant="outline" type="button" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Creating…' : 'Create Report →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}
