import { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PartyTable } from '@/components/PartyTable';
import { PartyForm } from '@/components/PartyForm';
import { PartyDetails } from '@/components/PartyDetails';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { generateRecordPDF, generateBulkPDF } from '@/services/pdfService';
import type { Party, EmbroideryRecord } from '@/types';

export function Parties() {
  const { parties, records, settings, deleteParty, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [viewingParty, setViewingParty] = useState<Party | null>(null);
  const [deletingParty, setDeletingParty] = useState<Party | null>(null);

  const activeParties = useMemo(() => parties.filter((p) => !p.deleted), [parties]);

  const handleDelete = () => {
    if (!deletingParty) return;
    deleteParty(deletingParty.id);
    showToast('Party deleted', 'success');
    setDeletingParty(null);
  };

  const handlePrintRecord = (record: EmbroideryRecord) => {
    generateRecordPDF(record, settings);
    showToast('PDF downloaded', 'success');
  };

  const handlePdfRecord = (record: EmbroideryRecord) => {
    generateRecordPDF(record, settings);
    showToast('PDF downloaded', 'success');
  };

  if (viewingParty) {
    return (
      <PartyDetails
        party={viewingParty}
        records={records}
        settings={settings}
        onClose={() => setViewingParty(null)}
        onPrintRecord={handlePrintRecord}
        onPdfRecord={handlePdfRecord}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy">Parties</h2>
            <p className="text-sm text-navy-300">Manage your business parties</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingParty(null); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={16} /> ADD PARTY
        </button>
      </div>

      {activeParties.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-navy-300" />
          </div>
          <h3 className="text-lg font-bold text-navy">No parties added yet</h3>
          <p className="mt-1 text-sm text-navy-300">Add a party to start tracking transactions.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-5">
            <Plus size={16} /> ADD PARTY
          </button>
        </div>
      ) : (
        <PartyTable
          parties={parties}
          records={records}
          onView={(p) => setViewingParty(p)}
          onEdit={(p) => { setEditingParty(p); setShowForm(true); }}
          onDelete={(p) => setDeletingParty(p)}
        />
      )}

      {showForm && (
        <PartyForm
          editingParty={editingParty}
          onClose={() => { setShowForm(false); setEditingParty(null); }}
          onSaved={() => showToast(editingParty ? 'Party updated' : 'Party added', 'success')}
        />
      )}

      <ConfirmDialog
        open={!!deletingParty}
        title="Delete this party?"
        message={`${deletingParty?.name} will be removed. This action cannot be undone.`}
        confirmLabel="Delete Party"
        onConfirm={handleDelete}
        onCancel={() => setDeletingParty(null)}
      />
    </div>
  );
}
