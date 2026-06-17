'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { DailyContentTable } from '@/components/admin/DailyContentTable';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingPage } from '@/components/common/LoadingSpinner';
import { getDailyContent, createDailyContent, updateDailyContent } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { DailyContent, ContentType } from '@/types';

const schema = z.object({
  content_type: z.string().min(1),
  display_date: z.string().min(1, 'Date required'),
  body:         z.string().min(1, 'Body required'),
  author:       z.string().min(1, 'Author required'),
});
type Fields = z.infer<typeof schema>;

export default function DailyContentPage() {
  const qc = useQueryClient();
  const [open, setOpen]       = useState(false);
  const [editItem, setEditItem] = useState<DailyContent | null>(null);
  const [conflict, setConflict] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: queryKeys.adminDailyContent(),
    queryFn:  () => getDailyContent(),
  });

  const form = useForm<Fields>({ resolver: zodResolver(schema) });

  const openCreate = () => { setEditItem(null); form.reset({ content_type: 'STUDENT_QUOTE' }); setConflict(''); setOpen(true); };
  const openEdit   = (item: DailyContent) => {
    setEditItem(item);
    form.reset({ content_type: item.content_type, display_date: item.display_date, body: item.body, author: item.author });
    setConflict('');
    setOpen(true);
  };

  const onSubmit = async (data: Fields) => {
    setConflict('');
    try {
      if (editItem) {
        await updateDailyContent(editItem.id, { body: data.body, author: data.author });
        toast.success('Content updated');
      } else {
        await createDailyContent(data as unknown as Parameters<typeof createDailyContent>[0]);
        toast.success('Content created');
      }
      qc.invalidateQueries({ queryKey: queryKeys.adminDailyContent() });
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error_code?: string }; status?: number } };
      if (e?.response?.status === 409) {
        setConflict(`A ${data.content_type.replace('_', ' ')} already exists for ${data.display_date}. Edit the existing entry instead.`);
      } else {
        toast.error('Failed to save content.');
      }
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Daily Content"
        description="Manage daily quotes, tips, and insights for each role."
        actions={
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Content
          </Button>
        }
      />

      {items?.length ? (
        <DailyContentTable items={items} onEdit={openEdit} />
      ) : (
        <EmptyState
          title="No daily content yet"
          description="Add quotes, tips, and insights for your school community."
          action={{ label: 'Add Content', onClick: openCreate }}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Content' : 'Add Daily Content'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {editItem ? (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
                <p><strong>Type:</strong> {editItem.content_type.replace('_', ' ')}</p>
                <p><strong>Date:</strong> {editItem.display_date}</p>
                <p className="text-xs">Type and date cannot be changed. Delete and recreate to change them.</p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label>Content Type</Label>
                  <Select defaultValue="STUDENT_QUOTE" onValueChange={(v) => form.setValue('content_type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDENT_QUOTE">Student Quote</SelectItem>
                      <SelectItem value="TEACHER_TIP">Teacher Tip</SelectItem>
                      <SelectItem value="ADMIN_INSIGHT">Admin Insight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Display Date</Label>
                  <Input type="date" {...form.register('display_date')} />
                  {form.formState.errors.display_date && <p className="text-xs text-red-500">{form.formState.errors.display_date.message}</p>}
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label>Body</Label>
              <Textarea {...form.register('body')} rows={3} />
              {form.formState.errors.body && <p className="text-xs text-red-500">{form.formState.errors.body.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Author</Label>
              <Input {...form.register('author')} />
              {form.formState.errors.author && <p className="text-xs text-red-500">{form.formState.errors.author.message}</p>}
            </div>

            {conflict && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{conflict}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Savingâ€¦' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
