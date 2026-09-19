import { promises as fs } from "fs";
import path from "path";

export type GasFileKind = "manifest" | "server" | "client" | "docs";

export type GasFileMeta = {
  path: string;
  name: string;
  order: number;
  kind: GasFileKind;
  title: string;
  description: string;
};

export type GasFileEntry = GasFileMeta & {
  size: number;
  lines: number;
};

/** Seluruh file proyek Google Apps Script (nama = nama file di editor Apps Script) */
export const GAS_FILES: GasFileMeta[] = [
  {
    path: "appsscript.json",
    name: "appsscript.json",
    order: 0,
    kind: "manifest",
    title: "Manifest Proyek",
    description:
      "Konfigurasi runtime V8, scope OAuth (Sheets, Gmail, Blogger), advanced service Blogger v3, dan hak akses Web App.",
  },
  {
    path: "Config.gs",
    name: "Config.gs",
    order: 1,
    kind: "server",
    title: "Konfigurasi Aplikasi",
    description:
      "Satu-satunya file yang wajib diedit: SPREADSHEET_ID, BLOG_ID, BLOG_URL, APP_URL, kuota, kontak, serta nama sheet & skema kolom.",
  },
  {
    path: "Utils.gs",
    name: "Utils.gs",
    order: 2,
    kind: "server",
    title: "Utilitas",
    description:
      "Helper format tanggal Indonesia, escape HTML, slug, validasi email, generator ID unik (LockService) dan token QR.",
  },
  {
    path: "SheetService.gs",
    name: "SheetService.gs",
    order: 3,
    kind: "server",
    title: "Layer Database (Google Sheets)",
    description:
      "Google Sheets sebagai database: setupDatabase(), readAll_(), insertRow_(), updateRow_(), findOne_(), findAll_().",
  },
  {
    path: "Models.gs",
    name: "Models.gs",
    order: 4,
    kind: "server",
    title: "Model Data & Check-in",
    description:
      "CRUD event/peserta/pendaftaran, validasi kuota & duplikasi email, checkIn() dengan validasi otomatis + log scan.",
  },
  {
    path: "QrService.gs",
    name: "QrService.gs",
    order: 5,
    kind: "server",
    title: "Generator QR Code",
    description:
      "Membangun payload QR (tautan check-in atau kode), parser payload apa pun bentuknya, URL gambar QR, dan blob untuk email.",
  },
  {
    path: "TicketService.gs",
    name: "TicketService.gs",
    order: 6,
    kind: "server",
    title: "E-Ticket & Email",
    description:
      "Membangun HTML e-ticket (aman untuk Gmail), kirim email dengan QR inline (cid), kirim massal per event, dan pengingat.",
  },
  {
    path: "BloggerService.gs",
    name: "BloggerService.gs",
    order: 7,
    kind: "server",
    title: "Integrasi Blogger",
    description:
      "Publish/update/hapus postingan event ke Blogger, rekap kuota & sisa kursi, alur pendaftaran, plus widget sidebar blog.",
  },
  {
    path: "WebAppApi.gs",
    name: "WebAppApi.gs",
    order: 8,
    kind: "server",
    title: "API untuk Browser",
    description:
      "Fungsi yang dipanggil google.script.run: apiGetHome, apiGetEvents, apiGetEvent, apiRegister, apiGetTicket, apiCheckIn, apiGetDashboard.",
  },
  {
    path: "Router.gs",
    name: "Router.gs",
    order: 9,
    kind: "server",
    title: "Router Web App & JSON API",
    description:
      "doGet() untuk merender SPA + deep link dari QR (?page=checkin&code=…) dan doPost() sebagai REST API untuk gadget Blogger / scanner eksternal.",
  },
  {
    path: "AdminMenu.gs",
    name: "AdminMenu.gs",
    order: 10,
    kind: "server",
    title: "Menu Admin & Data Contoh",
    description:
      "Menu Spreadsheet (SIMANEV PSSDM), setup database, seed 3 event contoh, kirim e-ticket/pengingat, dan buat sheet laporan rekap.",
  },
  {
    path: "Index.html",
    name: "Index.html",
    order: 11,
    kind: "client",
    title: "Shell Aplikasi (SPA)",
    description:
      "Kerangka HTML: header sticky + menu mobile, konten dinamis, footer, bottom navigation khusus HP, dan toast notifikasi.",
  },
  {
    path: "_Styles.html",
    name: "_Styles.html",
    order: 12,
    kind: "client",
    title: "Stylesheet Responsif",
    description:
      "CSS mobile-first tanpa framework: kartu event, e-ticket, frame scan animasi, tabel scroll horizontal, bottom nav, aman untuk area layar ponsel.",
  },
  {
    path: "_Scripts.html",
    name: "_Scripts.html",
    order: 13,
    kind: "client",
    title: "Logika Klien",
    description:
      "Router hash, 7 halaman, scan kamera dengan BarcodeDetector + beep, hasil check-in, dashboard bertab, alat admin, dan cetak e-ticket.",
  },
  {
    path: "README.md",
    name: "README.md",
    order: 14,
    kind: "docs",
    title: "Panduan Deploy",
    description:
      "Langkah deploy lengkap, struktur file, tabel JSON API, alur validasi check-in, dan catatan kuota/keamanan.",
  },
];

const GAS_DIR = path.join(process.cwd(), "gas");

export function isGasFile(relPath: string): boolean {
  return GAS_FILES.some((f) => f.path === relPath);
}

/** Baca isi satu file GAS secara aman (hanya file yang terdaftar) */
export async function readGasFile(relPath: string): Promise<string> {
  if (!isGasFile(relPath)) throw new Error("File tidak dikenal");
  const safe = path.basename(relPath);
  return fs.readFile(path.join(GAS_DIR, safe), "utf8");
}

/** Metadata + statistik seluruh file */
export async function listGasFiles(): Promise<GasFileEntry[]> {
  const entries = await Promise.all(
    GAS_FILES.map(async (meta) => {
      try {
        const content = await readGasFile(meta.path);
        return {
          ...meta,
          size: Buffer.byteLength(content, "utf8"),
          lines: content.split("\n").length,
        };
      } catch {
        return { ...meta, size: 0, lines: 0 };
      }
    })
  );
  return entries;
}

export async function gasStats() {
  const files = await listGasFiles();
  return {
    files: files.length,
    server: files.filter((f) => f.kind === "server").length,
    client: files.filter((f) => f.kind === "client").length,
    lines: files.reduce((sum, f) => sum + f.lines, 0),
  };
}
