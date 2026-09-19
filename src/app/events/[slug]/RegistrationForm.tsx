"use client";
import { useState } from "react";
import { UserPlus, CheckCircle2, ShieldCheck } from "lucide-react";

export default function RegistrationForm({ eventId }: { eventId: number }) {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", organization: "", position: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [regId, setRegId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTicket(data.ticketNumber);
        setQr(data.qrCode);
        setRegId(data.registration?.id || null);
      } else {
        alert(data.error || "Gagal mendaftar");
      }
    } catch (err) {
      alert("Terjadi kesalahan saat mendaftar");
    } finally {
      setLoading(false);
    }
  };

  if (success && ticket) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md shadow-emerald-100">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-extrabold text-emerald-900 mb-1">Pendaftaran Berhasil!</h3>
        <p className="text-sm text-emerald-800 mb-2">E-ticket Anda siap.</p>
        <div className="rounded-xl bg-white border border-emerald-100 p-3 mb-4 shadow-sm">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No. Tiket</p>
          <p className="font-extrabold text-emerald-900 text-lg tracking-wide">{ticket}</p>
        </div>
        <a href={regId ? `/e-ticket?id=${regId}` : `/e-ticket?qr=${qr}`} className="inline-block w-full rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 text-white px-4 py-3 font-extrabold shadow-lg shadow-teal-700/20 hover:shadow-xl hover:scale-[1.02] transition-all">
          Lihat E-Ticket
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="block text-xs font-extrabold text-slate-700 mb-1">Nama Lengkap</label>
        <input required id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="Andi Wijaya" />
      </div>
      <div>
        <label htmlFor="email" className="block text-xs font-extrabold text-slate-700 mb-1">Email</label>
        <input required type="email" id="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="andi@contoh.go.id" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-xs font-extrabold text-slate-700 mb-1">Nomor Telepon</label>
        <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="+62812345678" />
      </div>
      <div>
        <label htmlFor="organization" className="block text-xs font-extrabold text-slate-700 mb-1">Organisasi / Instansi</label>
        <input id="organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="Kementerian Kelautan" />
      </div>
      <div>
        <label htmlFor="position" className="block text-xs font-extrabold text-slate-700 mb-1">Jabatan</label>
        <input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all" placeholder="Kasubdit" />
      </div>
      <div>
        <label htmlFor="address" className="block text-xs font-extrabold text-slate-700 mb-1">Alamat</label>
        <textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none" placeholder="Jl. Medan Merdeka" />
      </div>
      <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-3.5 font-extrabold shadow-lg shadow-teal-700/20 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-60">
        {loading ? (<span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<><UserPlus className="h-5 w-5" /> Daftar Sekarang</>)}
      </button>
      <p className="text-[10px] text-slate-400 text-center font-medium flex items-center justify-center gap-1"><ShieldCheck className="h-3 w-3" /> Data peserta dijamin aman dan tidak dibagikan.</p>
    </form>
  );
}
