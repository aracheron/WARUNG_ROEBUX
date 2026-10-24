# ROEBUX STORE — Full-Stack Auto-Order Starter Kit

Paket ini berisi kode backend, skema database PostgreSQL (Supabase), integrasi Roblox API asli, webhook Payment Gateway, dan sistem Auto-Order untuk **ROEBUX STORE (Robux Via Send · Proses ± 1 Menit)**.

## Daftar File
1. `supabase/schema.sql` — Skema tabel `products` (sudah berisi 20 harga resmi ROEBUX STORE) & `transactions`.
2. `app/api/roblox/verify/route.ts` — Endpoint untuk validasi username & ambil foto avatar asli dari API Roblox (`users.roblox.com`).
3. `app/api/checkout/route.ts` — Endpoint pembuatan invoice transaksi & koneksi QRIS Payment Gateway.
4. `app/api/webhook/payment/route.ts` — Endpoint penerima callback pembayaran lunas yang otomatis menjalankan Auto-Order.
5. `lib/robuxAutoSender.ts` — Worker pengirim Robux otomatis.
6. `middleware.ts` — Proteksi halaman `/admin` agar hanya pemilik ROEBUX STORE yang bisa membuka Rekap Transaksi.
7. `roebux_store_preview.html` — File antarmuka lengkap ROEBUX STORE.
