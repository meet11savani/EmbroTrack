/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Plus, RotateCcw, Save, X, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SearchableSelect } from '../../components/SearchableSelect';
import { validateRecord, type RecordFormData } from '@/utils/validation';
import { calculateAmount } from '@/utils/calculations';
import { generateChallanNumber } from '@/utils/challanNumber';
import { formatCurrency, todayISO } from '@/utils/formatters';
import type { EmbroideryRecord } from '@/types';
import { PartyQuickAdd } from '../parties/PartyQuickAdd';
import { QualityQuickAdd } from '../qualities/QualityQuickAdd';

interface RecordFormProps {
  editingRecord?: EmbroideryRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function RecordForm({ editingRecord, onClose, onSaved }: RecordFormProps) {
  const { addRecord, updateRecord, records, parties, qualities, settings, showToast } = useApp();
  const [showPartyQuickAdd, setShowPartyQuickAdd] = useState(false);
  const [showQualityQuickAdd, setShowQualityQuickAdd] = useState(false);

  const isEditing = !!editingRecord;

  const emptyForm: RecordFormData = {
    challanNumber: '',
    partyId: '',
    date: todayISO(),
    qualityId: '',
    designNumber: '',
    quantity: '',
    rate: '',
    creditDate: '',
    debitDate: '',
    notes: '',
  };

  const [formData, setFormData] = useState<RecordFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingRecord) {
      setFormData({
        challanNumber: editingRecord.challanNumber,
        partyId: editingRecord.partyId,
        date: editingRecord.date,
        qualityId: editingRecord.qualityId,
        designNumber: editingRecord.designNumber,
        quantity: String(editingRecord.quantity),
        rate: String(editingRecord.rate),
        creditDate: editingRecord.creditDate || '',
        debitDate: editingRecord.debitDate || '',
        notes: editingRecord.notes,
      });
    } else {
      setFormData({ ...emptyForm, challanNumber: generateChallanNumber(settings, records), date: todayISO() });
    }
    setErrors({});
  }, [editingRecord, settings, records]);

  const selectedQuality = qualities.find((q) => q.id === formData.qualityId && !q.deleted);

  const amount = useMemo(
    () => calculateAmount(parseFloat(formData.quantity) || 0, parseFloat(formData.rate) || 0),
    [formData.quantity, formData.rate]
  );

  const partyOptions = useMemo(
    () => parties.filter((p) => !p.deleted).map((p) => ({ value: p.id, label: p.name, sublabel: p.phone })),
    [parties]
  );

  const qualityOptions = useMemo(
    () =>
      qualities
        .filter((q) => !q.deleted)
        .map((q) => ({
          value: q.id,
          label: q.name,
          sublabel: q.designNumber ? `D.No: ${q.designNumber}` : undefined,
        })),
    [qualities]
  );

  const handleQualityChange = (qualityId: string) => {
    const q = qualities.find((x) => x.id === qualityId);
    setFormData((prev) => ({
      ...prev,
      qualityId,
      designNumber: q?.designNumber || prev.designNumber,
      rate: q?.defaultRate ? String(q.defaultRate) : prev.rate,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateRecord(formData, parties, qualities, records, editingRecord?.id);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    const recordData = {
      challanNumber: formData.challanNumber.trim(),
      partyId: formData.partyId,
      partyName: parties.find((p) => p.id === formData.partyId)?.name || '',
      date: formData.date,
      qualityId: formData.qualityId,
      qualityName: qualities.find((q) => q.id === formData.qualityId)?.name || '',
      designNumber: formData.designNumber.trim(),
      quantity: parseFloat(formData.quantity),
      rate: parseFloat(formData.rate),
      creditDate: formData.creditDate || null,
      debitDate: formData.debitDate || null,
      notes: formData.notes.trim(),
    };

    if (isEditing && editingRecord) {
      updateRecord(editingRecord.id, recordData);
      showToast('Record updated successfully', 'success');
      onSaved?.();
      onClose();
    } else {
      addRecord(recordData);
      showToast('Record added successfully', 'success');
      onSaved?.();
      onClose();
    }
  };

  const clearForm = () => {
    setFormData({ ...emptyForm, challanNumber: generateChallanNumber(settings, records), date: todayISO() });
    setErrors({});
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 no-print">
        <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
        <div className="animate-scale-in relative card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
                {isEditing ? <Save size={16} className="text-cream-100" /> : <FileText size={16} className="text-cream-100" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">{isEditing ? 'Edit Record' : 'Add Record'}</h3>
                <p className="text-xs text-navy-300">
                  {isEditing ? editingRecord?.challanNumber : 'Create a new embroidery challan'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-navy-300 hover:text-navy">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="challanNo">
                  Challan No. <span className="text-danger">*</span>
                </label>
                <input
                  id="challanNo"
                  type="text"
                  value={formData.challanNumber}
                  onChange={(e) => setFormData({ ...formData, challanNumber: e.target.value })}
                  className={`input-field ${errors.challanNumber ? 'border-danger' : ''}`}
                  placeholder="HE-0001"
                  autoFocus
                />
                {errors.challanNumber && <p className="mt-1 text-xs text-danger">{errors.challanNumber}</p>}
              </div>

              <div>
                <label className="label-field" htmlFor="date">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`input-field ${errors.date ? 'border-danger' : ''}`}
                />
                {errors.date && <p className="mt-1 text-xs text-danger">{errors.date}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="party">
                  Party <span className="text-danger">*</span>
                </label>
                <SearchableSelect
                  id="party"
                  options={partyOptions}
                  value={formData.partyId}
                  onChange={(v) => setFormData({ ...formData, partyId: v })}
                  placeholder="Search Party..."
                  searchPlaceholder="Search party..."
                  addNewLabel="+ Add New Party"
                  onAddNew={() => setShowPartyQuickAdd(true)}
                  error={errors.partyId}
                />
              </div>

              <div>
                <label className="label-field" htmlFor="quality">
                  Quality <span className="text-danger">*</span>
                </label>
                <SearchableSelect
                  id="quality"
                  options={qualityOptions}
                  value={formData.qualityId}
                  onChange={handleQualityChange}
                  placeholder="Search Quality..."
                  searchPlaceholder="Search quality..."
                  addNewLabel="+ Add New Quality"
                  onAddNew={() => setShowQualityQuickAdd(true)}
                  error={errors.qualityId}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label-field" htmlFor="dno">D.No</label>
                <input
                  id="dno"
                  type="text"
                  value={formData.designNumber}
                  onChange={(e) => setFormData({ ...formData, designNumber: e.target.value })}
                  className="input-field"
                  placeholder="D-101"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="quantity">
                  Quantity <span className="text-danger">*</span>
                </label>
                <input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={`input-field ${errors.quantity ? 'border-danger' : ''}`}
                  placeholder="500"
                />
                {errors.quantity && <p className="mt-1 text-xs text-danger">{errors.quantity}</p>}
              </div>
              <div>
                <label className="label-field" htmlFor="rate">
                  Rate <span className="text-danger">*</span>
                </label>
                <input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className={`input-field ${errors.rate ? 'border-danger' : ''}`}
                  placeholder="25"
                />
                {errors.rate && <p className="mt-1 text-xs text-danger">{errors.rate}</p>}
              </div>
              <div>
                <label className="label-field">Amount (Auto)</label>
                <div className="input-field bg-cream-100 font-bold text-navy flex items-center justify-between">
                  {formatCurrency(amount)}
                  <span className="text-xs text-navy-300 font-normal">auto</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field" htmlFor="creditDate">Credit Date</label>
                <input
                  id="creditDate"
                  type="date"
                  value={formData.creditDate}
                  onChange={(e) => setFormData({ ...formData, creditDate: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field" htmlFor="debitDate">Debit Date</label>
                <input
                  id="debitDate"
                  type="date"
                  value={formData.debitDate}
                  onChange={(e) => setFormData({ ...formData, debitDate: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label-field" htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field min-h-[60px] resize-y"
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            {selectedQuality && (
              <div className="text-xs text-navy-300">
                Quality: <span className="font-semibold text-navy">{selectedQuality.name}</span>
                {selectedQuality.designNumber && ` · D.No: ${selectedQuality.designNumber}`}
                {selectedQuality.unit && ` · Unit: ${selectedQuality.unit}`}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="button" onClick={clearForm} className="btn-secondary">
                <RotateCcw size={16} /> Clear
              </button>
              <button type="submit" className="btn-primary flex-1">
                {isEditing ? (
                  <>
                    <Save size={16} /> Update Record
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Save Record
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showPartyQuickAdd && (
        <PartyQuickAdd
          onClose={() => setShowPartyQuickAdd(false)}
          onCreated={(partyId) => setFormData((prev) => ({ ...prev, partyId }))}
        />
      )}
      {showQualityQuickAdd && (
        <QualityQuickAdd
          onClose={() => setShowQualityQuickAdd(false)}
          onCreated={(qualityId) => {
            handleQualityChange(qualityId);
          }}
        />
      )}
    </>
  );
}
