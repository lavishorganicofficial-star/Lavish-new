'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';

Font.register({
  family: 'Helvetica',
  fonts: [{ src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFqL_OWxw.ttf' }]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2b3a2f' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 5 },
  section: { marginBottom: 20 },
  
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f9faf9', padding: 5 },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 2, fontSize: 9, fontWeight: 'bold', color: '#666' },
  tableCell: { margin: 2, fontSize: 8 },
  tableCellRight: { margin: 2, fontSize: 8, textAlign: 'right' },
  
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  summaryBox: { padding: 15, backgroundColor: '#f0f4f1', borderRadius: 4, width: '23%' },
  summaryBoxTitle: { fontSize: 9, color: '#666', textTransform: 'uppercase', marginBottom: 5 },
  summaryBoxValue: { fontSize: 16, fontWeight: 'bold', color: '#2b3a2f' },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#999', fontSize: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

export function StockReportPDF({ products, summary }: { products: any[], summary: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>LavishOrganic</Text>
            <Text style={styles.subtitle}>Inventory Valuation & Stock Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subtitle}>Generated: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Total Value</Text>
            <Text style={styles.summaryBoxValue}>{formatCurrency(summary?.totalValue || 0)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Total Products</Text>
            <Text style={styles.summaryBoxValue}>{summary?.totalProducts || 0}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Low Stock</Text>
            <Text style={[styles.summaryBoxValue, { color: 'orange' }]}>{summary?.lowStockCount || 0}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Out of Stock</Text>
            <Text style={[styles.summaryBoxValue, { color: 'red' }]}>{summary?.outOfStockCount || 0}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableColHeader, { width: '40%' }]}><Text style={styles.tableCellHeader}>Product Name</Text></View>
              <View style={[styles.tableColHeader, { width: '20%' }]}><Text style={styles.tableCellHeader}>Category</Text></View>
              <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Price</Text></View>
              <View style={[styles.tableColHeader, { width: '10%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Qty</Text></View>
              <View style={[styles.tableColHeader, { width: '15%' }]}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Value</Text></View>
            </View>
            
            {products.map((p, i) => (
              <View style={styles.tableRow} key={p.id || i}>
                <View style={[styles.tableCol, { width: '40%' }]}><Text style={styles.tableCell}>{p.name}</Text></View>
                <View style={[styles.tableCol, { width: '20%' }]}><Text style={styles.tableCell}>{p.category_name}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCellRight}>{formatCurrency(p.price)}</Text></View>
                <View style={[styles.tableCol, { width: '10%' }]}><Text style={[styles.tableCellRight, { color: p.stock_quantity <= 10 ? 'red' : 'black' }]}>{p.stock_quantity}</Text></View>
                <View style={[styles.tableCol, { width: '15%' }]}><Text style={styles.tableCellRight}>{formatCurrency((p.price || 0) * (p.stock_quantity || 0))}</Text></View>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          This is an automatically generated report. For internal use only by LavishOrganic Admin.
        </Text>
      </Page>
    </Document>
  );
}
