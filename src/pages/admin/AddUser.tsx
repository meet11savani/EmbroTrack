import { useState, type FormEvent } from 'react';
import { UserPlus, ShieldCheck, User as UserIcon, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

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

export function AddUser() {
  const { addUser } = useAuth();
  const { showToast } = useApp();
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
          <UserPlus size={20} className="text-cream-100" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-navy">Add User</h2>
          <p className="text-sm text-navy-300">Create a new user account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 lg:p-8 space-y-5">
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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
              className="input-field min-h-[60px] resize-y"
              placeholder="Plot 123, Industrial Area, Near Textile Market"
            />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
            className="input-field min-h-[50px] resize-y"
            placeholder="Any additional information about this user"
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

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            <Save size={16} /> {submitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}
