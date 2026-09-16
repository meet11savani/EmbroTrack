import { useState, useMemo } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { QualityTable } from '@/features/qualities/QualityTable';
import { QualityForm } from '@/features/qualities/QualityForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Quality } from '@/types';

export function Qualities() {
  const { qualities, records, deleteQuality, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingQuality, setEditingQuality] = useState<Quality | null>(null);
  const [deletingQuality, setDeletingQuality] = useState<Quality | null>(null);

  const activeQualities = useMemo(() => qualities.filter((q) => !q.deleted), [qualities]);

  const handleDelete = () => {
    if (!deletingQuality) return;
    deleteQuality(deletingQuality.id);
    showToast('Quality deleted', 'success');
    setDeletingQuality(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy">Qualities</h2>
            <p className="text-sm text-navy-300">Manage embroidery qualities</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingQuality(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> ADD QUALITY
        </button>
      </div>

      {activeQualities.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-navy-300" />
          </div>
          <h3 className="text-lg font-bold text-navy">No qualities added yet</h3>
          <p className="mt-1 text-sm text-navy-300">Add a quality to use in your records.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5">
            <Plus size={16} /> ADD QUALITY
          </button>
        </div>
      ) : (
        <QualityTable
          qualities={qualities}
          records={records}
          onEdit={(q) => { setEditingQuality(q); setShowForm(true); }}
          onDelete={(q) => setDeletingQuality(q)}
        />
      )}

      {showForm && (
        <QualityForm
          editingQuality={editingQuality}
          onClose={() => { setShowForm(false); setEditingQuality(null); }}
          onSaved={() => showToast(editingQuality ? 'Quality updated' : 'Quality added', 'success')}
        />
      )}

      <ConfirmDialog
        open={!!deletingQuality}
        title="Delete this quality?"
        message={`${deletingQuality?.name} will be removed. This action cannot be undone.`}
        confirmLabel="Delete Quality"
        onConfirm={handleDelete}
        onCancel={() => setDeletingQuality(null)}
      />
    </div>
  );
}
