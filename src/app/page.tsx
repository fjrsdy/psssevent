import Link from "next/link";
import {
  ArrowRight,
  FileCode2,
  Server,
  Database,
  Globe,
  Mail,
  QrCode,
  ScanLine,
  BarChart3,
  Users,
  CheckCircle2,
  Smartphone,
  Rocket,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import CodeBrowser, { type FileItem } from "@/components/CodeBrowser";
import { listGasFiles, readGasFile, gasStats } from "@/lib/gas-files";
import { db } from "@/db";
import { events } from "@/db/schema";
import { count } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    Icon: Globe,
    title: "Portal & Informasi Event di Blogger",
    desc: "BloggerService.gs membuat/memperbarui postingan Blogger otomatis: jadwal, kuota, sisa kursi, alur pendaftaran, dan tombol DAFTAR yang menuju Web App.",
  },
  {
    Icon: Users,
    title: "Pendaftaran Peserta",
    desc: "Formulir online dengan validasi email, cek kuota, dan anti-duplikasi. Data tersimpan di Google Sheets lewat SheetService.gs.",
  },
  {
    Icon: Database,
    title: "Pengelolaan Data Event & Peserta",
    desc: "Google Sheets sebagai database + menu admin 'SIMANEV PSSDM' (AdminMenu.gs) untuk setup, data contoh, kirim tiket, dan laporan.",
  },
  {
    Icon: QrCode,
    title: "Generate QR Code Otomatis",
    desc: "QrService.gs membuat kode unik per pendaftaran (PSSDM-XXXXXXXX) yang di-encode menjadi tautan check-in siap dipindai kamera HP.",
  },
  {
    Icon: Mail,
    title: "E-Ticket Peserta",
    desc: "TicketService.gs merender e-ticket HTML (aman untuk Gmail) dengan QR inline, lalu mengirimkannya otomatis via MailApp.",
  },
  {
    Icon: ScanLine,
    title: "Scan QR untuk Check-in",
    desc: "Kamera HP memakai BarcodeDetector + beep, atau scanner USB. Semua percobaan scan tercatat pada sheet CheckinLog.",
  },
  {
    Icon: CheckCircle2,
    title: "Validasi Kehadiran Otomatis",
    desc: "checkIn() menolak tiket tak dikenal/dibatalkan, memblokir check-in terlalu awal, dan mendeteksi duplikat beserta jam kedatangan.",
  },
  {
    Icon: BarChart3,
    title: "Dashboard & Laporan Event",
    desc: "Tab Rekap, Data Peserta, Riwayat Scan, dan Alat Admin — plus createReportSheet() untuk rekap kehadiran di Spreadsheet.",
  },
  {
    Icon: Smartphone,
    title: "Responsif Web & Mobile",
    desc: "CSS mobile-first: header sticky, bottom navigation, tabel scroll horizontal, dan safe-area untuk layar berponi.",
  },
];

const ARCHITECTURE = [
  { Icon: Globe, title: "Blogger", desc: "Portal publik & informasi event (Blogger API v3)" },
  { Icon: FileCode2, title: "Apps Script", desc: "Web App HtmlService + JSON API (doGet/doPost)" },
  { Icon: Database, title: "Google Sheets", desc: "Database Events, Participants, Registrations, CheckinLog" },
  { Icon: Mail, title: "Gmail (MailApp)", desc: "Kirim e-ticket berisi QR Code inline" },
];

const DEPLOY_STEPS = [
  {
    title: "Buat proyek & salin file",
    body: "Buka script.google.com → New project. Buat file sesuai daftar di bawah (nama harus sama persis, termasuk _Styles dan _Scripts), lalu tempel isinya. Ganti appsscript.json dengan manifest pada halaman ini.",
  },
  {
    title: "Aktifkan layanan Blogger",
    body: "Di editor: Services (+) → Blogger API v3 → identifier Blogger → Add. Ini dipakai untuk mempublikasikan event ke blog.",
  },
  {
    title: "Jalankan setupDatabase()",
    body: "Pilih fungsi setupDatabase → Run → Review permissions → Allow. Spreadsheet database dibuat otomatis; salin ID-nya ke APP_CONFIG.SPREADSHEET_ID pada Config.gs, lalu jalankan seedSampleData().",
  },
  {
    title: "Deploy sebagai Web App",
    body: "Deploy → New deployment → Web app. Execute as: Me, Who has access: Anyone. Salin URL …/exec ke APP_CONFIG.APP_URL, lalu deploy versi baru.",
  },
  {
    title: "Hubungkan Blogger",
    body: "Isi BLOG_ID dan BLOG_URL, jalankan syncEventsToBlogger(). Setiap event menjadi postingan blog dengan tombol pendaftaran menuju Web App.",
  },
  {
    title: "Operasional harian",
    body: "Panitia membuka ?page=scan di HP untuk check-in; peserta membuka ?page=ticket; pimpinan membuka ?page=dashboard untuk laporan.",
  },
];

