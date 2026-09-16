import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EmbroideryRecord, AppSettings, Party } from '@/types';
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters';

const NAVY: [number, number, number] = [23, 37, 54];
const TEAL: [number, number, number] = [47, 111, 107];
const GOLD: [number, number, number] = [196, 154, 85];
const LIGHT: [number, number, number] = [221, 216, 206];
const GRAY: [number, number, number] = [102, 112, 133];

export function generateRecordPDF(record: EmbroideryRecord, settings: AppSettings): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.businessName.toUpperCase(), margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(settings.businessSubtitle, margin, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('CHALLAN', pageWidth - margin, 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(record.challanNumber, pageWidth - margin, 22, { align: 'right' });

  // Gold separator
  doc.setFillColor(...GOLD);
  doc.rect(0, 32, pageWidth, 1.5, 'F');

  let y = 44;

  // Top info block
  const infoData: [string, string][] = [
    ['Challan No.', record.challanNumber],
    ['Date', formatDate(record.date)],
    ['Party', record.partyName],
  ];

  doc.setFontSize(10);
  for (const [label, value] of infoData) {
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, y);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 40, y);
    y += 7;
  }

  y += 4;
  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Details table
  autoTable(doc, {
    startY: y,
    head: [['Quality', 'D.No', 'Quantity', 'Rate', 'Amount']],
    body: [[
      record.qualityName,
      record.designNumber || '—',
      formatNumber(record.quantity),
      formatCurrency(record.rate),
      formatCurrency(record.amount),
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: NAVY,
    },
    alternateRowStyles: { fillColor: [245, 242, 236] },
    margin: { left: margin, right: margin },
  });

  // @ts-ignore — autoTable augments the doc instance
  y = (doc as any).lastAutoTable.finalY + 10;

  // Transaction info
  doc.setDrawColor(...LIGHT);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  const txData: [string, string][] = [
    ['Credit Date', formatDate(record.creditDate)],
    ['Debit Date', formatDate(record.debitDate)],
    ['Status', record.status],
  ];

  doc.setFontSize(10);
  for (const [label, value] of txData) {
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, y);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + 40, y);
    y += 7;
  }

  if (record.notes) {
    y += 4;
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Notes:', margin, y);
    y += 5;
    doc.setTextColor(...NAVY);
    const splitNotes = doc.splitTextToSize(record.notes, contentWidth);
    doc.text(splitNotes, margin, y);
    y += splitNotes.length * 5;
  }

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...NAVY);
  doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(settings.businessName, margin, pageHeight - 7);
  doc.text(`Generated ${formatDate(new Date().toISOString())}`, pageWidth - margin, pageHeight - 7, { align: 'right' });

  const filename = `EmbroTrack-Challan-${record.challanNumber}.pdf`;
  doc.save(filename);
}

export function generateBulkPDF(
  records: EmbroideryRecord[],
  settings: AppSettings,
  _parties: Party[]
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  records.forEach((record, index) => {
    if (index > 0) doc.addPage();

    // Header
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(settings.businessName.toUpperCase(), margin, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(settings.businessSubtitle, margin, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CHALLAN', pageWidth - margin, 15, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(record.challanNumber, pageWidth - margin, 22, { align: 'right' });

    doc.setFillColor(...GOLD);
    doc.rect(0, 32, pageWidth, 1.5, 'F');

    let y = 44;
    doc.setFontSize(10);
    const infoData: [string, string][] = [
      ['Challan No.', record.challanNumber],
      ['Date', formatDate(record.date)],
      ['Party', record.partyName],
    ];
    for (const [label, value] of infoData) {
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 40, y);
      y += 7;
    }

    y += 4;
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Quality', 'D.No', 'Quantity', 'Rate', 'Amount']],
      body: [[
        record.qualityName,
        record.designNumber || '—',
        formatNumber(record.quantity),
        formatCurrency(record.rate),
        formatCurrency(record.amount),
      ]],
      theme: 'striped',
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10, textColor: NAVY },
      alternateRowStyles: { fillColor: [245, 242, 236] },
      margin: { left: margin, right: margin },
    });

    // @ts-ignore
    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setDrawColor(...LIGHT);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    const txData: [string, string][] = [
      ['Credit Date', formatDate(record.creditDate)],
      ['Debit Date', formatDate(record.debitDate)],
      ['Status', record.status],
    ];
    doc.setFontSize(10);
    for (const [label, value] of txData) {
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.setTextColor(...NAVY);
      doc.setFont('helvetica', 'bold');
      doc.text(value, margin + 40, y);
      y += 7;
    }

    if (record.notes) {
      y += 4;
      doc.setTextColor(...GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Notes:', margin, y);
      y += 5;
      doc.setTextColor(...NAVY);
      const splitNotes = doc.splitTextToSize(record.notes, pageWidth - margin * 2);
      doc.text(splitNotes, margin, y);
    }

    // Footer
    doc.setFillColor(...NAVY);
    doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(settings.businessName, margin, pageHeight - 7);
    doc.text(`Generated ${formatDate(new Date().toISOString())}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  });

  const filename = `EmbroTrack-Challans-${records.length}-records.pdf`;
  doc.save(filename);
}
