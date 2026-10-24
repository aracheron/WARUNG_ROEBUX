export async function executeRobuxAutoSend(params: {
  invoiceNumber: string;
  robloxUserId: number;
  robloxUsername: string;
  robuxAmount: number;
}) {
  const groupId = process.env.ROBLOX_GROUP_ID;
  const cookie = process.env.ROBLOX_SENDER_COOKIE;

  if (!cookie || !groupId) {
    throw new Error('ROBLOX_SENDER_COOKIE atau ROBLOX_GROUP_ID belum diisi di file .env');
  }

  // 1. Ambil X-CSRF-TOKEN dari Roblox Auth API
  const csrfRes = await fetch('https://auth.roblox.com/v2/logout', {
    method: 'POST',
    headers: {
      Cookie: `.ROBLOSECURITY=${cookie}`
    }
  });
  const csrfToken = csrfRes.headers.get('x-csrf-token');
  if (!csrfToken) {
    throw new Error('Gagal mendapatkan X-CSRF-TOKEN dari Roblox (Cek validitas Cookie)');
  }

  // 2. Eksekusi Send Robux otomatis
  const payoutRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `.ROBLOSECURITY=${cookie}`,
      'X-CSRF-TOKEN': csrfToken
    },
    body: JSON.stringify({
      PayoutType: 'FixedAmount',
      Recipients: [
        {
          recipientId: params.robloxUserId,
          recipientType: 'User',
          amount: params.robuxAmount
        }
      ]
    })
  });

  const payoutJson = await payoutRes.json();
  if (!payoutRes.ok) {
    throw new Error(`Roblox Payout Error: ${JSON.stringify(payoutJson)}`);
  }

  return {
    success: true,
    method: 'ROBLOX_GROUP_SEND',
    robuxSent: params.robuxAmount,
    recipientId: params.robloxUserId,
    rawResponse: payoutJson
  };
}
