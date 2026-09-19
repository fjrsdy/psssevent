# SIMANEV PSSDM — Aplikasi Manajemen Event
### Google Apps Script + Google Sheets + Blogger + Gmail

Aplikasi manajemen event untuk **Pusat Standardisasi dan Sertifikasi Sumber Daya
Manusia Kelautan dan Perikanan (PSSDMKP)** — mulai dari pendaftaran peserta,
generate QR Code & e-ticket otomatis, sampai scan QR untuk check-in dan
validasi kehadiran otomatis.

---

## 1. Fitur

| # | Fitur | Implementasi |
|---|-------|--------------|
| 1 | Portal & informasi event di Blogger | `BloggerService.gs`, widget gadget Blogger |
| 2 | Pendaftaran peserta | `Index.html` + `apiRegister()` di `WebAppApi.gs` |
| 3 | Pengelolaan data event & peserta | Google Sheets via `SheetService.gs` + `Models.gs` + menu admin `AdminMenu.gs` |
| 4 | Generate QR Code otomatis | `QrService.gs` (QR unik per pendaftaran) |
| 5 | E-ticket peserta | `TicketService.gs` (HTML e-ticket + email otomatis) |
| 6 | Scan QR untuk check-in | `_Scripts.html` (kamera + BarcodeDetector) & input manual/scanner USB |
| 7 | Validasi kehadiran otomatis | `checkIn()` di `Models.gs` (anti-duplikat, cek jadwal, log) |
| 8 | Dashboard & laporan event | `_Scripts.html` tab Dashboard + `createReportSheet()` |
| 9 | Responsif web & mobile | Mobile-first CSS pada `_Styles.html` + bottom navigation |

## 2. Struktur File

```
appsscript.json        Manifest (scope OAuth + advanced service Blogger)
Config.gs           Konfigurasi utama (WAJIB diedit)
Utils.gs            Helper tanggal, string, validasi, ID unik
SheetService.gs     Layer database Google Sheets
Models.gs           Model Event/Participant/Registration + check-in
QrService.gs        Generator QR Code & payload check-in
TicketService.gs    E-ticket HTML + email + reminder
BloggerService.gs   Publikasi event ke Blogger + widget sidebar
WebAppApi.gs        API untuk browser (google.script.run)
Router.gs           doGet (Web App) + doPost (JSON API)
AdminMenu.gs        Menu Spreadsheet, data contoh, laporan
Index.html             Shell SPA (portal, event, daftar, tiket, scan, dashboard)
_Styles.html           CSS responsif
_Scripts.html          JavaScript klien
```

## 3. Cara Deploy (±10 menit)

### Langkah 1 — Buat proyek Apps Script
1. Buka <https://script.google.com> → **New project**.
2. Beri nama proyek: `SIMANEV PSSDM - Manajemen Event`.
3. Hapus isi `Code.gs`, lalu salin seluruh file di atas ke editor
   (ikon **+** → *Script* untuk file `.gs`, **+** → *HTML* untuk file `.html`).
   **Nama file harus sama persis**, termasuk `_Styles` dan `_Scripts`.
4. Ganti isi `appsscript.json` (aktifkan *Show manifest file* di Project Settings).

### Langkah 2 — Aktifkan layanan
1. Di editor: **Services (+)** → pilih **Blogger API v3** → identifier `Blogger` → Add.
2. (Opsional) Aktifkan *Google Sheets API* bila diminta saat authorize.

### Langkah 3 — Setup database
1. Pilih fungsi `setupDatabase` → **Run** → **Review permissions** → **Allow**.
2. Buka log eksekusi: akan muncul **Spreadsheet ID**.
3. Salin ID tersebut ke `APP_CONFIG.SPREADSHEET_ID` pada `Config.gs`.
4. Jalankan `seedSampleData` untuk mengisi 3 event contoh + peserta demo.

### Langkah 4 — Deploy Web App
1. **Deploy → New deployment → Select type: Web app**.
2. *Execute as*: **Me** (akun instansi) · *Who has access*: **Anyone**.
3. Klik **Deploy** lalu salin **Web app URL** (`.../exec`).
4. Tempel URL tersebut ke `APP_CONFIG.APP_URL` di `Config.gs`.
5. Deploy ulang (**Deploy → Manage deployments → Edit → New version**) agar
   konfigurasi baru aktif.

