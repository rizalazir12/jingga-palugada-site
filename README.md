# Setup situs Jingga — Palugada

Status: kode dasar sudah jadi (frontend + fungsi cache Notion), tapi **belum bisa jalan** sampai lu isi beberapa hal di bawah. Ini bukan "tinggal pencet deploy" — ada beberapa akun & konfigurasi yang cuma lu yang bisa buat.

## 1. Ganti nomor WA & link booking (wajib, paling gampang)

Buka `index.html`, cari bagian `<script>` di paling bawah, ganti:
- `WA_NUMBER` — nomor WA lu, format `62xxxxxxxxxx` (tanpa `+` atau spasi)
- `CAL_LINK` — link Cal.com lu (isi setelah langkah 3)

## 2. Setup Notion sebagai sumber data jasa

1. Bikin database baru di Notion dengan kolom (case-sensitive, harus persis ini):
   - `Nama` (Title)
   - `Kategori` (Select) — isi opsinya: Rumah/Kebun/Kolam, Hewan Peliharaan, Errand & Titip, Teknis & Kreatif, Teman Aktivitas
   - `Harga` (Text)
   - `Deskripsi` (Text)
   - `Radius` (Text)
   - `Foto` (Files & media)
2. Buka [notion.so/my-integrations](https://notion.so/my-integrations), bikin integration baru, salin **Internal Integration Token**-nya.
3. Di database Notion tadi, klik `...` → `Connections` → hubungkan ke integration yang baru dibuat.
4. Salin **Database ID** dari URL database Notion (bagian 32 karakter setelah nama workspace, sebelum tanda `?`).

*Catatan: struktur field ini masih versi dasar (5 kolom). Field spesifik per kategori — kayak "jenis hewan" atau "jumlah revisi" yang kita rancang sebelumnya — bisa ditambah belakangan sebagai kolom baru begitu kebutuhannya makin jelas. Jangan dibikin rumit dari awal.*

## 3. Setup Cal.com (booking)

1. Daftar gratis di [cal.com](https://cal.com).
2. Bikin event type per kategori jasa fisik (misal "Bersih Rumah — 2 jam"), dan satu event type "Request Quote / Deadline" buat jasa deliverable.
3. Salin link booking utama lu (`cal.com/username`), tempel ke `CAL_LINK` di `index.html`.
4. **Cek ulang dulu** [cal.com/pricing](https://cal.com/pricing) sebelum commit — detail free plan bisa berubah sejak terakhir gw cek.

## 4. Deploy ke Netlify

1. Push folder ini ke repo GitHub baru.
2. Di [netlify.com](https://netlify.com), pilih "Add new site" → "Import from GitHub" → pilih repo ini.
3. Di **Site settings → Environment variables**, tambahin:
   - `NOTION_TOKEN` — token dari langkah 2.2
   - `NOTION_DATABASE_ID` — ID dari langkah 2.4
4. Deploy. Netlify otomatis install dependency dari `package.json` dan jalanin function di `netlify/functions/get-services.js`.

## 5. Sambungin frontend ke data Notion (belum otomatis)

`index.html` saat ini masih tampilin **data statis/placeholder** (kategori, galeri kosong, 1 testimoni contoh) — belum fetch dari `get-services.js`. Ini keputusan sengaja: biar lu bisa lihat & approve dulu tampilannya sebelum gw sambungin ke data asli, supaya gak bolak-balik ubah struktur kalau desainnya masih mau direvisi.

Begitu tampilan ini oke, langkah selanjutnya adalah nambahin `fetch('/.netlify/functions/get-services')` di `index.html` buat render kategori & harga dari Notion secara dinamis.

## Yang masih perlu diverifikasi sebelum full live

- Detail final Cal.com free plan (poin 3.4)
- Kemungkinan Notion API rate limit berubah per tier workspace
- Batas request free tier Netlify Functions untuk traffic yang diharapkan
