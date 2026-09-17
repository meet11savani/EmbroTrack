import { useState, type FormEvent } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { validateQuality, type QualityFormData } from '@/utils/validation';

interface QualityQuickAddProps {
  onClose: () => void;
  onCreated: (qualityId: string) => void;
}

export function QualityQuickAdd({ onClose, onCreated }: QualityQuickAddProps) {
  const { addQuality, qualities } = useApp();
  const [formData, setFormData] = useState<QualityFormData>({
    name: '',
    designNumber: '',
    defaultRate: '',
    unit: 'Piece',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateQuality(formData, qualities);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    const quality = addQuality({
      name: formData.name.trim(),
      designNumber: formData.designNumber.trim(),
      defaultRate: formData.defaultRate ? parseFloat(formData.defaultRate) : 0,
      unit: formData.unit.trim() || 'Piece',
      notes: formData.notes.trim(),
    });
    onCreated(quality.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-scale-in relative card p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-navy">Add New Quality</h3>
          </div>
          <button onClick={onClose} className="text-navy-300 hover:text-navy">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">
              Quality Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-danger' : ''}`}
              placeholder="Premium Embroidery"
              autoFocus
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">D.No</label>
              <input
                type="text"
                value={formData.designNumber}
                onChange={(e) => setFormData({ ...formData, designNumber: e.target.value })}
                className="input-field"
                placeholder="D-101"
              />
            </div>
            <div>
              <label className="label-field">Default Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultRate}
                onChange={(e) => setFormData({ ...formData, defaultRate: e.target.value })}
                className={`input-field ${errors.defaultRate ? 'border-danger' : ''}`}
                placeholder="25"
              />
              {errors.defaultRate && <p className="mt-1 text-xs text-danger">{errors.defaultRate}</p>}
            </div>
          </div>
          <div>
            <label className="label-field">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input-field"
              placeholder="Piece"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save Quality
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
