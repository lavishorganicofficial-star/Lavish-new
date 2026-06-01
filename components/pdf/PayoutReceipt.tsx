import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 12, color: '#333' },
  header: { borderBottom: '1px solid #eee', paddingBottom: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4A6741', marginBottom: 5 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#666', width: 150 },
  value: { fontWeight: 'bold' },
  divider: { borderBottom: '1px solid #eee', marginVertical: 15 },
  table: { marginTop: 10 },
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 5 },
  tableRow: { flexDirection: 'row', marginBottom: 5 },
  col1: { width: '40%' },
  col2: { width: '30%', textAlign: 'right' },
  col3: { width: '30%', textAlign: 'right' },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 10, color: '#999' }
});

export const PayoutReceipt = ({ payout, influencer, transactions }: { payout: any; influencer: any; transactions: any[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>LavishOrganic</Text>
        <Text style={styles.subtitle}>Commission Payout Receipt</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Receipt Number:</Text>
          <Text style={styles.value}>{payout.payout_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(payout.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Partner Name:</Text>
          <Text style={styles.value}>{influencer.full_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Method:</Text>
          <Text style={[styles.value, { textTransform: 'uppercase' }]}>{payout.payment_method}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Reference / UTR:</Text>
          <Text style={styles.value}>{payout.payment_reference || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Payout Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount Paid:</Text>
          <Text style={[styles.value, { fontSize: 16, color: '#4A6741' }]}>INR {Number(payout.total_amount).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Transactions Settled:</Text>
          <Text style={styles.value}>{payout.transaction_count}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.table}>
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Settled Transactions</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Order Number</Text>
          <Text style={styles.col2}>Order Total</Text>
          <Text style={styles.col3}>Commission</Text>
        </View>
        
        {transactions.map((tx, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{tx.order_number}</Text>
            <Text style={styles.col2}>{Number(tx.order_total).toFixed(2)}</Text>
            <Text style={styles.col3}>{Number(tx.commission_amount).toFixed(2)} ({tx.commission_rate}%)</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text>Thank you for partnering with LavishOrganic.</Text>
        <Text>For any queries, contact partners@lavishorganic.in</Text>
      </View>
    </Page>
  </Document>
);

export const renderPayoutReceiptStream = async (payout: any, influencer: any, transactions: any[]) => {
  const { renderToStream } = await import('@react-pdf/renderer');
  return await renderToStream(<PayoutReceipt payout={payout} influencer={influencer} transactions={transactions} />);
};
