import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { username, robloxUserId, productCode, paymentMethod, whatsapp } = await req.json();

    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .eq('code', productCode)
      .eq('is_active', true)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: 'Produk tidak valid' }, { status: 400 });
    }

    const invoiceNumber = `ROE-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;

    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        invoice_number: invoiceNumber,
        roblox_username: username,
        roblox_user_id: robloxUserId,
        product_code: product.code,
        robux_amount: product.robux_amount,
        amount_paid_idr: product.price_idr,
        payment_method: paymentMethod,
        buyer_whatsapp: whatsapp || null,
        payment_status: 'UNPAID',
        order_status: 'PENDING'
      })
      .select('*')
      .single();

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    const merchantCode = process.env.TRIPAY_MERCHANT_CODE || '';
    const privateKey = process.env.TRIPAY_PRIVATE_KEY || '';
    const signature = crypto
      .createHmac('sha256', privateKey)
      .update(merchantCode + invoiceNumber + product.price_idr)
      .digest('hex');

    return NextResponse.json({
      success: true,
      invoiceNumber: tx.invoice_number,
      amountIdr: tx.amount_paid_idr,
      robuxAmount: tx.robux_amount,
      paymentSignature: signature
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
