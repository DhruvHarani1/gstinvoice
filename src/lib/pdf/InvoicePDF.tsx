import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice, InvoiceItem, Client, Profile } from '@/types';
import { numberToWords } from './numberToWords';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8.5,
    color: '#1E293B',
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    paddingBottom: 15,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  textLogo: {
    width: 50,
    height: 50,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textLogoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  taxInvoiceTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  sellerGstinHeader: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textAlign: 'right',
    marginTop: 4,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sellerCol: {
    width: '48%',
  },
  metaCol: {
    width: '48%',
    alignItems: 'flex-end',
  },
  sectionHeading: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 5,
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  metaTable: {
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  metaLabel: {
    color: '#64748B',
    fontFamily: 'Helvetica-Bold',
    width: 90,
    textAlign: 'right',
    marginRight: 6,
  },
  metaValue: {
    color: '#1E293B',
    width: 100,
    textAlign: 'left',
  },
  billToCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  billToHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    padding: 6,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    padding: 6,
    alignItems: 'center',
  },
  colNo: { width: '4%', textAlign: 'center' },
  colDesc: { width: '27%', paddingLeft: 4 },
  colHsn: { width: '9%', textAlign: 'center' },
  colQty: { width: '7%', textAlign: 'center' },
  colRate: { width: '10%', textAlign: 'right' },
  colTaxable: { width: '11%', textAlign: 'right' },
  colCgstIgst: { width: '11%', textAlign: 'right' },
  colSgst: { width: '11%', textAlign: 'right' },
  colTotal: { width: '10%', textAlign: 'right' },
  
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryLeft: {
    width: '50%',
  },
  summaryRight: {
    width: '45%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    color: '#64748B',
    fontFamily: 'Helvetica',
  },
  summaryValue: {
    color: '#1E293B',
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
    borderWidth: 1,
  },
  grandTotalLabel: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
  },
  wordsContainer: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  wordsLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  wordsText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1E293B',
  },
  bankContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  bankDetailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  bankDetailLabel: {
    width: 70,
    color: '#64748B',
    fontSize: 7.5,
  },
  bankDetailValue: {
    color: '#1E293B',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
  },
  termsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    marginTop: 15,
  },
  termsHeading: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 7,
    color: '#64748B',
    marginBottom: 4,
  },
  footerDisclaimer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 7,
    marginTop: 15,
    fontStyle: 'italic',
  },
  thankYouMessage: {
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    marginTop: 8,
  }
});

interface InvoicePDFProps {
  invoice: Invoice;
  items: (Omit<InvoiceItem, 'id' | 'invoice_id'> & { id?: string; invoice_id?: string })[];
  client: Client;
  profile: Profile;
  sellerEmail?: string;
  pdfThemeColor?: string;
  upiId?: string;
  showBankDetails?: boolean;
}

