import Link from "next/link";
import { CalendarDays, MapPin, Users, ArrowLeft, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import RegistrationForm from "./RegistrationForm";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const evt = eventData[0];

  if (!evt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-950 mb-4">Event Tidak Ditemukan</h1>
          <Link href="/events" className="text-teal-700 font-bold hover:underline">Kembali ke Daftar Event</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50 pb-20">
      {/* Hero Image */}
      <div className="relative h-72 md:h-[28rem] overflow-hidden">
        <img src={evt.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80"} alt={evt.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 md:px-8 pb-10">
          <Link href="/events" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm font-bold mb-4 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Event
          </Link>
          <span className="inline-block rounded-full bg-amber-400 text-blue-950 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 mb-4 shadow-lg shadow-amber-400/20">{evt.category}</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">{evt.title}</h1>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6 md:p-10">
              <div className="flex flex-wrap gap-6 text-sm font-bold text-slate-600 mb-8">
                <span className="flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1.5 rounded-xl"><CalendarDays className="h-4 w-4" /> {new Date(evt.date).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                <span className="flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-xl"><MapPin className="h-4 w-4" /> {evt.venue}, {evt.venueCity}</span>
                <span className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl"><Users className="h-4 w-4" /> Maks. {evt.maxParticipants} Peserta</span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-950 mb-4">Tentang Event</h2>
              <div className="prose text-slate-700 leading-relaxed text-base">
                <p>{evt.description}</p>
                {evt.info && <p className="mt-4">{evt.info}</p>}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-teal-900 to-blue-950 text-white p-8 md:p-10 shadow-xl shadow-blue-950/20">
              <h3 className="text-xl font-extrabold mb-3">Kenapa Mengikuti Event Ini?</h3>
              <ul className="space-y-3">
                {[
                  "Sertifikat kompetensi yang diakui secara nasional",
                  "Materi dari praktisi dan asesor berpengalaman",
                  "Jaringan profesional di sektor kelautan dan perikanan",
                  "Fasilitas lengkap dan nyaman selama acara",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-blue-100">
                    <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" /> <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar Registration */}
          <aside className="lg:col-span-1">
            <div className="sticky top-20 rounded-3xl bg-white shadow-xl shadow-slate-200/60 border border-slate-100 p-6 md:p-8">
              <h3 className="text-xl font-extrabold text-slate-950 mb-2">Pendaftaran Peserta</h3>
              <p className="text-sm text-slate-500 mb-6">Isi data diri untuk mendaftar event ini. E-ticket dan QR akan dikirim otomatis.</p>
              <RegistrationForm eventId={evt.id} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
