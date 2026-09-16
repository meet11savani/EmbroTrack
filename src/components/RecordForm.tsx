import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Plus, RotateCcw, Save } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SearchableSelect } from './SearchableSelect';
import { validateRecord, type RecordFormData } from '@/utils/validation';
import { calculateAmount } from '@/utils/calculations';
import { generateChallanNumber } from '@/utils/challanNumber';
import { formatCurrency, todayISO } from '@/utils/formatters';
import type { EmbroideryRecord } from '@/types';
import { PartyQuickAdd } from './PartyQuickAdd';
import { QualityQuickAdd } from './QualityQuickAdd';

interface RecordFormProps {
  editingRecord?: EmbroideryRecord | null;
  onUpdateComplete?: () => void;
}

export function RecordForm({ editingRecord, onUpdateComplete }: RecordFormProps) {
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
      onUpdateComplete?.();
    } else {
      addRecord(recordData);
      showToast('Record added successfully', 'success');
      setFormData({ ...emptyForm, challanNumber: generateChallanNumber(settings, records), date: todayISO() });
      setErrors({});
    }
  };

  const clearForm = () => {
    setFormData({ ...emptyForm, challanNumber: generateChallanNumber(settings, records), date: todayISO() });
    setErrors({});
  };

  return (
    <>
      <div className="card p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              {isEditing ? <Save size={18} className="text-cream-100" /> : <Plus size={18} className="text-cream-100" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">{isEditing ? 'EDIT RECORD' : 'ADD RECORD'}</h2>
              <p className="text-xs text-navy-300">
                {isEditing ? editingRecord?.challanNumber : 'Create a new embroidery challan'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              />
              {errors.challanNumber && <p className="mt-1 text-xs text-danger">{errors.challanNumber}</p>}
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label-field" htmlFor="dno">
                D.No
              </label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label-field" htmlFor="creditDate">
                Credit Date
              </label>
              <input
                id="creditDate"
                type="date"
                value={formData.creditDate}
                onChange={(e) => setFormData({ ...formData, creditDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="debitDate">
                Debit Date
              </label>
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
            <label className="label-field" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field min-h-[72px] resize-y"
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" className="btn-primary">
              {isEditing ? (
                <>
                  <Save size={16} /> UPDATE RECORD
                </>
              ) : (
                <>
                  <Plus size={16} /> ADD RECORD
                </>
              )}
            </button>
            <button type="button" onClick={clearForm} className="btn-secondary">
              <RotateCcw size={16} /> Clear
            </button>
            {selectedQuality && (
              <div className="ml-auto text-xs text-navy-300">
                Quality: <span className="font-semibold text-navy">{selectedQuality.name}</span>
                {selectedQuality.designNumber && ` · D.No: ${selectedQuality.designNumber}`}
                {selectedQuality.unit && ` · Unit: ${selectedQuality.unit}`}
              </div>
            )}
          </div>
        </form>
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