const API_ROWS = [
  ["publicEvents", "—", "Daftar event (widget Blogger)"],
  ["event", "slug", "Detail event + sisa kuota"],
  ["register", "eventId, fullName, email, …", "Pendaftaran + generate tiket & QR"],
  ["ticket", "code", "Ambil e-ticket (HTML + data)"],
  ["lookup", "code", "Pratinjau tiket tanpa check-in"],
  ["checkin", "code, scanner", "Check-in + validasi kehadiran"],
  ["dashboard", "—", "Statistik & laporan"],
  ["participants", "eventId", "Daftar peserta satu event"],
  ["health", "—", "Cek status aplikasi"],
];

export default async function HomePage() {
  const [files, stats, sheetStats] = await Promise.all([
    listGasFiles(),
    gasStats(),
    db.select({ value: count() }).from(events).catch(() => [{ value: 0 }]),
  ]);

  const initialPath = "Config.gs";
  const initialContent = await readGasFile(initialPath).catch(() => "// File tidak ditemukan.");
  const demoEventCount = sheetStats[0]?.value ?? 0;

  return (
    <div className="min-h-screen">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-blue-950 to-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-25">
          <svg className="h-full w-full" viewBox="0 0 1440 620" preserveAspectRatio="none">
            <path fill="#38bdf8" d="M0,140 C300,240 600,90 900,190 C1200,290 1400,90 1440,240 L1440,620 L0,620 Z" />
            <path fill="#f59e0b" fillOpacity="0.3" d="M0,340 C400,190 800,390 1200,240 C1400,150 1440,290 1440,440 L1440,620 L0,620 Z" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
            <Server className="h-3.5 w-3.5" /> Google Apps Script
          </span>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Aplikasi Manajemen Event —{" "}
            <span className="text-amber-300">Apps Script + Blogger</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-blue-100/90 md:text-lg">
            Seluruh sistem sudah dikonversi menjadi proyek Google Apps Script untuk
            Pusat Standardisasi dan Sertifikasi SDM Kelautan dan Perikanan: portal
            event di Blogger, pendaftaran peserta, QR Code &amp; e-ticket otomatis,
            scan check-in, validasi kehadiran, serta dashboard laporan — tanpa
            server dan tanpa biaya hosting.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { v: stats.files, l: "File kode" },
              { v: stats.server, l: "Modul .gs" },
              { v: stats.lines.toLocaleString("id-ID"), l: "Baris kode" },
              { v: "Rp 0", l: "Biaya server" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                <p className="text-xl font-extrabold text-amber-300 md:text-2xl">{s.v}</p>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-blue-100/70">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/api/gas/download"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-extrabold text-blue-950 shadow-lg shadow-amber-400/30 transition hover:bg-amber-300"
            >
              <Rocket className="h-5 w-5" /> Unduh Proyek (.zip)
            </a>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <PlayCircle className="h-5 w-5" /> Coba Demo UI
            </Link>
          </div>
        </div>
      </section>

      {/* ======================== ARSITEKTUR ========================= */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
          Arsitektur Aplikasi
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
          Empat layanan Google digabung menjadi satu sistem terpadu. Semua berjalan
          di akun instansi, peserta tidak perlu login.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {ARCHITECTURE.map((a, i) => (
            <div key={a.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50">
              <span className="absolute right-4 top-4 font-mono text-xs font-black text-slate-200">
                0{i + 1}
              </span>
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 text-white shadow-lg">
                <a.Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-950">{a.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 md:p-7">
          <p className="m-0 font-mono text-[11.5px] leading-relaxed text-slate-700 md:text-[13px]">
            <span className="text-slate-400">PESERTA:</span> Blogger / Web App → formulir pendaftaran →{" "}
            <span className="font-bold text-teal-700">QR + e-ticket otomatis</span> → email Gmail
            <br />
            <span className="text-slate-400">PETUGAS:</span> ?page=scan → kamera HP →{" "}
            <span className="font-bold text-teal-700">checkIn()</span> → status{" "}
            <span className="font-bold text-emerald-700">checked_in</span> + timestamp →{" "}
            <span className="font-bold text-blue-700">CheckinLog</span> → dashboard real-time
          </p>
        </div>
      </section>

      {/* ========================== FITUR ============================ */}
      <section className="bg-white/70 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
            9 Fitur Utama
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
            Setiap fitur menunjuk langsung ke file Apps Script yang
            mengimplementasikannya.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 text-white shadow-lg">
                  <f.Icon className="h-5 w-5" />
                </div>
                <h3 className="text-[15px] font-extrabold leading-snug text-slate-950">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= BROWSER KODE ======================== */}
      <section id="kode" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 md:text-3xl">
              Kode Sumber Apps Script
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
              {stats.files} file, {stats.lines.toLocaleString("id-ID")} baris kode siap
              disalin ke editor Apps Script. Klik file untuk membaca, salin per file,
              atau unduh semuanya sebagai ZIP.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-extrabold text-teal-700 hover:underline"
          >
            Lihat pratinjau antarmuka <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <CodeBrowser files={files as FileItem[]} initialPath={initialPath} initialContent={initialContent} />
      </section>

      {/* ===================== PANDUAN DEPLOY ======================== */}
      <section id="panduan" className="bg-gradient-to-br from-teal-900 via-blue-950 to-slate-950 py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="mb-8">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
              <BookOpen className="h-3.5 w-3.5" /> Panduan
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              Enam Langkah Deploy
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100/80 md:text-base">
              Estimasi ±10 menit. Detail lengkap tersedia pada{" "}
              <span className="font-mono font-bold text-amber-300">README.md</span> di
              dalam paket ZIP.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {DEPLOY_STEPS.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-sm font-black text-blue-950">
                  {i + 1}
                </div>
                <h3 className="text-[15px] font-extrabold text-white">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-blue-100/75">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="border-b border-white/10 px-5 py-4">
              <h3 className="text-base font-extrabold text-white">JSON API — doPost()</h3>
              <p className="mt-1 text-[12.5px] text-blue-100/70">
                Dipakai gadget Blogger, scanner eksternal, atau integrasi lain.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[12.5px]">
                <thead className="bg-white/5 text-[10.5px] font-extrabold uppercase tracking-wider text-blue-100/70">
                  <tr>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Parameter</th>
                    <th className="px-5 py-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {API_ROWS.map((r) => (
                    <tr key={r[0]}>
                      <td className="px-5 py-2.5 font-mono font-bold text-amber-300">{r[0]}</td>
                      <td className="px-5 py-2.5 font-mono text-blue-100/80">{r[1]}</td>
                      <td className="px-5 py-2.5 text-blue-100/80">{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CATATAN & DEMO ======================== */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 lg:col-span-2">
            <h2 className="text-xl font-extrabold text-slate-950">Catatan Penting</h2>
            <ul className="mt-4 space-y-3">
              {[
                "Kuota email Gmail gratis ±100/hari (cek dengan MailApp.getRemainingDailyQuota()).",
                "Gambar QR dibuat oleh api.qrserver.com — perlu internet. Ganti qrImageUrl() di QrService.gs untuk lingkungan offline.",
                "Deploy dengan Execute as: Me agar peserta tidak perlu login; data tetap di Spreadsheet instansi.",
                "Untuk produksi, tambahkan token sederhana pada parameter URL untuk membatasi akses dashboard.",
                "Seluruh komponen gratis: Apps Script, Sheets, Blogger, dan Gmail — tanpa server maupun hosting.",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-7 text-blue-950 shadow-xl">
            <h2 className="text-xl font-extrabold">Pratinjau Antarmuka</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-blue-950/80">
              Versi web dari aplikasi ini ({demoEventCount} event contoh) tetap tersedia
              sebagai demonstrasi tampilan &amp; alur di ponsel maupun desktop.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                { href: "/events", label: "Portal & Daftar Event" },
                { href: "/register", label: "Pendaftaran Peserta" },
                { href: "/scan", label: "Scan QR Check-in" },
                { href: "/admin", label: "Dashboard & Laporan" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-xl bg-blue-950/90 px-4 py-3 text-[13px] font-extrabold text-white transition hover:bg-blue-950"
                >
                  {l.label} <ArrowRight className="h-4 w-4 text-amber-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
