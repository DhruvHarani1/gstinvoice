import React from 'react';

interface MonthlySummaryEmailProps {
  businessName: string;
  monthName: string;
  revenue: number;
  invoicesSent: number;
  topClient: string;
  gstOwed: number;
}

export default function MonthlySummaryEmail({
  businessName,
  monthName,
  revenue,
  invoicesSent,
  topClient,
  gstOwed,
}: MonthlySummaryEmailProps) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const reportsUrl = `${appUrl}/dashboard/reports`;

  const containerStyle: React.CSSProperties = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    backgroundColor: '#f8fafc',
    padding: '40px 20px',
    color: '#334155',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '580px',
    margin: '0 auto',
    padding: '36px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0',
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid #f1f5f9',
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
    margin: '0 0 8px 0',
  };

  const subHeadingStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 25px 0',
    fontWeight: '500',
  };

  const textStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0 0 20px 0',
    color: '#475569',
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '28px',
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '6px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
  };

  const primaryStatCardStyle: React.CSSProperties = {
    ...statCardStyle,
    backgroundColor: '#f5f3ff',
    border: '1px solid #e0d7ff',
  };

  const primaryStatValueStyle: React.CSSProperties = {
    ...statValueStyle,
    color: '#6C63FF',
    fontSize: '22px',
  };

  const buttonContainerStyle: React.CSSProperties = {
    textAlign: 'center',
    margin: '30px 0 10px 0',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: '#6C63FF',
    color: '#ffffff',
    padding: '12px 36px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'inline-block',
  };

  const footerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '30px',
    fontSize: '12px',
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '20px',
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
        <h1 style={headingStyle}>Your Monthly Summary</h1>
        <p style={subHeadingStyle}>For {monthName} — {businessName}</p>
        
        <p style={textStyle}>
          Here is your business performance summary for the month of {monthName}.
        </p>

        {/* Stats Section */}
        <div style={statsGridStyle}>
          <div style={primaryStatCardStyle}>
            <span style={statLabelStyle}>Revenue (Paid)</span>
            <span style={primaryStatValueStyle}>{formatCurrency(revenue)}</span>
          </div>
          
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Invoices Sent</span>
            <span style={statValueStyle}>{invoicesSent}</span>
          </div>
          
          <div style={statCardStyle}>
            <span style={statLabelStyle}>GST Owed</span>
            <span style={{ ...statValueStyle, color: '#e11d48' }}>{formatCurrency(gstOwed)}</span>
          </div>

          <div style={statCardStyle}>
            <span style={statLabelStyle}>Top Client</span>
            <span style={{ ...statValueStyle, fontSize: '13px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topClient || '—'}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div style={buttonContainerStyle}>
          <a href={reportsUrl} style={buttonStyle} target="_blank" rel="noopener noreferrer">
            View Full Report
          </a>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <p>Sent automatically to {businessName} because Monthly Summary notifications are enabled.</p>
          <p style={{ marginTop: '5px' }}>
            <a href={`${appUrl}/dashboard/settings/notifications`} style={linkStyle}>Manage Notification Settings</a> | <a href={appUrl} style={linkStyle}>InvoiceWala</a>
          </p>
        </div>
      </div>
    </div>
  );
}
