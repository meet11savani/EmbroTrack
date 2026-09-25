import { useState, type FormEvent } from 'react';
import { UserPlus, Trash2, ShieldCheck, User as UserIcon, X, Save, Eye } from 'lucide-react';
import { useAuth, type ManagedUser } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { formatDate, formatDateTime } from '@/utils/formatters';

interface UserFormData {
  name: string;
  username: string;
  password: string;
  phone: string;
  email: string;
  role: 'user' | 'admin';
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  companyName: string;
  notes: string;
  active: boolean;
}

const EMPTY_FORM: UserFormData = {
  name: '', username: '', password: '', phone: '', email: '', role: 'user',
  address: '', city: '', state: '', pincode: '', gstNumber: '', companyName: '', notes: '',
  active: true,
};

export function UserManagement() {
  const { users, addUser, deleteUser } = useAuth();
  const { showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) errs.name = 'Name is required';
    if (!formData.username.trim()) errs.username = 'Username is required';
    if (!formData.password.trim()) errs.password = 'Password is required';
    else if (formData.password.length < 4) errs.password = 'Password must be at least 4 characters';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      errs.pincode = 'Enter a valid 6-digit pincode';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    const result = await addUser({
      name: formData.name,
      username: formData.username,
      password: formData.password,
      phone: formData.phone,
      email: formData.email,
      role: formData.role,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      gstNumber: formData.gstNumber,
      companyName: formData.companyName,
      notes: formData.notes,
      active: formData.active,
    });
    setSubmitting(false);

    if (!result.success) {
      setErrors({ username: result.error ?? 'Failed to add user' });
      return;
    }

    showToast('User created successfully', 'success');
    setFormData(EMPTY_FORM);
    setErrors({});
    setShowForm(false);
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteUser(deletingUser.id);
    showToast('User deleted', 'success');
    setDeletingUser(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  return (
    <div className="card p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-navy" />
          <h3 className="text-lg font-bold text-navy">User Management</h3>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      <p className="text-sm text-navy-300">
        Only admins can create and delete users. Created users can sign in with their username and password.
      </p>

      {/* User table */}
      {users.length === 0 ? (
        <div className="rounded-xl bg-cream-100 p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-cream-200 flex items-center justify-center mx-auto mb-3">
            <UserIcon size={20} className="text-navy-300" />
          </div>
          <p className="text-sm font-semibold text-navy">No users created yet</p>
          <p className="mt-1 text-xs text-navy-300">Click "Add User" to create a new account.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-cream-200">
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
                      {u.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy-300 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingUser(u)}
                        className="w-7 h-7 rounded-lg border border-navy/20 bg-navy/5 flex items-center justify-center text-navy transition-colors hover:bg-navy hover:text-white"
                        title="View details"
                        aria-label="View details"
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
      )}

      {/* Add user modal */}
      {showForm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="animate-scale-in relative card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
                  <UserPlus size={16} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-navy">Add New User</h3>
              </div>
              <button onClick={closeForm} className="text-navy-300 hover:text-navy">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-field">Full Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`input-field ${errors.name ? 'border-danger' : ''}`}
                  placeholder="Ramesh Patel"
                  autoFocus
                />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Username <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`input-field ${errors.username ? 'border-danger' : ''}`}
                    placeholder="ramesh"
                  />
                  {errors.username && <p className="mt-1 text-xs text-danger">{errors.username}</p>}
                </div>
                <div>
                  <label className="label-field">Password <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`input-field ${errors.password ? 'border-danger' : ''}`}
                    placeholder="••••••"
                  />
                  {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-field">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="98765 43210"
                  />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input
                    type="text"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input-field ${errors.email ? 'border-danger' : ''}`}
                    placeholder="user@example.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="label-field">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input-field"
                  placeholder="Patel Embroidery Works"
                />
              </div>

              <div>
                <label className="label-field">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field min-h-[50px] resize-y"
                  placeholder="Plot 123, Industrial Area"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    placeholder="Surat"
                  />
                </div>
                <div>
                  <label className="label-field">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input-field"
                    placeholder="Gujarat"
                  />
                </div>
                <div>
                  <label className="label-field">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className={`input-field ${errors.pincode ? 'border-danger' : ''}`}
                    placeholder="395006"
                  />
                  {errors.pincode && <p className="mt-1 text-xs text-danger">{errors.pincode}</p>}
                </div>
              </div>

              <div>
                <label className="label-field">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  className="input-field uppercase"
                  placeholder="24ABCDE1234F1Z5"
                />
              </div>

              <div>
                <label className="label-field">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[40px] resize-y"
                  placeholder="Additional info"
                />
              </div>

              <div>
                <label className="label-field">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      formData.role === 'user'
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
                    }`}
                  >
                    <UserIcon size={14} className="inline mr-1.5" /> User
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      formData.role === 'admin'
                        ? 'border-navy bg-navy/10 text-navy'
                        : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
                    }`}
                  >
                    <ShieldCheck size={14} className="inline mr-1.5" /> Admin
                  </button>
                </div>
              </div>

              <div>
                <label className="label-field">Account Status</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: true })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      formData.active
                        ? 'border-teal bg-teal/10 text-teal'
                        : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: false })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                      !formData.active
                        ? 'border-danger bg-danger/10 text-danger'
                        : 'border-cream-300 bg-white text-navy-300 hover:bg-cream-100'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  <Save size={16} /> {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View user modal */}
      {viewingUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setViewingUser(null)} />
          <div className="animate-scale-in relative card p-0 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${viewingUser.role === 'admin' ? 'bg-navy' : 'bg-teal'}`}>
                  {viewingUser.role === 'admin' ? <ShieldCheck size={16} className="text-cream-100" /> : <UserIcon size={16} className="text-white" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">{viewingUser.name}</h3>
                  <p className="text-xs text-navy-300">@{viewingUser.username}</p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} className="text-navy-300 hover:text-navy">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex gap-2">
                <span className={`badge ${viewingUser.role === 'admin' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal'}`}>
                  {viewingUser.role}
                </span>
                <span className={`badge ${viewingUser.active !== false ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>
                  {viewingUser.active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
              {viewingUser.companyName && <p className="text-navy-300"><span className="font-medium text-navy">Company: </span>{viewingUser.companyName}</p>}
              <p className="text-navy-300"><span className="font-medium text-navy">Phone: </span>{viewingUser.phone || '—'}</p>
              <p className="text-navy-300"><span className="font-medium text-navy">Email: </span>{viewingUser.email || '—'}</p>
              {viewingUser.address && <p className="text-navy-300"><span className="font-medium text-navy">Address: </span>{viewingUser.address}, {[viewingUser.city, viewingUser.state, viewingUser.pincode].filter(Boolean).join(', ')}</p>}
              {viewingUser.gstNumber && <p className="text-navy-300"><span className="font-medium text-navy">GST: </span><span className="font-mono">{viewingUser.gstNumber}</span></p>}
              {viewingUser.notes && <p className="text-navy-300"><span className="font-medium text-navy">Notes: </span>{viewingUser.notes}</p>}
              <p className="text-navy-300 pt-2 border-t border-cream-200"><span className="font-medium text-navy">Created: </span>{formatDateTime(viewingUser.createdAt)}</p>
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
