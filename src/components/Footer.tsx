import { Waves, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-slate-300 mt-auto">
      <div className="mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 text-white font-extrabold text-xl mb-4">
              <Waves className="h-7 w-7 text-amber-400" />
              <span>PSSDM Kelautan & Perikanan</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Pusat Standardisasi dan Sertifikasi Sumber Daya Manusia Kelautan dan Perikanan. Meningkatkan kualitas SDM melalui sertifikasi kompetensi dan standar nasional.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Layanan</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-amber-300 transition-colors">Proyek Google Apps Script</a></li>
              <li><a href="/events" className="hover:text-amber-300 transition-colors">Demo: Daftar Event</a></li>
              <li><a href="/scan" className="hover:text-amber-300 transition-colors">Demo: Scan QR Check-in</a></li>
              <li><a href="/admin" className="hover:text-amber-300 transition-colors">Demo: Dashboard Laporan</a></li>
              <li><a href="/api/gas/download" className="hover:text-amber-300 transition-colors">Unduh Kode (.zip)</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Kontak</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-400" /> Jl. Medan Merdeka Timur No. 16, Jakarta</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-400" /> (021) 351-2345</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-400" /> info@pssdm-kelautan.go.id</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© {new Date().getFullYear()} Pusat Standardisasi dan Sertifikasi SDM Kelautan dan Perikanan.</span>
          <span>Dibangun dengan Google Apps Script + Google Sheets + Blogger + Gmail</span>
        </div>
      </div>
    </footer>
  );
}
