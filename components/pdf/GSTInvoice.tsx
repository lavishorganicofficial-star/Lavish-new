import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { GSTInvoiceData, GSTBreakdown } from '@/types';
import { calculateOrderGST, getStateCode } from '@/lib/gst';

// Register a fallback font (Helvetica is built-in)
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 40,
    backgroundColor: '#FFFFFF',
    color: '#2C2C2C',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#4A6741',
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#4A6741',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 8,
    color: '#7D9B76',
    marginTop: 2,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#4A6741',
    textAlign: 'right',
  },
  invoiceSubtitle: {
    fontSize: 8,
    color: '#6E6E6E',
    textAlign: 'right',
    marginTop: 4,
  },
  // Section headers
  sectionHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#4A6741',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 16,
  },
  // Two-column info boxes
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    padding: 10,
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 7,
    color: '#6E6E6E',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 9,
    color: '#2C2C2C',
    lineHeight: 1.5,
  },
  infoValueBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#2C2C2C',
  },
  // Table
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#4A6741',
    padding: '6 8',
    borderRadius: 2,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '6 8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E4DE',
  },
  tableRowAlt: {
    backgroundColor: '#FAF7F2',
  },
  tableCell: {
    fontSize: 8.5,
    color: '#2C2C2C',
  },
  // Column widths
  colProduct: { flex: 3 },
  colHSN: { flex: 1, textAlign: 'center' },
  colQty: { flex: 0.5, textAlign: 'center' },
  colRate: { flex: 1, textAlign: 'right' },
  colTaxable: { flex: 1, textAlign: 'right' },
  colCGST: { flex: 0.8, textAlign: 'right' },
  colSGST: { flex: 0.8, textAlign: 'right' },
  colIGST: { flex: 0.8, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  // Totals section
  totalsContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 240,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E4DE',
  },
  totalsLabel: {
    fontSize: 8.5,
    color: '#6E6E6E',
  },
  totalsValue: {
    fontSize: 8.5,
    color: '#2C2C2C',
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 4,
    backgroundColor: '#4A6741',
    padding: 8,
    borderRadius: 2,
  },
  grandTotalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  grandTotalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: '#E8E4DE',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#6E6E6E',
  },
  declaration: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FAF7F2',
    borderRadius: 4,
  },
  declarationText: {
    fontSize: 7.5,
    color: '#4A4A4A',
    lineHeight: 1.6,
  },
});

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface GSTInvoiceProps {
  invoiceData: GSTInvoiceData;
}

