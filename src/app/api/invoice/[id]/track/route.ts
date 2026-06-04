import { NextRequest, NextResponse } from 'next/server';
import { trackInvoiceView } from '@/lib/email/track';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoiceId = params.id;

  // 1x1 transparent GIF Base64
  const transparentGif = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  const response = new NextResponse(transparentGif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });

  // Track the invoice view asynchronously without blocking the image delivery
  if (invoiceId) {
    trackInvoiceView(invoiceId).catch((err) => {
      console.error('Background invoice view tracking failed:', err);
    });
  }

  return response;
}
