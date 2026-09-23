import { useState, useEffect } from 'react';
import { Trash2, Eye, X, ShieldCheck, User as UserIcon, Users as UsersIcon, MapPin, Building2, FileText, Phone, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useAuth, type ManagedUser } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, formatDateTime } from '@/utils/formatters';

export function UsersData() {
  const { users, deleteUser, refreshUsers } = useAuth();
  const { showToast } = useApp();
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
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
                  {['Name', 'Username', 'Phone', 'Role', 'Status', 'Created', 'Actions'].map((label, i) => (
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${u.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'}`}>
                        {u.role === 'admin' ? <ShieldCheck size={12} /> : <UserIcon size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`badge ${u.active !== false ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>
                        {u.active !== false ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {u.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="w-7 h-7 rounded-lg border border-navy/20 bg-navy/5 flex items-center justify-center text-navy transition-colors hover:bg-navy hover:text-white"
                          title="View user details"
                          aria-label="View user details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="w-7 h-7 rounded-lg border border-danger/20 bg-danger/5 flex items-center justify-center text-danger transition-colors hover:bg-danger hover:text-white"
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View user modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setViewingUser(null)} />
          <div className="animate-scale-in relative card p-0 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-cream-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewingUser.role === 'admin' ? 'bg-navy' : 'bg-teal'}`}>
                  {viewingUser.role === 'admin' ? <ShieldCheck size={18} className="text-cream-100" /> : <UserIcon size={18} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-navy">{viewingUser.name}</h3>
                  <p className="text-xs text-navy-300">@{viewingUser.username}</p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-navy-300 hover:text-navy">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className={`badge justify-center ${viewingUser.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'}`}>
                  {viewingUser.role === 'admin' ? <ShieldCheck size={14} /> : <UserIcon size={14} />}
                  {viewingUser.role}
                </div>
                <div className={`badge justify-center ${viewingUser.active !== false ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>
                  {viewingUser.active !== false ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {viewingUser.active !== false ? 'Active' : 'Inactive'}
                </div>
              </div>

              {viewingUser.companyName && (
                <div className="flex items-start gap-3">
                  <Building2 size={16} className="text-navy-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-navy-300">Company</p>
                    <p className="text-sm text-navy">{viewingUser.companyName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone size={16} className="text-navy-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-navy-300">Phone</p>
                  <p className="text-sm text-navy">{viewingUser.phone || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail size={16} className="text-navy-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-navy-300">Email</p>
                  <p className="text-sm text-navy break-all">{viewingUser.email || '—'}</p>
                </div>
              </div>

              {viewingUser.address && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-navy-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-navy-300">Address</p>
                    <p className="text-sm text-navy">{viewingUser.address}</p>
                    {(viewingUser.city || viewingUser.state || viewingUser.pincode) && (
                      <p className="text-sm text-navy-300">
                        {[viewingUser.city, viewingUser.state, viewingUser.pincode].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {viewingUser.gstNumber && (
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-navy-300 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-navy-300">GST Number</p>
                    <p className="text-sm text-navy font-mono">{viewingUser.gstNumber}</p>
                  </div>
                </div>
              )}

              {viewingUser.notes && (
                <div className="rounded-xl bg-cream-100 p-3">
                  <p className="text-xs font-medium text-navy-300 mb-1">Notes</p>
                  <p className="text-sm text-navy whitespace-pre-wrap">{viewingUser.notes}</p>
                </div>
              )}

              <div className="flex items-start gap-3 pt-3 border-t border-cream-200">
                <Calendar size={16} className="text-navy-300 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-navy-300">Created</p>
                  <p className="text-sm text-navy">{formatDateTime(viewingUser.createdAt)}</p>
                </div>
              </div>
            </div>
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
