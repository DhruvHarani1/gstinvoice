import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatIndianCurrency } from '@/lib/utils';
import MonthFilter from '@/components/reports/MonthFilter';
import GstFilter from '@/components/reports/GstFilter';
import { 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Percent, 
  BarChart3, 
  PieChart, 
  Users 
} from 'lucide-react';

export const revalidate = 0; // Disable static page generation caching

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { month?: string; from?: string; to?: string };
}) {
  const supabase = createClient();

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Define date defaults
  const currentMonthStr = new Date().toISOString().substring(0, 7); // "YYYY-MM"
  const selectedMonth = searchParams.month || currentMonthStr;

  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = `${selectedMonth}-01`;
  const defaultFrom = searchParams.from || firstDayOfMonth;
  const defaultTo = searchParams.to || todayStr;

  // 2. Fetch all user invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, client:clients(*)')
    .eq('user_id', user.id);

  // 3. Section 1 - Selected Month Revenue Overview Metrics
  const monthlyInvoices = invoices?.filter((inv) => inv.invoice_date.startsWith(selectedMonth)) || [];
  
  let paidRevenue = 0;
  let outstandingRevenue = 0;
  let totalInvoiced = 0;

  monthlyInvoices.forEach((inv) => {
    const amt = Number(inv.total_amount) || 0;
    if (inv.status === 'paid') {
      paidRevenue += amt;
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      outstandingRevenue += amt;
    }
    
    if (inv.status !== 'cancelled') {
      totalInvoiced += amt;
    }
  });

  const collectionRate = totalInvoiced > 0 ? (paidRevenue / totalInvoiced) * 100 : 0;

  // 4. Section 2 - 12-Month Revenue History (SVG Bar Chart)
  const last12Months: { year: number; month: number; label: string; amount: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // avoid month overflow issues
    d.setMonth(d.getMonth() - i);
    last12Months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
      amount: 0,
    });
  }

  invoices?.forEach((inv) => {
    if (inv.status !== 'paid') return;
    const invDate = new Date(inv.invoice_date);
    const yr = invDate.getFullYear();
    const mth = invDate.getMonth();

    const match = last12Months.find((item) => item.year === yr && item.month === mth);
    if (match) {
      match.amount += Number(inv.total_amount) || 0;
    }
  });

  // Calculate coordinates for SVG Bar Chart scaling
  const maxMonthlyAmount = Math.max(...last12Months.map((m) => m.amount), 1000);
  const chartHeight = 150;
  const chartWidth = 500;
  const barWidth = 24;
  const barGap = 16;

  // 5. Section 3 - GST quarterly Summary (Date-range scoped query)
  const { data: gstItems } = await supabase
    .from('invoice_items')
    .select('*, invoice:invoices!inner(*)')
    .eq('invoice.user_id', user.id)
    .gte('invoice.invoice_date', defaultFrom)
    .lte('invoice.invoice_date', defaultTo);

  const gstSummaryMap = new Map<
    number,
    { rate: number; taxable: number; cgst: number; sgst: number; igst: number; total: number }
  >();

  // Initialize with standard GST rates for structure
  [0, 5, 12, 18, 28].forEach((r) => {
    gstSummaryMap.set(r, { rate: r, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  });

  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalGSTTax = 0;

  gstItems?.forEach((item) => {
    const rate = Number(item.gst_rate) || 0;
    const taxable = Number(item.taxable_amount) || 0;
    const cgst = Number(item.cgst_amount) || 0;
    const sgst = Number(item.sgst_amount) || 0;
    const igst = Number(item.igst_amount) || 0;
    const totalGst = cgst + sgst + igst;

    if (!gstSummaryMap.has(rate)) {
      gstSummaryMap.set(rate, { rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
    }

    const row = gstSummaryMap.get(rate)!;
    row.taxable += taxable;
    row.cgst += cgst;
    row.sgst += sgst;
    row.igst += igst;
    row.total += totalGst;

    totalTaxable += taxable;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;
    totalGSTTax += totalGst;
  });

  const gstSummaryList = Array.from(gstSummaryMap.values()).sort((a, b) => a.rate - b.rate);

  // 6. Section 4 - Top Clients Aggregation
  const clientMap = new Map<
    string,
    { name: string; count: number; billed: number; paid: number; outstanding: number }
  >();

  invoices?.forEach((inv) => {
    const clientName = inv.client?.name || 'Unknown Client';
    const clientId = inv.client_id;
    const amt = Number(inv.total_amount) || 0;

    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, { name: clientName, count: 0, billed: 0, paid: 0, outstanding: 0 });
    }

    const rec = clientMap.get(clientId)!;
    rec.count += 1;
    if (inv.status !== 'cancelled') {
      rec.billed += amt;
    }
    if (inv.status === 'paid') {
      rec.paid += amt;
    } else if (inv.status === 'sent' || inv.status === 'overdue') {
      rec.outstanding += amt;
    }
  });

  const topClients = Array.from(clientMap.values())
    .sort((a, b) => b.billed - a.billed)
    .slice(0, 5);

  // 7. Section 5 - Invoice Status Breakdown (SVG Donut Chart)
  const statusCounts = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
  
  invoices?.forEach((inv) => {
    const status = inv.status as keyof typeof statusCounts;
    if (status in statusCounts) {
      statusCounts[status] += 1;
    }
  });

  const totalInvoicesCount = invoices?.length || 0;
  
  const statusItems = [
    { name: 'Paid', count: statusCounts.paid, color: '#10B981', bg: 'bg-emerald-500' },
    { name: 'Sent', count: statusCounts.sent, color: '#3B82F6', bg: 'bg-blue-500' },
    { name: 'Overdue', count: statusCounts.overdue, color: '#EF4444', bg: 'bg-red-500' },
    { name: 'Draft', count: statusCounts.draft, color: '#94A3B8', bg: 'bg-slate-400' },
    { name: 'Cancelled', count: statusCounts.cancelled, color: '#F59E0B', bg: 'bg-amber-500' },
  ];

  // Circle circumference is 2 * pi * r = 314.16 (r=50)
  let accum = 0;
  const donutSegments = statusItems.map((item) => {
    const percentage = totalInvoicesCount > 0 ? item.count / totalInvoicesCount : 0;
    const strokeLength = percentage * 314.16;
    const strokeOffset = 314.16 - strokeLength;
    const rotation = (accum * 360) - 90;
    accum += percentage;
    return {
      ...item,
      strokeOffset,
      rotation,
      percentage: (percentage * 100).toFixed(1),
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reports & Analytics</h2>
          <p className="text-slate-500 text-xs mt-0.5">Track financial positions, taxes, GST groupings, and outstanding client statements.</p>
        </div>
        <MonthFilter currentMonth={selectedMonth} />
      </div>

      {/* Row 1: Key Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Paid Revenue</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{formatIndianCurrency(paidRevenue)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Cleared invoice funds in hand</p>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Outstanding</span>
            <div className="p-1.5 bg-red-50 rounded-lg text-red-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{formatIndianCurrency(outstandingRevenue)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Sent or past due invoices</p>
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Month Total Invoiced</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{formatIndianCurrency(totalInvoiced)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Gross volume generated</p>
          </div>
        </div>

        {/* Collection Rate */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collection Rate</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-[#6C63FF]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">{collectionRate.toFixed(1)}%</h3>
            <p className="text-[9px] text-slate-400 mt-1">Ratio of paid to total invoices</p>
          </div>
        </div>
      </div>

      {/* Row 2: Charts Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-700">12-Month Revenue History (Paid Invoices)</h3>
          </div>
          
          <div className="w-full flex justify-center pt-2">
            <svg viewBox={`0 0 ${chartWidth} 200`} className="w-full max-w-md h-52">
              <style>{`
                .bar-group:hover .bar-rect { fill: #5b52eb; }
                .bar-group:hover .chart-tooltip { opacity: 1; }
              `}</style>
              
              {/* Horizontal Grid lines */}
              <line x1="20" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="20" y1="80" x2="480" y2="80" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="20" y1="130" x2="480" y2="130" stroke="#f1f5f9" strokeDasharray="3" />
              <line x1="20" y1="160" x2="480" y2="160" stroke="#cbd5e1" strokeWidth="1" />

              {last12Months.map((item, idx) => {
                const percentHeight = item.amount / maxMonthlyAmount;
                const barHeight = Math.max(percentHeight * chartHeight, 3); // min height
                const x = 30 + idx * (barWidth + barGap);
                const y = 160 - barHeight;

                return (
                  <g key={idx} className="bar-group cursor-pointer">
                    {/* Bar Background */}
                    <rect
                      x={x}
                      y={10}
                      width={barWidth}
                      height={150}
                      fill="#F8FAFC"
                      rx="3"
                    />
                    
                    {/* Active Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#6C63FF"
                      rx="3"
                      className="bar-rect transition-all duration-300"
                    />

                    {/* X Label Month */}
                    <text
                      x={x + barWidth / 2}
                      y="178"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {item.label.split(' ')[0]}
                    </text>

                    {/* Tooltip on hover */}
                    <g className="chart-tooltip opacity-0 transition-opacity duration-200 pointer-events-none">
                      <rect
                        x={x - 28}
                        y={y - 25}
                        width={80}
                        height={20}
                        fill="#1E293B"
                        rx="4"
                      />
                      <text
                        x={x + barWidth / 2}
                        y={y - 12}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="8"
                        fontWeight="black"
                      >
                        ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(0)}k` : item.amount.toFixed(0)}
                      </text>
                      {/* Arrow */}
                      <polygon
                        points={`${x + barWidth / 2 - 3},${y - 5} ${x + barWidth / 2 + 3},${y - 5} ${x + barWidth / 2},${y - 1}`}
                        fill="#1E293B"
                      />
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Invoice Status Breakdown Donut Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
            <PieChart className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold text-slate-700">Invoice Distribution Status</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
            {/* Donut Chart SVG */}
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
                {totalInvoicesCount === 0 ? (
                  <circle
                    cx="80"
                    cy="80"
                    r="50"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="18"
                  />
                ) : (
                  donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r="50"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray="314.16"
                      strokeDashoffset={seg.strokeOffset}
                      transform={`rotate(${seg.rotation} 80 80)`}
                      className="transition-all duration-300 hover:stroke-[22px] cursor-pointer"
                    />
                  ))
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{totalInvoicesCount}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Invoices</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2.5 w-full max-w-[200px]">
              {donutSegments.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded ${item.bg}`} />
                    <span className="text-slate-600 font-semibold">{item.name}</span>
                  </div>
                  <div className="text-slate-500 font-mono">
                    <strong>{item.count}</strong>
                    <span className="text-[10px] text-slate-400 ml-1">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: GST Summary */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-700">GST Quarterly Filing Summary</h3>
        </div>

        {/* Date Filter & Export Row Client Component */}
        <GstFilter from={defaultFrom} to={defaultTo} />

        {/* GST Aggregated Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3.5">GST Rate</th>
                <th className="p-3.5">Taxable Amount</th>
                <th className="p-3.5">CGST</th>
                <th className="p-3.5">SGST</th>
                <th className="p-3.5">IGST</th>
                <th className="p-3.5 text-right">Total GST Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gstSummaryList.map((row) => (
                <tr key={row.rate} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-800">{row.rate}%</td>
                  <td className="p-3.5 text-slate-700 font-medium">{formatIndianCurrency(row.taxable)}</td>
                  <td className="p-3.5 text-slate-500">{formatIndianCurrency(row.cgst)}</td>
                  <td className="p-3.5 text-slate-500">{formatIndianCurrency(row.sgst)}</td>
                  <td className="p-3.5 text-slate-500">{formatIndianCurrency(row.igst)}</td>
                  <td className="p-3.5 text-right font-bold text-indigo-600">{formatIndianCurrency(row.total)}</td>
                </tr>
              ))}
              
              {/* Grand Total Row */}
              <tr className="bg-indigo-50/30 border-t border-slate-200 font-bold">
                <td className="p-3.5 text-indigo-900 uppercase">Total GST</td>
                <td className="p-3.5 text-indigo-900">{formatIndianCurrency(totalTaxable)}</td>
                <td className="p-3.5 text-slate-700">{formatIndianCurrency(totalCGST)}</td>
                <td className="p-3.5 text-slate-700">{formatIndianCurrency(totalSGST)}</td>
                <td className="p-3.5 text-slate-700">{formatIndianCurrency(totalIGST)}</td>
                <td className="p-3.5 text-right text-indigo-700 text-sm">{formatIndianCurrency(totalGSTTax)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Top Clients */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-bold text-slate-700">Top Invoiced Clients</h3>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          {topClients.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No invoicing client history found.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Client Name</th>
                  <th className="p-3.5">Invoices Issued</th>
                  <th className="p-3.5">Total Billed</th>
                  <th className="p-3.5">Total Paid</th>
                  <th className="p-3.5 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topClients.map((client, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-800">{client.name}</td>
                    <td className="p-3.5 text-slate-500 font-medium">{client.count}</td>
                    <td className="p-3.5 text-slate-700 font-bold">{formatIndianCurrency(client.billed)}</td>
                    <td className="p-3.5 text-emerald-600 font-bold">{formatIndianCurrency(client.paid)}</td>
                    <td className="p-3.5 text-right text-rose-600 font-bold">{formatIndianCurrency(client.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
