import { useState, useEffect, type FormEvent } from 'react';
import { X, HardHat, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Worker } from '@/types';

export interface WorkerFormData {
  name: string;
  phone: string;
  role: string;
  notes: string;
}

interface WorkerFormProps {
  editingWorker?: Worker | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function WorkerForm({ editingWorker, onClose, onSaved }: WorkerFormProps) {
  const { addWorker, updateWorker, workers } = useApp();
  const isEditing = !!editingWorker;
  const [formData, setFormData] = useState<WorkerFormData>({
    name: '',
    phone: '',
    role: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingWorker) {
      setFormData({
        name: editingWorker.name,
        phone: editingWorker.phone,
        role: editingWorker.role,
        notes: editingWorker.notes,
      });
    }
  }, [editingWorker]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Worker name is required';
    } else {
      const duplicate = workers.find(
        (w) =>
          w.name.toLowerCase() === formData.name.trim().toLowerCase() &&
          !w.deleted &&
          w.id !== editingWorker?.id
      );
      if (duplicate) {
        errs.name = 'A worker with this name already exists';
      }
    }

    if (formData.phone && !/^[+\d\s()-]{6,15}$/.test(formData.phone.trim())) {
      errs.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (isEditing && editingWorker) {
      updateWorker(editingWorker.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        notes: formData.notes.trim(),
      });
    } else {
      addWorker({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        notes: formData.notes.trim(),
      });
    }
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
              {isEditing ? <Save size={16} className="text-white" /> : <HardHat size={16} className="text-white" />}
            </div>
            <h3 className="text-lg font-bold text-navy">{isEditing ? 'Edit Worker' : 'Add Worker'}</h3>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-navy">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">
              Worker Name <span className="text-danger">*</span>
            </label>
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
          <div>
            <label className="label-field">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`input-field ${errors.phone ? 'border-danger' : ''}`}
              placeholder="98765 43210"
            />
            {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
          </div>
          <div>
            <label className="label-field">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input-field"
              placeholder="Embroidery Machine Operator"
            />
          </div>
          <div>
            <label className="label-field">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[60px] resize-y"
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEditing ? 'Update Worker' : 'Save Worker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
