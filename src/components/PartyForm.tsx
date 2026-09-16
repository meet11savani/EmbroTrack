import { useState, useEffect, type FormEvent } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { validateParty, type PartyFormData } from '@/utils/validation';
import type { Party } from '@/types';

interface PartyFormProps {
  editingParty?: Party | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function PartyForm({ editingParty, onClose, onSaved }: PartyFormProps) {
  const { addParty, updateParty, parties } = useApp();
  const isEditing = !!editingParty;
  const [formData, setFormData] = useState<PartyFormData>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingParty) {
      setFormData({
        name: editingParty.name,
        phone: editingParty.phone,
        address: editingParty.address,
        notes: editingParty.notes,
      });
    }
  }, [editingParty]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateParty(formData, parties, editingParty?.id);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    if (isEditing && editingParty) {
      updateParty(editingParty.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
      });
    } else {
      addParty({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
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
              {isEditing ? <Save size={16} className="text-white" /> : <UserPlus size={16} className="text-white" />}
            </div>
            <h3 className="text-lg font-bold text-navy">{isEditing ? 'Edit Party' : 'Add Party'}</h3>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-navy">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">
              Party Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-danger' : ''}`}
              placeholder="ABC Textiles"
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
            <label className="label-field">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input-field"
              placeholder="Plot 123, Industrial Area"
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
              {isEditing ? 'Update Party' : 'Save Party'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
