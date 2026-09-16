import type { EmbroideryRecord, AppSettings } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

interface PrintChallanProps {
  record: EmbroideryRecord;
  settings: AppSettings;
}

export function PrintChallan({ record, settings }: PrintChallanProps) {
  return (
    <div className="print-area hidden">
      <div style={{ padding: '40px', fontFamily: 'Inter, Arial, sans-serif', color: '#172536' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #C49A55', paddingBottom: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#172536', margin: 0 }}>{settings.businessName.toUpperCase()}</h1>
            <p style={{ fontSize: '13px', color: '#667085', margin: '4px 0 0 0' }}>{settings.businessSubtitle}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#172536', margin: 0 }}>CHALLAN</p>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#2F6F6B', margin: '4px 0 0 0' }}>{record.challanNumber}</p>
          </div>
        </div>

        {/* Top info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Challan No.</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{record.challanNumber}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Date</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{formatDate(record.date)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Party</p>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{record.partyName}</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #DDD8CE', margin: '24px 0' }} />

        {/* Details table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ backgroundColor: '#172536', color: '#fff' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Quality</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>D.No</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Quantity</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Rate</th>
              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#F5F2EC' }}>
              <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 600 }}>{record.qualityName}</td>
              <td style={{ padding: '12px 14px', fontSize: '14px' }}>{record.designNumber || '—'}</td>
              <td style={{ padding: '12px 14px', fontSize: '14px', textAlign: 'right' }}>{formatNumber(record.quantity)}</td>
              <td style={{ padding: '12px 14px', fontSize: '14px', textAlign: 'right' }}>{formatCurrency(record.rate)}</td>
              <td style={{ padding: '12px 14px', fontSize: '14px', fontWeight: 700, textAlign: 'right' }}>{formatCurrency(record.amount)}</td>
            </tr>
          </tbody>
        </table>

        <hr style={{ border: 'none', borderTop: '1px solid #DDD8CE', margin: '24px 0' }} />

        {/* Transaction info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Credit Date</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{formatDate(record.creditDate)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Debit Date</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{formatDate(record.debitDate)}</p>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: 0 }}>Status</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#172536', margin: '4px 0 0 0' }}>{record.status}</p>
          </div>
        </div>

        {record.notes && (
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Notes</p>
            <p style={{ fontSize: '14px', color: '#172536', margin: 0 }}>{record.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '2px solid #172536', display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#172536', margin: 0 }}>{settings.businessName}</p>
          <p style={{ fontSize: '11px', color: '#667085', margin: 0 }}>Generated {formatDate(new Date().toISOString())}</p>
        </div>
      </div>
    </div>
  );
}
