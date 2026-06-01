'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';

Font.register({
  family: 'Helvetica',
  fonts: [{ src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFqL_OWxw.ttf' }]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  companyName: { fontSize: 24, fontWeight: 'bold', color: '#2b3a2f' },
  docTitle: { fontSize: 18, color: '#4a6750', textAlign: 'right' },
  
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  infoBlock: { width: '45%' },
  infoTitle: { fontSize: 9, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginBottom: 5 },
  infoText: { fontSize: 10, color: '#333', marginBottom: 3 },
  
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#ccc', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { borderStyle: 'solid', borderWidth: 1, borderColor: '#ccc', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f4f1', padding: 6 },
  tableCol: { borderStyle: 'solid', borderWidth: 1, borderColor: '#ccc', borderLeftWidth: 0, borderTopWidth: 0, padding: 6 },
  tableCellHeader: { margin: 2, fontSize: 9, fontWeight: 'bold', color: '#2b3a2f' },
  tableCell: { margin: 2, fontSize: 9 },
  
  totalsSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', width: '40%', justifyContent: 'space-between', marginBottom: 5 },
  totalLabel: { fontSize: 10, fontWeight: 'bold', color: '#666' },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#2b3a2f' },
  
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#ccc', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#999', textAlign: 'center' }
});

export function PurchaseOrderPDF({ po }: { po: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>LavishOrganic</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 5 }}>Surat, Gujarat, India</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>PURCHASE ORDER</Text>
            <Text style={{ fontSize: 10, color: '#333', marginTop: 5, textAlign: 'right' }}>{po.po_number}</Text>
            <Text style={{ fontSize: 9, color: '#666', marginTop: 3, textAlign: 'right' }}>Date: {formatDate(po.created_at)}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Vendor / Supplier</Text>
            <Text style={styles.infoText}>{po.supplier_name}</Text>
            {po.supplier_email && <Text style={styles.infoText}>{po.supplier_email}</Text>}
            {po.supplier_phone && <Text style={styles.infoText}>{po.supplier_phone}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Ship To</Text>
            <Text style={styles.infoText}>LavishOrganic Warehouse</Text>
            <Text style={styles.infoText}>Surat, Gujarat, India</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '50%' }]}><Text style={styles.tableCellHeader}>Description</Text></View>
            <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'center'}]}>Qty</Text></View>
            <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Unit Price</Text></View>
            <View style={[styles.tableColHeader, { width: '20%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Amount</Text></View>
          </View>
          
          {po.items?.map((item: any) => (
            <View style={styles.tableRow} key={item.id}>
              <View style={[styles.tableCol, { width: '50%' }]}><Text style={styles.tableCell}>{item.product_name}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={[styles.tableCell, {textAlign: 'center'}]}>{item.quantity_ordered}</Text></View>
              <View style={[styles.tableCol, { width: '15%' }]}><Text style={[styles.tableCell, {textAlign: 'right'}]}>{formatCurrency(item.cost_per_unit)}</Text></View>
              <View style={[styles.tableCol, { width: '20%' }]}><Text style={[styles.tableCell, {textAlign: 'right'}]}>{formatCurrency(item.quantity_ordered * item.cost_per_unit)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Items:</Text>
            <Text style={styles.totalValue}>{po.total_quantity}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={[styles.totalValue, { color: '#4a6750', fontSize: 14 }]}>{formatCurrency(po.total_cost)}</Text>
          </View>
        </View>

        {po.notes && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.infoTitle}>Notes / Instructions</Text>
            <Text style={{ fontSize: 9, color: '#333', lineHeight: 1.5 }}>{po.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Authorized Signature ______________________</Text>
        </View>
      </Page>
    </Document>
  );
}
