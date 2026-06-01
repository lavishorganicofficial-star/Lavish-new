import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  tableHeader: { flexDirection: 'row', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 5, backgroundColor: '#f9fafb', padding: 5 },
  tableRow: { flexDirection: 'row', marginBottom: 5, padding: 5, borderBottom: '1px solid #f3f4f6' },
  col1: { width: '40%' },
  col2: { width: '20%', textAlign: 'right' },
  col3: { width: '20%', textAlign: 'right' },
  col4: { width: '20%', textAlign: 'right' },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 10, color: '#999' }
});

export const InfluencerReport = ({ data, dateRange }: { data: any[]; dateRange: string }) => {
  const totalSales = data.reduce((sum, inf) => sum + Number(inf.total_sales_value), 0);
  const totalCommission = data.reduce((sum, inf) => sum + Number(inf.total_commission_earned), 0);
  const totalPaid = data.reduce((sum, inf) => sum + Number(inf.paid_commission), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>LavishOrganic</Text>
          <Text style={styles.subtitle}>Influencer Performance Report</Text>
          <Text style={[styles.subtitle, { marginTop: 5 }]}>Period: {dateRange}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Summary Totals</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Sales Generated:</Text>
            <Text style={[styles.value, { color: '#4A6741' }]}>INR {totalSales.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Commission Earned:</Text>
            <Text style={styles.value}>INR {totalCommission.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Commission Paid:</Text>
            <Text style={styles.value}>INR {totalPaid.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>Partner Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Name / Handle</Text>
            <Text style={styles.col2}>Sales</Text>
            <Text style={styles.col3}>Earned</Text>
            <Text style={styles.col4}>Pending</Text>
          </View>
          
          {data.map((inf, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text style={{ fontWeight: 'bold' }}>{inf.profiles?.full_name}</Text>
                <Text style={{ fontSize: 10, color: '#666' }}>@{inf.instagram_handle}</Text>
              </View>
              <Text style={styles.col2}>{Number(inf.total_sales_value).toFixed(2)}</Text>
              <Text style={styles.col3}>{Number(inf.total_commission_earned).toFixed(2)}</Text>
              <Text style={styles.col4}>{Number(inf.pending_commission).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleString()}</Text>
        </View>
      </Page>
    </Document>
  );
};

export const renderInfluencerReportStream = async (data: any[], dateRange: string) => {
  const { renderToStream } = await import('@react-pdf/renderer');
  return await renderToStream(<InfluencerReport data={data} dateRange={dateRange} />);
};