### Langkah 5 — Hubungkan Blogger
1. Di Blogger: **Setelan** → catat **Blog ID**.
2. Isi `APP_CONFIG.BLOG_ID` dan `APP_CONFIG.BLOG_URL`.
3. Jalankan `syncEventsToBlogger()` (atau menu Spreadsheet → SIMANEV PSSDM →
   *Publikasikan Semua Event ke Blogger*).
4. Setiap event otomatis menjadi postingan berisi jadwal, kuota, alur
   pendaftaran, dan tombol **DAFTAR SEKARANG** yang menuju Web App.
5. (Opsional) Jalankan `buildBloggerWidgetScript()` lalu tempel hasilnya ke
   gadget **HTML/JavaScript** pada sidebar Blogger untuk menampilkan daftar
   event terbaru.

### Langkah 6 — Operasional harian
- **Panitia/loket**: buka `APP_URL?page=scan` di HP → aktifkan kamera → scan QR.
- **Peserta**: buka link e-ticket dari email, atau `APP_URL?page=ticket` lalu
  masukkan nomor tiket.
- **Pimpinan**: buka `APP_URL?page=dashboard` untuk statistik & laporan, lalu
  klik *Buat Laporan* untuk membuat sheet rekap di Spreadsheet.

## 4. JSON API (doPost)

Semua endpoint dipanggil dengan `POST` ke `APP_URL` dengan body JSON
`{ "action": "...", ... }`.

| Action | Parameter | Keterangan |
|--------|-----------|------------|
| `publicEvents` | — | Daftar event (untuk widget Blogger) |
| `event` | `slug` | Detail event + sisa kuota |
| `register` | `eventId`, `fullName`, `email`, `phone`, `organization`, `position`, `address` | Pendaftaran + generate tiket/QR |
| `ticket` | `code` | Ambil e-ticket (HTML + data) |
| `lookup` | `code` | Pratinjau tiket tanpa check-in |
| `checkin` | `code`, `scanner` | Check-in + validasi kehadiran |
| `dashboard` | — | Statistik & laporan |
| `participants` | `eventId` | Daftar peserta satu event |
| `health` | — | Cek status aplikasi |

Contoh:

```bash
curl -X POST "https://script.google.com/macros/s/DEPLOYMENT_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"checkin","code":"PSSDM-AB12CD34","scanner":"Petugas 1"}'
```

## 5. Alur Check-in & Validasi

```
QR Code peserta  →  scan kamera / input manual
                →  parseQrPayload_()   (URL | pipa | kode langsung)
                →  getTicketBundle()   (cari tiket di Sheets)
                →  validasi:
                     • NOT_FOUND   → ditolak, dicatat di log
                     • CANCELLED   → ditolak, dicatat di log
                     • TOO_EARLY   → ditolak (check-in >24 jam sebelum acara)
                     • DUPLICATE   → diberi peringatan + jam check-in sebelumnya
                     • SUCCESS     → status = checked_in + timestamp + petugas
                →  log CheckinLog + dashboard terupdate otomatis
```

## 6. Catatan Penting

- **Kuota email**: akun Gmail gratis ±100 email/hari (Google Workspace lebih
  besar). Cek dengan `MailApp.getRemainingDailyQuota()`.
- **Gambar QR** dibuat oleh layanan `api.qrserver.com` (Butuh akses internet).
  Untuk lingkungan offline, ganti `qrImageUrl()` di `QrService.gs` dengan
  library QR lokal.
- **Keamanan**: Web App di-deploy *Execute as: Me* sehingga peserta tidak
  perlu login Google; semua data tetap berada di Spreadsheet instansi.
  Untuk produksi, batasi akses dashboard dengan menambahkan token sederhana
  pada parameter URL.
- **Harga**: seluruh komponen (Apps Script, Sheets, Blogger, Gmail) gratis —
  tidak memerlukan server maupun hosting.
