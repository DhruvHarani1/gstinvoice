import React from 'react';
import { Invoice, Client, Profile } from '@/types';

interface InvoiceEmailProps {
  invoice: Invoice;
  client: Client;
  profile: Profile;
}

export default function InvoiceEmail({ invoice, client, profile }: InvoiceEmailProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const publicInvoiceUrl = `${appUrl}/public/invoice/${invoice.id}`;

  const containerStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
    color: '#334155',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '580px',
    margin: '0 auto',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: '2px solid #6C63FF',
    paddingBottom: '20px',
    marginBottom: '25px',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#6C63FF',
  };

  const logoAccentStyle: React.CSSProperties = {
    color: '#0f172a',
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#0f172a',
    margin: '0 0 10px 0',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
    color: '#475569',
  };

  const summaryCardStyle: React.CSSProperties = {
    backgroundColor: '#f3f0ff',
    borderRadius: '8px',
    border: '1px solid #e0d7ff',
    padding: '20px',
    marginBottom: '25px',
  };

  const summaryTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#6C63FF',
    margin: '0 0 15px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  const gridRowStyle: React.CSSProperties = {
    padding: '8px 0',
    borderBottom: '1px solid rgba(108, 99, 255, 0.1)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    float: 'left',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '600',
    textAlign: 'right',
    display: 'block',
  };

  const buttonContainerStyle: React.CSSProperties = {
    textAlign: 'center',
    margin: '30px 0',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#6C63FF',
    color: '#ffffff',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
  };

  const detailsSectionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748b',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px',
    marginTop: '20px',
    lineHeight: '1.5',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '25px',
    fontSize: '12px',
    color: '#94a3b8',
  };

  const linkStyle: React.CSSProperties = {
    color: '#6C63FF',
    textDecoration: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={logoStyle}>
            Invoice<span style={logoAccentStyle}>Wala</span>
          </div>
        </div>

        {/* Heading */}
        <h1 style={headingStyle}>New Invoice Received</h1>
        <p style={textStyle}>
          Hello <strong>{client.name}</strong>,
        </p>
        <p style={textStyle}>
          You have received a new invoice from <strong>{profile.business_name}</strong>. Please find the summary below. A PDF copy is attached for your reference.
        </p>

        {/* Summary Card */}
        <div style={summaryCardStyle}>
          <div style={summaryTitleStyle}>Invoice Summary</div>
          
          <div style={gridRowStyle}>
            <span style={labelStyle}>Invoice Number</span>
            <span style={valueStyle}>{invoice.invoice_number}</span>
          </div>
          
          <div style={gridRowStyle}>
            <span style={labelStyle}>Invoice Date</span>
            <span style={valueStyle}>
              {new Date(invoice.invoice_date).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {invoice.due_date && (
            <div style={gridRowStyle}>
              <span style={labelStyle}>Due Date</span>
              <span style={{ ...valueStyle, color: '#e11d48' }}>
                {new Date(invoice.due_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          <div style={{ ...gridRowStyle, borderBottom: 'none' }}>
            <span style={{ ...labelStyle, fontSize: '15px', color: '#0f172a', fontWeight: 'bold' }}>Amount Due</span>
            <span style={{ ...valueStyle, fontSize: '16px', color: '#6C63FF', fontWeight: 'bold' }}>
              {formatCurrency(Number(invoice.total_amount))}
            </span>
          </div>
          <div style={{ clear: 'both' }}></div>
        </div>

        {/* View Invoice Button */}
        <div style={buttonContainerStyle}>
          <a href={publicInvoiceUrl} style={buttonStyle} target="_blank" rel="noopener noreferrer">
            View Invoice Details
          </a>
        </div>

        {/* Business Details */}
        <div style={detailsSectionStyle}>
          <strong style={{ color: '#475569' }}>Sent by {profile.business_name}</strong>
          {profile.address && <div style={{ marginTop: '2px' }}>{profile.address}</div>}
          <div>
            {[profile.city, profile.state, profile.pincode].filter(Boolean).join(', ')}
          </div>
          {profile.phone && <div>Phone: {profile.phone}</div>}
          {profile.gstin && <div style={{ marginTop: '4px', fontFamily: 'monospace' }}>GSTIN: {profile.gstin}</div>}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p>This email was sent by InvoiceWala on behalf of {profile.business_name}.</p>
        <p style={{ marginTop: '5px' }}>
          <a href="#" style={linkStyle}>Unsubscribe</a> | <a href={appUrl} style={linkStyle}>InvoiceWala</a>
        </p>
      </div>

      {/* Email Tracking Pixel */}
      <img
        src={`${appUrl}/api/invoice/${invoice.id}/track`}
        width="1"
        height="1"
        alt=""
        style={{ display: 'none' }}
      />
    </div>
  );
}
