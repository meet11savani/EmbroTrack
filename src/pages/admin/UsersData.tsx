/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { Trash2, ShieldCheck, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { useAuth, type ManagedUser } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate } from '@/utils/formatters';

export function UsersData() {
  const { users, deleteUser, refreshUsers } = useAuth();
  const { showToast } = useApp();
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    await deleteUser(deletingUser.id);
    setDeleting(false);
    showToast('User deleted', 'success');
    setDeletingUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
          <UsersIcon size={20} className="text-cream-100" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy">Users Data</h2>
          <p className="text-sm text-navy-300">View and manage all registered users</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-cream-100 flex items-center justify-center mx-auto mb-3">
            <UserIcon size={20} className="text-navy-300" />
          </div>
          <p className="text-sm font-semibold text-navy">No users created yet</p>
          <p className="mt-1 text-xs text-navy-300">Use the "Add User" page to create a new account.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-100 border-b border-cream-300">
                  {['Name', 'Username', 'Phone', 'Email', 'Role', 'Created', 'Actions'].map((label, i) => (
                    <th key={i} className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-xs font-bold uppercase tracking-wide text-navy-300">{label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr
                    key={u.id}
                    className={`border-b border-cream-200 transition-colors hover:bg-cream-50 ${
                      index % 2 === 1 ? 'bg-cream-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{u.username}</td>
                    <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{u.phone || '—'}</td>
                    <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{u.email || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${u.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setDeletingUser(u)}
                        className="w-7 h-7 rounded-lg border border-danger/20 bg-danger/5 flex items-center justify-center text-danger transition-colors hover:bg-danger hover:text-white"
                        title="Delete user"
                        aria-label="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deletingUser}
        title="Delete this user?"
        message={`${deletingUser?.name} (${deletingUser?.username}) will no longer be able to sign in. This cannot be undone.`}
        confirmLabel="Delete User"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
