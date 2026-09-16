import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, FileText, Printer, Download, Trash2, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RecordForm } from '@/features/records/RecordForm';
import { RecordTable } from '@/features/records/RecordTable';
import { RecordViewModal } from '@/features/records/RecordViewModal';
import { PrintChallan } from '@/features/records/PrintChallan';
import { SearchBar } from '@/components/SearchBar';
import { FilterBar } from '@/components/FilterBar';
import { Pagination } from '@/components/Pagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { generateRecordPDF, generateBulkPDF } from '@/services/pdfService';
import type { EmbroideryRecord, FilterState, SortState } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { calculateGrandTotal } from '@/utils/calculations';

export function Records() {
  const { records, parties, qualities, settings, deleteRecord, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    partyId: '', qualityId: '', dateFrom: '', dateTo: '', status: '',
  });
  const [sortState, setSortState] = useState<SortState>({ field: 'date', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editingRecord, setEditingRecord] = useState<EmbroideryRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<EmbroideryRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<EmbroideryRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<EmbroideryRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter, search, sort
  const filteredRecords = useMemo(() => {
    let result = records.filter((r) => !r.deleted);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.challanNumber.toLowerCase().includes(q) ||
          r.partyName.toLowerCase().includes(q) ||
          r.qualityName.toLowerCase().includes(q) ||
          r.designNumber.toLowerCase().includes(q)
      );
    }

    if (filters.partyId) result = result.filter((r) => r.partyId === filters.partyId);
    if (filters.qualityId) result = result.filter((r) => r.qualityId === filters.qualityId);
    if (filters.dateFrom) result = result.filter((r) => r.date >= filters.dateFrom);
    if (filters.dateTo) result = result.filter((r) => r.date <= filters.dateTo);
    if (filters.status) result = result.filter((r) => r.status === filters.status);

    const { field, direction } = sortState;
    result = [...result].sort((a, b) => {
      let aVal: string | number = (a as Record<string, unknown>)[field] as string | number;
      let bVal: string | number = (b as Record<string, unknown>)[field] as string | number;
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [records, search, filters, sortState]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const grandTotal = useMemo(() => calculateGrandTotal(filteredRecords), [filteredRecords]);

  const handleSort = useCallback((field: string) => {
    setSortState((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handlePrint = (record: EmbroideryRecord) => {
    setPrintRecord(record);
    setTimeout(() => {
      window.print();
      showToast('Print ready', 'success');
    }, 100);
  };

  const handlePdf = (record: EmbroideryRecord) => {
    generateRecordPDF(record, settings);
    showToast('PDF downloaded', 'success');
  };

  const handleDelete = () => {
    if (!deletingRecord) return;
    deleteRecord(deletingRecord.id);
    showToast('Record deleted', 'success');
    setDeletingRecord(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (paginatedRecords.every((r) => prev.has(r.id))) return new Set();
      return new Set(paginatedRecords.map((r) => r.id));
    });
  };

  const selectedRecords = useMemo(
    () => records.filter((r) => selectedIds.has(r.id) && !r.deleted),
    [records, selectedIds]
  );

  const handleBulkPrint = () => {
    setPrintRecord(null);
    setShowBulkActions(false);
    const printArea = document.querySelector('.print-area');
    if (printArea) printArea.innerHTML = '';
    selectedRecords.forEach((r) => {
      const div = document.createElement('div');
      div.className = 'print-page';
      div.innerHTML = renderPrintHTML(r, settings);
      printArea?.appendChild(div);
    });
    setTimeout(() => {
      window.print();
      showToast('Print ready', 'success');
    }, 200);
  };

  const handleBulkPdf = () => {
    generateBulkPDF(selectedRecords, settings, parties);
    showToast(`PDF downloaded for ${selectedRecords.length} records`, 'success');
    setShowBulkActions(false);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Record Form */}
      <RecordForm
        editingRecord={editingRecord}
        onUpdateComplete={() => setEditingRecord(null)}
      />

      {/* Records section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cream-200 flex items-center justify-center">
              <FileText size={18} className="text-navy" />
            </div>
            <h2 className="text-xl font-bold text-navy">Records</h2>
            <span className="badge bg-cream-200 text-navy-300">{filteredRecords.length}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <SearchBar ref={searchRef} value={search} onChange={(v) => { setSearch(v); setCurrentPage(1); }} placeholder="Search challan, party, quality..." id="global-search" />
            <FilterBar filters={filters} onApply={(f) => { setFilters(f); setCurrentPage(1); }} parties={parties} qualities={qualities} />
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="animate-fade-in flex items-center gap-3 card p-3 px-4 bg-teal/5 border-teal/30">
            <span className="text-sm font-semibold text-teal">{selectedIds.size} selected</span>
            <div className="flex-1" />
            <button onClick={handleBulkPrint} className="btn-secondary text-xs py-2">
              <Printer size={14} /> Print Selected
            </button>
            <button onClick={handleBulkPdf} className="btn-secondary text-xs py-2">
              <Download size={14} /> Download Selected PDF
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="btn-ghost text-xs">
              <X size={14} /> Clear
            </button>
          </div>
        )}

        {/* Summary bar */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center gap-6 text-sm">
            <span className="text-navy-300">
              Total Amount: <span className="font-bold text-navy">{formatCurrency(grandTotal.totalAmount)}</span>
            </span>
            <span className="text-navy-300">
              Total Quantity: <span className="font-bold text-navy">{formatNumber(grandTotal.totalQuantity)}</span>
            </span>
          </div>
        )}

        {/* Table or empty state */}
        {filteredRecords.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-navy-300" />
            </div>
            <h3 className="text-lg font-bold text-navy">No records yet</h3>
            <p className="mt-1 text-sm text-navy-300">Create your first embroidery record to get started.</p>
            <button onClick={() => document.getElementById('challanNo')?.focus()} className="btn-primary mt-5">
              <Plus size={16} /> ADD RECORD
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            <RecordTable
              records={paginatedRecords}
              sortState={sortState}
              onSort={handleSort}
              onView={(r) => setViewingRecord(r)}
              onEdit={(r) => { setEditingRecord(r); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onPdf={handlePdf}
              onDelete={(r) => setDeletingRecord(r)}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
            />
            <div className="card mt-0 rounded-t-none">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={filteredRecords.length}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RecordViewModal
        record={viewingRecord}
        settings={settings}
        onClose={() => setViewingRecord(null)}
        onPrint={() => { if (viewingRecord) handlePrint(viewingRecord); }}
        onPdf={() => { if (viewingRecord) handlePdf(viewingRecord); }}
        onEdit={() => { if (viewingRecord) { setEditingRecord(viewingRecord); setViewingRecord(null); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
      />

      <ConfirmDialog
        open={!!deletingRecord}
        title="Delete this record?"
        message={`Challan ${deletingRecord?.challanNumber} for ${deletingRecord?.partyName}. This action cannot be undone.`}
        confirmLabel="Delete Record"
        onConfirm={handleDelete}
        onCancel={() => setDeletingRecord(null)}
      />

      {printRecord && <PrintChallan record={printRecord} settings={settings} />}
    </div>
  );
}

function renderPrintHTML(record: EmbroideryRecord, settings: { businessName: string; businessSubtitle: string }): string {
  return `
    <div style="padding:40px;font-family:Inter,Arial,sans-serif;color:#172536;">
      <div style="display:flex;justify-content:space-between;border-bottom:3px solid #C49A55;padding-bottom:16px;margin-bottom:32px;">
        <div><h1 style="font-size:28px;font-weight:800;margin:0;">${settings.businessName.toUpperCase()}</h1>
        <p style="font-size:13px;color:#667085;margin:4px 0 0 0;">${settings.businessSubtitle}</p></div>
        <div style="text-align:right;"><p style="font-size:18px;font-weight:700;margin:0;">CHALLAN</p>
        <p style="font-size:16px;font-weight:600;color:#2F6F6B;margin:4px 0 0 0;">${record.challanNumber}</p></div>
      </div>
      <p style="font-size:14px;"><strong>Party:</strong> ${record.partyName} | <strong>Date:</strong> ${record.date} | <strong>Quality:</strong> ${record.qualityName}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead><tr style="background:#172536;color:#fff;">
          <th style="padding:10px;text-align:left;">Quality</th>
          <th style="padding:10px;text-align:left;">D.No</th>
          <th style="padding:10px;text-align:right;">Quantity</th>
          <th style="padding:10px;text-align:right;">Rate</th>
          <th style="padding:10px;text-align:right;">Amount</th>
        </tr></thead>
        <tbody><tr style="background:#F5F2EC;">
          <td style="padding:12px;">${record.qualityName}</td>
          <td style="padding:12px;">${record.designNumber || '—'}</td>
          <td style="padding:12px;text-align:right;">${record.quantity}</td>
          <td style="padding:12px;text-align:right;">₹${record.rate}</td>
          <td style="padding:12px;text-align:right;font-weight:700;">₹${record.amount}</td>
        </tr></tbody>
      </table>
      <p style="margin-top:24px;"><strong>Status:</strong> ${record.status}</p>
      <div style="margin-top:48px;border-top:2px solid #172536;padding-top:16px;">
        <p style="font-size:12px;font-weight:600;">${settings.businessName}</p>
      </div>
    </div>
  `;
}