export function GSTInvoice({ invoiceData }: GSTInvoiceProps) {
  const { invoice_number, invoice_date, order, items, business, is_interstate } = invoiceData;
  const { shipping_address } = order;
  const addr = shipping_address as {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };

  // Calculate GST
  const gstResult = calculateOrderGST(items, addr.state);
  const stateCode = getStateCode(addr.state);

  return (
    <Document
      title={`Tax Invoice — ${invoice_number}`}
      author="LavishOrganic"
      subject="GST Tax Invoice"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>LAVISHORGANIC</Text>
            <Text style={styles.brandTagline}>100% Organic · Cruelty Free · Made in India</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceSubtitle}>Invoice No: {invoice_number}</Text>
            <Text style={styles.invoiceSubtitle}>Date: {invoice_date}</Text>
            <Text style={styles.invoiceSubtitle}>Order No: {order.order_number}</Text>
          </View>
        </View>

        {/* Seller & Buyer Info */}
        <View style={styles.infoRow}>
          {/* Seller */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Sold By (Seller)</Text>
            <Text style={styles.infoValueBold}>{business.name}</Text>
            <Text style={styles.infoValue}>{business.address}</Text>
            <Text style={styles.infoValue}>State: {business.state} ({business.state_code})</Text>
            <Text style={styles.infoValue}>GSTIN: {business.gstin}</Text>
          </View>
          {/* Buyer */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Billed To (Buyer)</Text>
            <Text style={styles.infoValueBold}>{addr.name}</Text>
            <Text style={styles.infoValue}>{addr.line1}</Text>
            {addr.line2 ? <Text style={styles.infoValue}>{addr.line2}</Text> : null}
            <Text style={styles.infoValue}>{addr.city}, {addr.state} — {addr.pincode}</Text>
            <Text style={styles.infoValue}>State Code: {stateCode}</Text>
            <Text style={styles.infoValue}>Phone: {addr.phone}</Text>
          </View>
        </View>

        {/* Supply Type */}
        <Text style={{ fontSize: 8, color: '#4A6741', marginBottom: 8 }}>
          Supply Type: {is_interstate ? 'Inter-State Supply (IGST Applicable)' : 'Intra-State Supply (CGST + SGST Applicable)'}
        </Text>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>Product Description</Text>
            <Text style={[styles.tableHeaderText, styles.colHSN]}>HSN</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate (₹)</Text>
            <Text style={[styles.tableHeaderText, styles.colTaxable]}>Taxable (₹)</Text>
            {is_interstate ? (
              <Text style={[styles.tableHeaderText, styles.colIGST]}>IGST (₹)</Text>
            ) : (
              <>
                <Text style={[styles.tableHeaderText, styles.colCGST]}>CGST (₹)</Text>
                <Text style={[styles.tableHeaderText, styles.colSGST]}>SGST (₹)</Text>
              </>
            )}
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total (₹)</Text>
          </View>

          {/* Rows */}
          {gstResult.items.map((item, index) => {
            const gb = item.gst_breakdown;
            return (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colProduct}>
                  <Text style={styles.tableCell}>{item.product_name}</Text>
                  {item.variant_name && (
                    <Text style={[styles.tableCell, { color: '#6E6E6E', fontSize: 7.5 }]}>
                      {item.variant_name}
                    </Text>
                  )}
                  <Text style={[styles.tableCell, { color: '#6E6E6E', fontSize: 7 }]}>
                    GST: {item.gst_rate}%
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.colHSN]}>{item.hsn_code ?? 'N/A'}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>{fmt(item.unit_price)}</Text>
                <Text style={[styles.tableCell, styles.colTaxable]}>{fmt(gb.taxable_amount)}</Text>
                {is_interstate ? (
                  <Text style={[styles.tableCell, styles.colIGST]}>
                    {fmt(gb.igst_amount)}{'\n'}<Text style={{ fontSize: 7, color: '#6E6E6E' }}>{gb.igst_rate}%</Text>
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.tableCell, styles.colCGST]}>
                      {fmt(gb.cgst_amount)}{'\n'}<Text style={{ fontSize: 7, color: '#6E6E6E' }}>{gb.cgst_rate}%</Text>
                    </Text>
                    <Text style={[styles.tableCell, styles.colSGST]}>
                      {fmt(gb.sgst_amount)}{'\n'}<Text style={{ fontSize: 7, color: '#6E6E6E' }}>{gb.sgst_rate}%</Text>
                    </Text>
                  </>
                )}
                <Text style={[styles.tableCell, styles.colTotal, { fontFamily: 'Helvetica-Bold' }]}>
                  {fmt(item.total_price)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal (Taxable)</Text>
              <Text style={styles.totalsValue}>₹{fmt(gstResult.total_taxable)}</Text>
            </View>
            {!is_interstate && (
              <>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>CGST</Text>
                  <Text style={styles.totalsValue}>₹{fmt(gstResult.total_cgst)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>SGST</Text>
                  <Text style={styles.totalsValue}>₹{fmt(gstResult.total_sgst)}</Text>
                </View>
              </>
            )}
            {is_interstate && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IGST</Text>
                <Text style={styles.totalsValue}>₹{fmt(gstResult.total_igst)}</Text>
              </View>
            )}
            {order.shipping_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Shipping</Text>
                <Text style={styles.totalsValue}>₹{fmt(order.shipping_amount)}</Text>
              </View>
            )}
            {order.discount_amount > 0 && (
              <View style={styles.totalsRow}>
                <Text style={[styles.totalsLabel, { color: '#4A6741' }]}>Discount</Text>
                <Text style={[styles.totalsValue, { color: '#4A6741' }]}>-₹{fmt(order.discount_amount)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{fmt(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationText}>
            Declaration: We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
            This is a computer-generated invoice and does not require a physical signature.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LavishOrganic · {business.address} · GSTIN: {business.gstin}
          </Text>
          <Text style={styles.footerText}>
            Thank you for choosing organic! 🌿
          </Text>
        </View>
      </Page>
    </Document>
  );
}
