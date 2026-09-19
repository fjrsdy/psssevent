import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const eventList = await db.select().from(events).where(eq(events.status, "open")).orderBy(desc(events.date));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-900 via-blue-950 to-teal-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Pendaftaran Peserta</h1>
          <p className="text-blue-100/90 text-lg max-w-2xl">Pilih event yang ingin Anda ikuti, isi data diri, dan dapatkan e-ticket serta QR code otomatis.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 md:px-8 -mt-10 relative z-10 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eventList.map((evt) => (
            <Link key={evt.id} href={`/events/${evt.slug}`} className="group rounded-3xl overflow-hidden bg-white shadow-xl shadow-slate-200/60 border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img src={evt.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"} alt={evt.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="inline-block rounded-full bg-blue-950/80 text-white text-[10px] font-extrabold uppercase tracking-wide px-3 py-1 backdrop-blur-md">{evt.category}</span>
                  <span className="inline-block rounded-full bg-amber-400 text-blue-950 text-[10px] font-extrabold uppercase tracking-wide px-3 py-1">Buka</span>
                </div>
              </div>
              <div className="p-6 md:p-7 flex-1 flex flex-col">
                <h3 className="text-xl font-extrabold text-slate-950 mb-3 leading-snug group-hover:text-blue-900 transition-colors">{evt.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{evt.description}</p>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {new Date(evt.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {evt.venueCity}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400">Maks. <span className="text-slate-700">{evt.maxParticipants}</span> peserta</span>
                  <span className="inline-flex items-center gap-1 text-sm font-extrabold text-teal-700 group-hover:text-blue-900 transition-colors">Daftar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
