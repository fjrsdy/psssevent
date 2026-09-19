import Link from "next/link";
import { ArrowLeft, Users, CheckCircle2, Clock, TrendingUp, BarChart3, ListChecks, CalendarDays, MapPin, ScanLine } from "lucide-react";
import { db } from "@/db";
import { events, registrations, participants } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const eventList = await db.select().from(events).orderBy(desc(events.date));

  const reports = await Promise.all(
    eventList.map(async (evt) => {
      const regs = await db.select({ id: registrations.id, status: registrations.status }).from(registrations).where(eq(registrations.eventId, evt.id));
      const total = regs.length;
      const checkedIn = regs.filter((r) => r.status === "checked_in").length;
      return { event: evt, total, checkedIn, pending: total - checkedIn, rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0 };
    })
  );

  // Overall stats
  const allRegs = await db.select({ id: registrations.id, status: registrations.status }).from(registrations);
  const totalParticipants = await db.select({ count: count() }).from(participants);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-blue-950 to-teal-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Dashboard Event</h1>
          <p className="text-blue-100/90 text-lg max-w-2xl">Laporan real-time, statistik kehadiran, dan manajemen data peserta untuk semua event.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-8 -mt-10 relative z-10 pb-20">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-blue-700 text-white flex items-center justify-center shadow-lg"><CalendarDays className="h-5 w-5" /></div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Event</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-950">{eventList.length}</p>
            <p className="text-xs text-slate-500 font-medium">Total event aktif</p>
          </div>
          <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-lg"><Users className="h-5 w-5" /></div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Peserta</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-950">{totalParticipants[0]?.count || 0}</p>
            <p className="text-xs text-slate-500 font-medium">Terdaftar di sistem</p>
          </div>
          <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-lg"><TrendingUp className="h-5 w-5" /></div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Check-in</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-950">{allRegs.filter((r) => r.status === "checked_in").length}</p>
            <p className="text-xs text-slate-500 font-medium">Kehadiran tervalidasi</p>
          </div>
          <div className="rounded-2xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 text-white flex items-center justify-center shadow-lg"><Clock className="h-5 w-5" /></div>
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Menunggu</span>
            </div>
            <p className="text-3xl font-extrabold text-slate-950">{allRegs.filter((r) => r.status === "registered").length}</p>
            <p className="text-xs text-slate-500 font-medium">Belum check-in</p>
          </div>
        </div>

        {/* Reports Table */}
        <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden mb-10">
          <div className="px-6 md:px-8 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-teal-700" /> Laporan Event</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-xs">
                <tr>
                  <th className="text-left px-6 py-4">Event</th>
                  <th className="text-left px-6 py-4">Tanggal</th>
                  <th className="text-center px-6 py-4">Total</th>
                  <th className="text-center px-6 py-4">Check-in</th>
                  <th className="text-center px-6 py-4">Menunggu</th>
                  <th className="text-center px-6 py-4">Tingkat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.event.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <Link href={`/events/${r.event.slug}`} className="hover:text-teal-700 hover:underline">{r.event.title}</Link>
                      <p className="text-xs text-slate-400 font-medium">{r.event.venue}, {r.event.venueCity}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">{new Date(r.event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-900">{r.total}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-emerald-700">{r.checkedIn}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-amber-600">{r.pending}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">{r.rate}%</span>
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-blue-700" style={{ width: `${r.rate}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/scan" className="group rounded-3xl bg-gradient-to-br from-teal-900 to-blue-950 text-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <ScanLineIcon />
            <h3 className="text-xl font-extrabold mb-2">Scan QR</h3>
            <p className="text-blue-100/80 text-sm">Gunakan kamera atau input manual untuk check-in peserta.</p>
          </Link>
          <Link href="/events" className="group rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 text-blue-950 p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <ListChecksIcon />
            <h3 className="text-xl font-extrabold mb-2">Daftar Event</h3>
            <p className="text-blue-950/70 text-sm">Lihat semua event dan buka pendaftaran baru.</p>
          </Link>
          <Link href="/" className="group rounded-3xl bg-gradient-to-br from-rose-600 to-red-800 text-white p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <TrendingUpIcon />
            <h3 className="text-xl font-extrabold mb-2">Portal Publik</h3>
            <p className="text-rose-100/80 text-sm">Akses halaman utama dan informasi event.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function ScanLineIcon() {
  return <ScanLine className="h-10 w-10 mb-4 text-amber-400" />;
}
function ListChecksIcon() {
  return <ListChecks className="h-10 w-10 mb-4 text-blue-950/80" />;
}
function TrendingUpIcon() {
  return <TrendingUp className="h-10 w-10 mb-4 text-rose-200" />;
}
