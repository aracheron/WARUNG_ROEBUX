/**
 * Generator QRIS Dinamis untuk ROEBUX STORE (Merchant: ROEBUX - TELECOM, NMID: ID1025464550819, Terminal: A01, DANA: 93600014)
 */

export const ROEBUX_STATIC_QRIS =
  '00020101021126650013ID.CO.BCA.WWW011893600014000406775102150008850040677510303UMI51440014ID.CO.QRIS.WWW0215ID10254645508190303UMI5204481453033605802ID5906ROEBUX6006BEKASI61051713562070703A0163040085';

export function convertStaticToDynamicQris(
  amountIdr: number,
  staticQris: string = ROEBUX_STATIC_QRIS
): { fullString: string; crcHex: string } {
  const cleanAmount = Math.max(1, Math.floor(Number(amountIdr) || 0));
  const withoutCrc = staticQris.slice(0, -4).replace('010211', '010212');
  const amountStr = String(cleanAmount);
  const tag54 = '54' + String(amountStr.length).padStart(2, '0') + amountStr;
  const splitIdx = withoutCrc.indexOf('5802ID');
  const payloadToHash = withoutCrc.slice(0, splitIdx) + tag54 + withoutCrc.slice(splitIdx);

  let crc = 0xFFFF;
  for (let i = 0; i < payloadToHash.length; i++) {
    crc ^= payloadToHash.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  return { fullString: payloadToHash + crcHex, crcHex };
}