export default function InvoicePDF({ 
  invoice, 
  items, 
  client, 
  profile, 
  sellerEmail,
  pdfThemeColor = '#6C63FF',
  upiId,
  showBankDetails = true,
}: InvoicePDFProps) {
  // Determine if it is Intrastate or Interstate
  const isIntrastate = profile.state === invoice.place_of_supply;

  // Currency formatter inside PDF
  const formatCurrency = (val: number | string | null | undefined) => {
    if (val === null || val === undefined) return '0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const grandTotal = Math.round(invoice.total_amount);
  const roundOff = grandTotal - invoice.total_amount;
  const amtInWords = numberToWords(grandTotal);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={[styles.header, { borderBottomColor: pdfThemeColor }]}>
          <View style={styles.headerLeft}>
            {profile.logo_url ? (
              <View style={styles.logoContainer}>
                <Image src={profile.logo_url} style={styles.logoImage} />
              </View>
            ) : (
              <View style={[styles.textLogo, { backgroundColor: pdfThemeColor }]}>
                <Text style={styles.textLogoText}>
                  {profile.business_name ? profile.business_name.charAt(0).toUpperCase() : 'B'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.companyName}>{profile.business_name}</Text>
              <Text style={{ color: '#64748B', fontSize: 8, marginTop: 2 }}>GSTIN Compliant Bill</Text>
            </View>
          </View>
          <View>
            <Text style={[styles.taxInvoiceTitle, { color: pdfThemeColor }]}>TAX INVOICE</Text>
            {profile.gstin && (
              <Text style={styles.sellerGstinHeader}>GSTIN: {profile.gstin}</Text>
            )}
          </View>
        </View>

        {/* Seller Info & Invoice Meta */}
        <View style={styles.infoSection}>
          {/* Seller Column */}
          <View style={styles.sellerCol}>
            <Text style={[styles.sectionHeading, { color: pdfThemeColor, borderBottomColor: '#E2E8F0' }]}>
              Seller Details
            </Text>
            <Text style={[styles.boldText, { fontSize: 9.5, marginBottom: 2 }]}>{profile.business_name}</Text>
            {profile.address && <Text style={{ marginBottom: 1 }}>{profile.address}</Text>}
            <Text style={{ marginBottom: 2 }}>
              {[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}
            </Text>
            {profile.phone && <Text style={{ marginBottom: 1 }}>Phone: {profile.phone}</Text>}
            {sellerEmail && <Text style={{ marginBottom: 1 }}>Email: {sellerEmail}</Text>}
            {profile.gstin && <Text style={[styles.boldText, { marginTop: 2 }]}>GSTIN: {profile.gstin}</Text>}
          </View>

          {/* Meta Column */}
          <View style={styles.metaCol}>
            <Text style={[styles.sectionHeading, { color: pdfThemeColor, borderBottomColor: '#E2E8F0', alignSelf: 'stretch', textAlign: 'right' }]}>
              Invoice Info
            </Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No:</Text>
                <Text style={[styles.metaValue, styles.boldText]}>{invoice.invoice_number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice Date:</Text>
                <Text style={styles.metaValue}>
                  {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '—'}
                </Text>
              </View>
              {invoice.due_date && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Due Date:</Text>
                  <Text style={styles.metaValue}>
                    {new Date(invoice.due_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              )}
              {invoice.place_of_supply && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Place of Supply:</Text>
                  <Text style={styles.metaValue}>{invoice.place_of_supply}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bill To Card */}
        <View style={styles.billToCard}>
          <Text style={[styles.billToHeading, { color: pdfThemeColor }]}>Billed To</Text>
          <Text style={[styles.boldText, { fontSize: 9.5, marginBottom: 2 }]}>{client.name}</Text>
          {client.address && <Text style={{ marginBottom: 1 }}>{client.address}</Text>}
          <Text style={{ marginBottom: 2 }}>
            {[client.city, client.state, client.pincode].filter(Boolean).join(', ')}
          </Text>
          {client.phone && <Text style={{ marginBottom: 1 }}>Phone: {client.phone}</Text>}
          {client.email && <Text style={{ marginBottom: 1 }}>Email: {client.email}</Text>}
          {client.gstin && (
            <Text style={[styles.boldText, { marginTop: 2, color: '#475569' }]}>
              GSTIN: {client.gstin}
            </Text>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: pdfThemeColor }]}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            <Text style={styles.colTaxable}>Taxable</Text>
            <Text style={styles.colCgstIgst}>{isIntrastate ? 'CGST' : 'IGST'}</Text>
            <Text style={styles.colSgst}>{isIntrastate ? 'SGST' : '—'}</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {items.map((item, idx) => {
            const isRowOdd = idx % 2 !== 0;
            return (
              <View 
                key={item.id || idx} 
                style={[
                  styles.tableRow, 
                  { backgroundColor: isRowOdd ? '#F8FAFC' : '#FFFFFF' }
                ]}
              >
                <Text style={styles.colNo}>{idx + 1}</Text>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colHsn}>{item.hsn_sac || '—'}</Text>
                <Text style={styles.colQty}>{Number(item.quantity)}</Text>
                <Text style={styles.colRate}>{formatCurrency(item.rate)}</Text>
                <Text style={styles.colTaxable}>{formatCurrency(item.taxable_amount)}</Text>
                
                {/* CGST / IGST cell */}
                <Text style={styles.colCgstIgst}>
                  {isIntrastate ? (
                    `${Number(item.cgst_rate)}%\n(₹${formatCurrency(item.cgst_amount)})`
                  ) : (
                    `${Number(item.igst_rate)}%\n(₹${formatCurrency(item.igst_amount)})`
                  )}
                </Text>

                {/* SGST cell */}
                <Text style={styles.colSgst}>
                  {isIntrastate ? (
                    `${Number(item.sgst_rate)}%\n(₹${formatCurrency(item.sgst_amount)})`
                  ) : (
                    '—'
                  )}
                </Text>

                <Text style={[styles.colTotal, styles.boldText]}>{formatCurrency(item.total_amount)}</Text>
              </View>
            );
          })}
        </View>

        {/* Totals Section */}
        <View style={styles.summarySection}>
          {/* Words, Bank info */}
          <View style={styles.summaryLeft}>
            <View style={[styles.wordsContainer, { borderLeftColor: pdfThemeColor }]}>
              <Text style={styles.wordsLabel}>Amount in Words</Text>
              <Text style={styles.wordsText}>Rupees {amtInWords} Only</Text>
            </View>

            {/* Bank Details */}
            {showBankDetails && (profile.bank_name || upiId) && (
              <View style={styles.bankContainer}>
                <Text style={[styles.bankTitle, { color: pdfThemeColor }]}>Bank Details for Payment</Text>
                {profile.bank_name && (
                  <>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Bank Name:</Text>
                      <Text style={styles.bankDetailValue}>{profile.bank_name}</Text>
                    </View>
                    <View style={styles.bankDetailRow}>
                      <Text style={styles.bankDetailLabel}>Account No:</Text>
                      <Text style={styles.bankDetailValue}>{profile.bank_account}</Text>
                    </View>
                    {profile.bank_ifsc && (
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>IFSC Code:</Text>
                        <Text style={styles.bankDetailValue}>{profile.bank_ifsc}</Text>
                      </View>
                    )}
                  </>
                )}
                {upiId && (
                  <View style={styles.bankDetailRow}>
                    <Text style={styles.bankDetailLabel}>UPI ID:</Text>
                    <Text style={styles.bankDetailValue}>{upiId}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Math Summary */}
          <View style={styles.summaryRight}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal (Taxable)</Text>
              <Text style={styles.summaryValue}>₹{formatCurrency(invoice.subtotal)}</Text>
            </View>

            {isIntrastate ? (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CGST Total</Text>
                  <Text style={styles.summaryValue}>₹{formatCurrency(invoice.cgst_amount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>SGST Total</Text>
                  <Text style={styles.summaryValue}>₹{formatCurrency(invoice.sgst_amount)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGST Total</Text>
                <Text style={styles.summaryValue}>₹{formatCurrency(invoice.igst_amount)}</Text>
              </View>
            )}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Round Off</Text>
              <Text style={styles.summaryValue}>
                {roundOff >= 0 ? '+' : ''}₹{formatCurrency(roundOff)}
              </Text>
            </View>

            <View 
              style={[
                styles.grandTotalRow, 
                { 
                  borderColor: pdfThemeColor, 
                  backgroundColor: pdfThemeColor + '10' // Add 10% opacity hex code
                }
              ]}
            >
              <Text style={[styles.grandTotalLabel, { color: pdfThemeColor }]}>Grand Total</Text>
              <Text style={[styles.grandTotalValue, { color: pdfThemeColor }]}>₹{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Footer Notes & Disclaimer */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.termsSection}>
            {invoice.notes && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.termsHeading}>Notes</Text>
                <Text style={styles.termsText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.termsHeading}>Terms & Conditions</Text>
                <Text style={styles.termsText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.footerDisclaimer}>
          This is a computer-generated invoice and does not require a physical signature.
        </Text>
        <Text style={[styles.thankYouMessage, { color: pdfThemeColor }]}>Thank you for your business!</Text>
      </Page>
    </Document>
  );
}
