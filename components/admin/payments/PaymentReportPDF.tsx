'use client';

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/lib/utils';

// Using standard fonts for react-pdf
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyCg4TYFqL_OWxw.ttf' } // Fallback, using standard fonts natively is better though
  ]
});

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2b3a2f' }, // charcoal-like
  subtitle: { fontSize: 10, color: '#666', marginTop: 5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#4a6750' }, // sage-dark-like
  
  // Table styles
  table: { width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '16.6%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f9faf9', padding: 5 },
  tableCol: { width: '16.6%', borderStyle: 'solid', borderWidth: 1, borderColor: '#eee', borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableCellHeader: { margin: 2, fontSize: 9, fontWeight: 'bold', color: '#666' },
  tableCell: { margin: 2, fontSize: 8 },
  tableCellRight: { margin: 2, fontSize: 8, textAlign: 'right' },
  
  // Summary boxes
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  summaryBox: { padding: 15, backgroundColor: '#f0f4f1', borderRadius: 4, width: '30%' },
  summaryBoxTitle: { fontSize: 9, color: '#666', textTransform: 'uppercase', marginBottom: 5 },
  summaryBoxValue: { fontSize: 16, fontWeight: 'bold', color: '#2b3a2f' },
  
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#999', fontSize: 8, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

interface PaymentReportProps {
  transactions: any[];
  summary: any;
  dateRange: string;
}

export function PaymentReportPDF({ transactions, summary, dateRange }: PaymentReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>LavishOrganic</Text>
            <Text style={styles.subtitle}>Payment & Transaction Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subtitle}>Date Range: {dateRange}</Text>
            <Text style={styles.subtitle}>Generated: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Total Revenue</Text>
            <Text style={styles.summaryBoxValue}>{formatCurrency(summary?.totalRevenue || 0)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>COD Collected</Text>
            <Text style={styles.summaryBoxValue}>{formatCurrency(summary?.collected?.amount || 0)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxTitle}>Refunds Issued</Text>
            <Text style={styles.summaryBoxValue}>{formatCurrency(summary?.refundsIssued?.amount || 0)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Log ({transactions.length})</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Date</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>TXN #</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Order #</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Customer</Text></View>
              <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Type</Text></View>
              <View style={styles.tableColHeader}><Text style={[styles.tableCellHeader, {textAlign: 'right'}]}>Amount</Text></View>
            </View>
            
            {/* Table Body */}
            {transactions.map((txn, i) => (
              <View style={styles.tableRow} key={txn.id || i}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{formatDate(txn.created_at)}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{txn.transaction_number}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{txn.order_number}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{txn.customer_name || '—'}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{txn.type.replace(/_/g, ' ')}</Text></View>
                <View style={styles.tableCol}>
                  <Text style={[styles.tableCellRight, { color: txn.amount < 0 ? 'red' : 'black' }]}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                  </Text>
                </View>
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
