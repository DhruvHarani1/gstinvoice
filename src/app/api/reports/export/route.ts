import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // 1. Authenticate user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (type !== 'gst_summary' || !from || !to) {
      return new Response('Invalid parameters. Required: type=gst_summary, from (YYYY-MM-DD), and to (YYYY-MM-DD)', { status: 400 });
    }

    // 2. Fetch invoice items joined with parent invoices in the specified date range
    // Bypasses other users by filtering with user_id on the inner join invoices table
    const { data: items, error } = await supabase
      .from('invoice_items')
      .select('*, invoice:invoices!inner(*)')
      .eq('invoice.user_id', user.id)
      .gte('invoice.invoice_date', from)
      .lte('invoice.invoice_date', to);

    if (error) {
      console.error('Failed to query invoice items for CSV export:', error);
      return new Response('Failed to query reporting database records', { status: 500 });
    }

    // 3. Aggregate GST totals grouped by rate
    const summaryMap = new Map<
      number,
      { taxable: number; cgst: number; sgst: number; igst: number; totalGst: number }
    >();

    items?.forEach((item) => {
      const rate = Number(item.gst_rate) || 0;
      const taxable = Number(item.taxable_amount) || 0;
      const cgst = Number(item.cgst_amount) || 0;
      const sgst = Number(item.sgst_amount) || 0;
      const igst = Number(item.igst_amount) || 0;
      const totalGst = cgst + sgst + igst;

      if (!summaryMap.has(rate)) {
        summaryMap.set(rate, { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0 });
      }

      const row = summaryMap.get(rate)!;
      row.taxable += taxable;
      row.cgst += cgst;
      row.sgst += sgst;
      row.igst += igst;
      row.totalGst += totalGst;
    });

    // 4. Construct CSV data
    let csv = 'GST Rate,Taxable Amount (INR),CGST (INR),SGST (INR),IGST (INR),Total GST (INR)\n';
    
    // Sort GST tiers ascending
    const sortedRates = Array.from(summaryMap.keys()).sort((a, b) => a - b);
    sortedRates.forEach((rate) => {
      const row = summaryMap.get(rate)!;
      csv += `${rate}%,${row.taxable.toFixed(2)},${row.cgst.toFixed(2)},${row.sgst.toFixed(2)},${row.igst.toFixed(2)},${row.totalGst.toFixed(2)}\n`;
    });

    if (sortedRates.length === 0) {
      csv += 'No transactions found,0.00,0.00,0.00,0.00,0.00\n';
    }

    // 5. Send download response
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="GST_Summary_${from}_to_${to}.csv"`,
      },
    });
  } catch (err) {
    console.error('Error generating export CSV:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
