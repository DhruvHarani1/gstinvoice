import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import MonthlySummaryEmail from '@/lib/email/templates/MonthlySummary';

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function POST(request: NextRequest) {
  try {
    // Verify cron authorization header (Vercel Cron security pattern)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all user profiles that have notification_preferences.email_monthly_summary enabled
    const { data: usersWithPref, error: prefError } = await supabaseAdmin
      .from('notification_preferences')
      .select('user_id')
      .eq('email_monthly_summary', true);

    if (prefError || !usersWithPref) {
      console.error('Failed to fetch user preferences for monthly cron:', prefError);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }

    const userIds = usersWithPref.map((pref) => pref.user_id);
    if (userIds.length === 0) {
      return NextResponse.json({ message: 'No users have monthly summary notification enabled.' });
    }

    // 2. Compute date boundaries for the previous month
    const now = new Date();
    // Move to 1st day of previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthName = prevMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    // Start/End strings (YYYY-MM-DD)
    const startOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1).toISOString().split('T')[0];
    const endOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log(`Running monthly summaries for ${monthName} (Range: ${startOfPrevMonth} to ${endOfPrevMonth})`);

    let emailsDispatched = 0;

    // 3. Loop through users, compile stats, and email them
    for (const userId of userIds) {
      try {
        // Fetch profile business name
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('business_name')
          .eq('id', userId)
          .single();

        if (!profile) continue;

        // Fetch auth user email
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = authUser?.user?.email;
        if (!email) continue;

        // Fetch user's invoices in previous month
        const { data: invoices } = await supabaseAdmin
          .from('invoices')
          .select('*, client:clients(*)')
          .eq('user_id', userId)
          .gte('invoice_date', startOfPrevMonth)
          .lte('invoice_date', endOfPrevMonth);

        if (!invoices || invoices.length === 0) {
          // Skip if user had no activity last month
          continue;
        }

        // Calculate statistics
        let revenue = 0;
        let invoicesSent = 0;
        let gstOwed = 0;
        const clientRevenueMap: { [clientName: string]: number } = {};

        invoices.forEach((inv) => {
          const total = Number(inv.total_amount) || 0;
          const cgst = Number(inv.cgst_amount) || 0;
          const sgst = Number(inv.sgst_amount) || 0;
          const igst = Number(inv.igst_amount) || 0;

          if (inv.status === 'paid') {
            revenue += total;
          }

          if (inv.status === 'sent' || inv.status === 'paid' || inv.status === 'overdue') {
            invoicesSent += 1;
            gstOwed += cgst + sgst + igst;

            const clientName = inv.client?.name || 'Unknown Client';
            clientRevenueMap[clientName] = (clientRevenueMap[clientName] || 0) + total;
          }
        });

        // Resolve top client by total invoice revenue
        let topClient = '';
        let maxRevenue = -1;
        Object.entries(clientRevenueMap).forEach(([clientName, clientTotal]) => {
          if (clientTotal > maxRevenue) {
            maxRevenue = clientTotal;
            topClient = clientName;
          }
        });

        // 4. Send the monthly summary email via Resend
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'invoices@invoicewala.in';
        
        await resend.emails.send({
          from: fromEmail,
          to: email,
          subject: `Monthly Business Digest — ${monthName} 📊`,
          react: React.createElement(MonthlySummaryEmail, {
            businessName: profile.business_name,
            monthName,
            revenue,
            invoicesSent,
            topClient,
            gstOwed,
          }) as React.ReactElement,
        });

        emailsDispatched++;
      } catch (userErr) {
        console.error(`Failed to process monthly summary email for user ${userId}:`, userErr);
      }
    }

    return NextResponse.json({
      success: true,
      month: monthName,
      emailsDispatched,
    });
  } catch (error) {
    console.error('Monthly Summary Cron Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Support GET trigger in development/testing without authorization validation if env is local
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    return POST(request);
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
