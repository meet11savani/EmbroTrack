import { useState, useMemo, useRef } from 'react';
import { Plus, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PartyTable } from '@/pages/parties/PartyTable';
import { PartyForm } from '@/pages/parties/PartyForm';
import { PartyViewModal } from '@/pages/parties/PartyViewModal';
import { SearchBar } from '@/components/SearchBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { generateRecordPDF } from '@/services/pdfService';
import type { Party, EmbroideryRecord } from '@/types';

export function Parties() {
  const { parties, records, settings, deleteParty, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [viewingParty, setViewingParty] = useState<Party | null>(null);
  const [deletingParty, setDeletingParty] = useState<Party | null>(null);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const activeParties = useMemo(() => {
    let result = parties.filter((p) => !p.deleted);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q)
      );
    }
    return result;
  }, [parties, search]);

  const handleDelete = () => {
    if (!deletingParty) return;
    deleteParty(deletingParty.id);
    showToast('Party deleted', 'success');
    setDeletingParty(null);
  };

  const handlePdfRecord = (record: EmbroideryRecord) => {
    generateRecordPDF(record, settings);
    showToast('PDF downloaded', 'success');
  };

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
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar ref={searchRef} value={search} onChange={setSearch} placeholder="Search name, phone, address..." id="party-search" />
          <button
            onClick={() => { setEditingParty(null); setShowForm(true); }}
            className="btn-primary"
          >
            <Plus size={16} /> ADD PARTY
          </button>
        </div>
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
          parties={activeParties}
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

      <PartyViewModal
        party={viewingParty}
        records={records}
        settings={settings}
        onClose={() => setViewingParty(null)}
        onEdit={() => { setEditingParty(viewingParty); setViewingParty(null); setShowForm(true); }}
        onDelete={() => { setDeletingParty(viewingParty); setViewingParty(null); }}
        onViewRecord={handlePdfRecord}
      />

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
