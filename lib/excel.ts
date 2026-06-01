import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './utils';

export function downloadPaymentExcel(transactions: any[], fileName: string = 'Payments_Report.xlsx') {
  // Format data for Excel
  const data = transactions.map(txn => ({
    'Date': new Date(txn.created_at).toLocaleDateString(),
    'Time': new Date(txn.created_at).toLocaleTimeString(),
    'TXN Number': txn.transaction_number,
    'Order Number': txn.order_number || '',
    'Customer Name': txn.customer_name || '',
    'Phone': txn.customer_phone || '',
    'Type': txn.type.replace(/_/g, ' ').toUpperCase(),
    'Status': txn.status.toUpperCase(),
    'Payment Method': txn.payment_method || 'COD',
    'Subtotal': txn.subtotal || 0,
    'Discount': txn.discount_amount || 0,
    'Shipping': txn.shipping_amount || 0,
    'Amount': txn.amount,
    'Collected By': txn.collected_by || '',
    'Notes': txn.notes || ''
  }));

  // Create a new workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns (rough estimate)
  const colWidths = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, 
    { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 }
  ];
  ws['!cols'] = colWidths;

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Trigger download
  XLSX.writeFile(wb, fileName);
}

export function downloadInventoryExcel(products: any[], fileName: string = 'Inventory_Report.xlsx') {
  const data = products.map(p => ({
    'Product ID': p.id,
    'Product Name': p.name,
    'Category': p.category_name || 'Uncategorized',
    'Price': p.price,
    'Stock Quantity': p.stock_quantity,
    'Total Value': (p.price || 0) * (p.stock_quantity || 0),
    'Status': p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= 10 ? 'Low Stock' : 'In Stock'
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 36 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, fileName);
}
