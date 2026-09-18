import { useState, useMemo } from 'react';
import { Plus, HardHat } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WorkerTable } from '@/pages/workers/WorkerTable';
import { WorkerForm } from '@/pages/workers/WorkerForm';
import { WorkerViewModal } from '@/pages/workers/WorkerViewModal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Worker } from '@/types';

export function Workers() {
  const { workers, workerTransactions, deleteWorker, deleteWorkerTransaction, addWorkerTransaction, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [viewingWorker, setViewingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);

  const activeWorkers = useMemo(() => workers.filter((w) => !w.deleted), [workers]);

  const handleDelete = () => {
    if (!deletingWorker) return;
    deleteWorker(deletingWorker.id);
    showToast('Worker deleted', 'success');
    setDeletingWorker(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
            <HardHat size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy">Workers</h2>
            <p className="text-sm text-navy-300">Manage worker salary, withdrawal & credit</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingWorker(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> ADD WORKER
        </button>
      </div>

      {activeWorkers.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
            <HardHat size={28} className="text-navy-300" />
          </div>
          <h3 className="text-lg font-bold text-navy">No workers added yet</h3>
          <p className="mt-1 text-sm text-navy-300">Add a worker to start tracking salary and transactions.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5">
            <Plus size={16} /> ADD WORKER
          </button>
        </div>
      ) : (
        <WorkerTable
          workers={workers}
          transactions={workerTransactions}
          onView={(w) => setViewingWorker(w)}
          onEdit={(w) => { setEditingWorker(w); setShowForm(true); }}
          onDelete={(w) => setDeletingWorker(w)}
        />
      )}

      {showForm && (
        <WorkerForm
          editingWorker={editingWorker}
          onClose={() => { setShowForm(false); setEditingWorker(null); }}
          onSaved={() => showToast(editingWorker ? 'Worker updated' : 'Worker added', 'success')}
        />
      )}

      <WorkerViewModal
        worker={viewingWorker}
        transactions={workerTransactions}
        onClose={() => setViewingWorker(null)}
        onEdit={() => { setEditingWorker(viewingWorker); setViewingWorker(null); setShowForm(true); }}
        onDelete={() => { setDeletingWorker(viewingWorker); setViewingWorker(null); }}
        onAddTransaction={addWorkerTransaction}
        onDeleteTransaction={deleteWorkerTransaction}
        showToast={showToast}
      />

      <ConfirmDialog
        open={!!deletingWorker}
        title="Delete this worker?"
        message={`${deletingWorker?.name} will be removed. This action cannot be undone.`}
        confirmLabel="Delete Worker"
        onConfirm={handleDelete}
        onCancel={() => setDeletingWorker(null)}
      />
    </div>
  );
}
