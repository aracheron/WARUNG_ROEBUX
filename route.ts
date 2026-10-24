import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { executeRobuxAutoSend } from '../../../../lib/robuxAutoSender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const invoiceNumber = payload.merchant_ref || payload.order_id;
    const status = payload.status || payload.transaction_status;

    if (status === 'PAID' || status === 'settlement') {
      const { data: tx } = await supabase
        .from('transactions')
        .select('*')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (!tx || tx.order_status === 'SUCCESS') {
        return NextResponse.json({ message: 'Transaksi sudah diproses sebelumnya' });
      }

      await supabase
        .from('transactions')
        .update({ payment_status: 'PAID', order_status: 'PROCESSING' })
        .eq('invoice_number', invoiceNumber);

      try {
        const sendResult = await executeRobuxAutoSend({
          invoiceNumber: tx.invoice_number,
          robloxUserId: Number(tx.roblox_user_id),
          robloxUsername: tx.roblox_username,
          robuxAmount: Number(tx.robux_amount)
        });

        await supabase
          .from('transactions')
          .update({
            order_status: 'SUCCESS',
            auto_order_response: sendResult,
            completed_at: new Date().toISOString()
          })
          .eq('invoice_number', invoiceNumber);
      } catch (sendErr: any) {
        await supabase
          .from('transactions')
          .update({
            order_status: 'FAILED',
            auto_order_response: { error: sendErr.message }
          })
          .eq('invoice_number', invoiceNumber);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
