/**
 * Notifikasi & Konfirmasi Pembayaran WhatsApp Otomatis ROEBUX STORE
 * Nomor WhatsApp Admin Utama: 6289606457010
 */

export const ADMIN_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_ADMIN_WA || '6289606457010';

export async function sendWhatsAppConfirmation(params: {
  invoiceNumber: string;
  robloxUsername: string;
  robloxUserId: number | string;
  robuxAmount: number;
  amountIdr: number;
  buyerWhatsapp?: string;
}) {
  const message = [
    '*✅ KONFIRMASI PEMBAYARAN ROEBUX STORE*',
    `No. Invoice : ${params.invoiceNumber}`,
    `Username    : @${params.robloxUsername} (ID: ${params.robloxUserId})`,
    `Nominal     : ${params.robuxAmount} Robux (Utuh)`,
    `Total Bayar : Rp ${params.amountIdr.toLocaleString('id-ID')} (QRIS Dinamis - LUNAS)`,
    `Status      : Robux telah dikirim via Auto-Order (± 1 Menit)!`,
    '',
    'Terima kasih sudah top up di ROEBUX STORE!'
  ].join('\n');

  const targets = [params.buyerWhatsapp, ADMIN_WHATSAPP_NUMBER].filter(Boolean).join(',');
  if (process.env.FONNTE_API_TOKEN && targets) {
    await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: process.env.FONNTE_API_TOKEN },
      body: new URLSearchParams({ target: targets, message })
    });
  }

  const waApiUrl = `https://api.whatsapp.com/send?phone=${ADMIN_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
  const waClickUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  return { waApiUrl, waClickUrl, message };
}
