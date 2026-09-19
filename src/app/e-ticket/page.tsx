import Link from "next/link";
import { ArrowLeft, Ticket, QrCode, User, Building2, Mail, Phone, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { registrations, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ETicketPage({ searchParams }: { searchParams: Promise<{ id?: string; qr?: string }> }) {
  const params = await searchParams;
  let reg: any = null;
  let participant: any = null;

  try {
    if (params.id) {
      const regs = await db.select().from(registrations).where(eq(registrations.id, Number(params.id))).limit(1);
      reg = regs[0];
    } else if (params.qr) {
      const regs = await db.select().from(registrations).where(eq(registrations.qrCode, params.qr)).limit(1);
      reg = regs[0];
    }

    if (reg) {
      const parts = await db.select().from(participants).where(eq(participants.id, reg.participantId)).limit(1);
      participant = parts[0];
    }
  } catch (e) {
    console.error(e);
  }

  if (!reg || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center p-8 rounded-3xl bg-white shadow-xl shadow-slate-200/60 max-w-md">
          <h1 className="text-2xl font-extrabold text-slate-950 mb-2">E-Ticket Tidak Ditemukan</h1>
          <p className="text-slate-500 mb-6">QR code atau nomor tiket tidak valid.</p>
          <Link href="/events" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 text-white px-6 py-3 font-extrabold shadow-lg shadow-teal-700/20">Kembali ke Event</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50 pb-20">
      <div className="mx-auto max-w-md px-4 pt-10 md:pt-16">
        <Link href="/events" className="inline-flex items-center gap-1 text-teal-700 font-bold hover:underline mb-6 text-sm"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        <div className="rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-blue-950 via-teal-900 to-blue-950 text-white shadow-2xl shadow-blue-950/30">
          {/* Header */}
          <div className="relative overflow-hidden px-8 pt-10 pb-6">
            <div className="absolute top-0 right-0 opacity-20">
              <QrCode className="h-40 w-40 text-white -translate-y-1/4 translate-x-1/4" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block rounded-full bg-amber-400 text-blue-950 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5">E-Ticket</span>
                <span className="inline-block rounded-full bg-white/10 text-white text-[10px] font-bold px-2.5 py-0.5">{reg.status === "checked_in" ? "Sudah Check-in" : "Aktif"}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mb-1">Tiket Peserta</h2>
              <p className="text-blue-100/70 text-sm">Pusat Standardisasi SDM Kelautan & Perikanan</p>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white/5 backdrop-blur-sm px-8 py-8 space-y-6 border-t border-white/10">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200/70 mb-1">No. Tiket</p>
              <h3 className="text-xl font-extrabold tracking-wide text-amber-300">{reg.ticketNumber}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-blue-200 mb-2"><User className="h-4 w-4" /> Nama</div>
                <p className="font-bold text-sm leading-snug">{participant.fullName}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-blue-200 mb-2"><Mail className="h-4 w-4" /> Email</div>
                <p className="font-bold text-sm leading-snug truncate">{participant.email}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-blue-200 mb-2"><Building2 className="h-4 w-4" /> Organisasi</div>
                <p className="font-bold text-sm leading-snug truncate">{participant.organization || "-"}</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                <div className="flex items-center gap-2 text-blue-200 mb-2"><Phone className="h-4 w-4" /> Telepon</div>
                <p className="font-bold text-sm leading-snug">{participant.phone || "-"}</p>
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-amber-300/20 to-amber-400/10 border border-amber-400/20 p-4 text-center">
              <p className="text-xs font-extrabold uppercase tracking-widest text-amber-300 mb-2">Kode QR</p>
              <div className="inline-block rounded-2xl bg-white p-4 shadow-xl shadow-black/20">
                {/* We'll render the QR using an <img> with a data URL generated by a simple API or use an external service. Let's use a quick svg-based representation or an external API */}
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reg.qrCode)}`} alt="QR Code" className="w-40 h-40" />
              </div>
              <p className="mt-3 text-xs font-bold text-blue-100/80 font-mono tracking-widest">{reg.qrCode}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-amber-400 to-amber-300 px-8 py-6 text-center rounded-b-[2.5rem]">
            <div className="flex items-center justify-center gap-2 text-blue-950 font-extrabold text-lg mb-1">
              <Ticket className="h-6 w-6" /> E-Ticket Valid
            </div>
            <p className="text-blue-950/70 text-xs font-medium">Tunjukkan QR code ini saat check-in</p>
          </div>
        </div>
      </div>
    </div>
  );
}
