import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Challan } from '../types';

export const generateChallanPDF = (challan: Challan) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor = [92, 58, 33]; // ChocoDist Brown (#5c3a21)
  const secondaryColor = [100, 116, 139]; // Slate Gray

  // --- HEADER ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ChocoDist', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Chocolate Wholesale & Distribution Operations Portal', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SALES CHALLAN', 196, 17, { align: 'right' });

  // --- CHALLAN & CUSTOMER INFO METADATA ---
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER DETAILS:', 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Business Name: ${challan.customer?.businessName || 'N/A'}`, 14, 44);
  doc.text(`Contact Person: ${challan.customer?.name || 'N/A'}`, 14, 49);
  doc.text(`Mobile: ${challan.customer?.mobile || 'N/A'}`, 14, 54);
  if (challan.customer?.gstNumber) {
    doc.text(`GSTIN: ${challan.customer.gstNumber}`, 14, 59);
  }

  // Right Side Info Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CHALLAN METADATA:', 130, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Challan No: ${challan.challanNumber}`, 130, 44);
  doc.text(
    `Date: ${new Date(challan.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    130,
    49
  );
  doc.text(`Status: ${challan.status}`, 130, 54);
  doc.text(`Prepared By: ${challan.createdBy?.name || 'System'}`, 130, 59);

  // Address
  if (challan.customer?.address) {
    doc.setFont('helvetica', 'italic');
    doc.text(`Delivery Address: ${challan.customer.address}`, 14, 66);
  }

  // --- LINE ITEMS TABLE ---
  const tableData = challan.items.map((item, index) => [
    index + 1,
    item.sku,
    item.productName,
    `₹${item.unitPrice.toLocaleString('en-IN')}`,
    `${item.quantity} units`,
    `₹${item.totalPrice.toLocaleString('en-IN')}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'SKU', 'Product Description', 'Unit Price', 'Quantity', 'Total Amount']],
    body: tableData,
    headStyles: {
      fillColor: [92, 58, 33],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 30 },
      2: { cellWidth: 70 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' },
    },
  });

  // --- TOTALS FOOTER ---
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(247, 243, 240);
  doc.roundedRect(120, finalY, 76, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Quantity: ${challan.totalQuantity} units`, 125, finalY + 8);

  doc.setFontSize(12);
  doc.setTextColor(92, 58, 33);
  doc.text(`Grand Total: ₹${challan.totalAmount.toLocaleString('en-IN')}`, 125, finalY + 18);

  // --- AUTHORIZED SIGNATURE & FOOTER NOTICE ---
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a computer-generated B2B Sales Challan invoice for ChocoDist.', 14, finalY + 30);
  doc.text('Authorized Signature: _______________________', 130, finalY + 30);

  // Trigger Save PDF File
  doc.save(`ChocoDist_Challan_${challan.challanNumber}.pdf`);
};
