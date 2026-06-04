import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase Service Role client to bypass RLS policies in cron context
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export const revalidate = 0; // Disable route caching for live cron trigger

export async function GET(request: NextRequest) {
  try {
    // 1. Verify Vercel Cron authorization header
    const authHeader = request.headers.get('authorization');
    
    // In production, strictly validate Vercel's Cron Secret
    if (
      process.env.NODE_ENV === 'production' &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Query and update matching overdue invoices
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const { data: updatedInvoices, error } = await supabaseAdmin
      .from('invoices')
      .update({ status: 'overdue' })
      .lt('due_date', today)
      .eq('status', 'sent')
      .select();

    if (error) {
      console.error('Failed to run overdue cron update:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedInvoices?.length || 0,
      updatedInvoices: updatedInvoices || [],
    });
  } catch (error) {
    console.error('Error in cron/mark-overdue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
