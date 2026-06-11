'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Eye, Edit2, Lock, UserX, UserCheck } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { deactivateUser, updateUser } from '@/lib/api/admin';
import { queryKeys } from '@/lib/query-keys';
import type { UserListItem, UserRole } from '@/types';

const roleColors: Record<UserRole, string> = {
  STUDENT:    'bg-blue-100 text-blue-700',
  TEACHER:    'bg-green-100 text-green-700',
  MAIN_ADMIN: 'bg-purple-100 text-purple-700',
  SUB_ADMIN:  'bg-indigo-100 text-indigo-700',
  VISITOR:    'bg-gray-100 text-gray-600',
};

interface Props {
  users:         UserListItem[];
  currentRole:   UserRole | null;
  onEdit:        (user: UserListItem) => void;
  onSetPassword: (user: UserListItem) => void;
  onView:        (user: UserListItem) => void;
}

export function UserTable({ users, currentRole, onEdit, onSetPassword, onView }: Props) {
  const qc = useQueryClient();
  const [confirmUser, setConfirmUser] = useState<UserListItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const canEdit = (user: UserListItem) => {
    if (user.role === 'MAIN_ADMIN') return false;
    if (currentRole === 'SUB_ADMIN' && user.role === 'SUB_ADMIN') return false;
    return true;
  };

  const handleDeactivate = async () => {
    if (!confirmUser) return;
    setDeactivating(true);
    try {
      if (confirmUser.is_active) {
        await deactivateUser(confirmUser.id);
      } else {
        await updateUser(confirmUser.id, { is_active: true });
      }
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers.all() });
      toast.success(`User ${confirmUser.is_active ? 'deactivated' : 'reactivated'} successfully`);
    } catch {
      toast.error('Failed to update user status.');
    } finally {
      setDeactivating(false);
      setConfirmUser(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Email / Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>
                  <Badge className={`border-0 text-xs ${roleColors[user.role] ?? ''}`}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {user.email ?? user.username ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge className={user.is_active ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(user.date_joined)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      {canEdit(user) && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onSetPassword(user)}>
                            <Lock className="mr-2 h-4 w-4" /> Set Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmUser(user)}
                            className={user.is_active ? 'text-red-600' : 'text-green-600'}
                          >
                            {user.is_active
                              ? <><UserX className="mr-2 h-4 w-4" /> Deactivate</>
                              : <><UserCheck className="mr-2 h-4 w-4" /> Reactivate</>
                            }
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!confirmUser}
        onOpenChange={(o) => !o && setConfirmUser(null)}
        title={confirmUser?.is_active ? 'Deactivate user?' : 'Reactivate user?'}
        description={
          confirmUser?.is_active
            ? 'This will prevent the user from logging in.'
            : 'This will allow the user to log in again.'
        }
        confirmLabel={confirmUser?.is_active ? 'Deactivate' : 'Reactivate'}
        onConfirm={handleDeactivate}
        loading={deactivating}
      />
    </>
  );
}
