import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET /api/orders?q=INVOICE_OR_USERNAME -> Real-Time Buyer Order Tracking
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().replace(/^@/, '');

  let query = supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (q) {
    query = query.or(`invoice_number.ilike.%${q}%,roblox_username.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, transactions: data || [] });
}

// POST /api/orders -> Real-Time Order Insert / Status Update (Syncs to Supabase SQL & Google Sheets Webhook)
export async function POST(req: Request) {
  const tx = await req.json();

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await supabase.from('transactions').upsert({
      invoice_number: tx.invoice,
      roblox_username: tx.username,
      roblox_user_id: Number(tx.robloxUserId) || 0,
      robux_amount: Number(tx.robux) || 0,
      amount_paid_idr: Number(tx.price) || 0,
      payment_method: tx.paymentMethod || 'QRIS Dinamis',
      buyer_whatsapp: tx.whatsapp || '',
      payment_status: tx.paymentStatus || 'UNPAID',
      order_status: tx.orderStatus || 'PENDING'
    }, { onConflict: 'invoice_number' });
  }

  if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
    await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', transaction: tx })
    });
  }

  return NextResponse.json({ ok: true, invoice: tx.invoice, status: tx.orderStatus });
}
