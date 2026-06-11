'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { deleteDailyContent } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { DailyContent } from '@/types';

const typeColors: Record<string, string> = {
  STUDENT_QUOTE: 'bg-blue-100 text-blue-700',
  TEACHER_TIP:   'bg-green-100 text-green-700',
  ADMIN_INSIGHT: 'bg-purple-100 text-purple-700',
};

interface Props {
  items:   DailyContent[];
  onEdit:  (item: DailyContent) => void;
}

export function DailyContentTable({ items, onEdit }: Props) {
  const qc       = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DailyContent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDailyContent(deleteTarget.id);
      qc.invalidateQueries({ queryKey: queryKeys.adminDailyContent() });
      toast.success('Content deleted');
    } catch {
      toast.error('Failed to delete content');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.display_date}</TableCell>
                <TableCell>
                  <Badge className={`border-0 text-xs ${typeColors[item.content_type] ?? ''}`}>
                    {item.content_type.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate text-sm text-gray-700">{item.body}</TableCell>
                <TableCell className="text-sm text-gray-500">{item.author}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this content?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
