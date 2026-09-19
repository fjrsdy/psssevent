import { db } from "./";
import { events, participants, registrations } from "./schema";
import { sql } from "drizzle-orm";

export async function seedData() {
  // Clear existing
  await db.delete(registrations);
  await db.delete(participants);
  await db.delete(events);

  // Insert events
  const eventData = [
    {
      title: "Workshop Sertifikasi Kompetensi Sumber Daya Manusia Kelautan",
      slug: "workshop-sertifikasi-kompetensi-sdm-kelautan",
      description: "Workshop ini bertujuan meningkatkan kompetensi SDM di bidang kelautan melalui sertifikasi profesional yang diakui nasional. Peserta akan mendapatkan sertifikat kompetensi yang berlaku seumur hidup.",
      category: "Sertifikasi",
      date: new Date("2025-08-15T08:00:00"),
      endDate: new Date("2025-08-17T16:00:00"),
      venue: "Aula Utama Pusat Standardisasi",
      venueCity: "Jakarta",
      maxParticipants: 120,
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80",
      info: "Workshop tiga hari ini mencakup modul sertifikasi kompetensi dasar, pemetaan kompetensi sektor kelautan, serta praktik penilaian kompetensi oleh asesor berlisensi.",
    },
    {
      title: "Seminar Nasional Inovasi Perikanan Berkelanjutan 2025",
      slug: "seminar-nasional-inovasi-perikanan-berkelanjutan-2025",
      description: "Seminar nasional yang mengumpulkan praktisi, akademisi, dan pembuat kebijakan untuk membahas inovasi teknologi perikanan berkelanjutan di Indonesia.",
      category: "Seminar",
      date: new Date("2025-09-05T09:00:00"),
      endDate: new Date("2025-09-05T17:00:00"),
      venue: "Gedung Konvensi Maritim",
      venueCity: "Surabaya",
      maxParticipants: 300,
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80",
      info: "Topik utama: teknologi budidaya laut dalam, sistem pemantauan stok ikan berbasis AI, serta kebijakan perikanan berkelanjutan.",
    },
    {
      title: "Pelatihan Audit Internal Sistem Manajemen Mutu Perikanan",
      slug: "pelatihan-audit-internal-sistem-manajemen-mutu-perikanan",
      description: "Pelatihan intensif untuk auditor internal sistem manajemen mutu di sektor perikanan dan kelautan, sesuai standar nasional dan internasional.",
      category: "Pelatihan",
      date: new Date("2025-10-20T08:30:00"),
      endDate: new Date("2025-10-22T16:30:00"),
      venue: "Balai Pelatihan Kelautan",
      venueCity: "Makassar",
      maxParticipants: 60,
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
      info: "Peserta akan mempelajari teknik audit, laporan audit, serta koreksi tindakan preventif dalam sistem manajemen mutu perikanan.",
    },
  ];

  const insertedEvents = await db.insert(events).values(eventData).returning();

  // Insert sample participants and registrations for first event
  const p1 = await db.insert(participants).values({
    fullName: "Dr. Andi Wijaya",
    email: "andi.wijaya@kkp.go.id",
    phone: "+6281212345678",
    organization: "Kementerian Kelautan dan Perikanan",
    position: "Kepala Subdirektorat",
    address: "Jl. Medan Merdeka Timur No. 16",
  }).returning();

  const p2 = await db.insert(participants).values({
    fullName: "Siti Rahmawati, S.Pi",
    email: "siti.rahma@unhas.ac.id",
    phone: "+6282210987654",
    organization: "Universitas Hasanuddin",
    position: "Dosen Perikanan",
    address: "Jl. Perintis Kemerdekaan KM 10",
  }).returning();

  await db.insert(registrations).values([
    {
      eventId: insertedEvents[0].id,
      participantId: p1[0].id,
      qrCode: "EVT001-ANDI-WIJAYA-08",
      ticketNumber: "TICKET-EVT-001-001",
      status: "registered",
    },
    {
      eventId: insertedEvents[0].id,
      participantId: p2[0].id,
      qrCode: "EVT001-SITI-RAHMA-09",
      ticketNumber: "TICKET-EVT-001-002",
      status: "checked_in",
      checkedInAt: new Date("2025-08-15T07:45:00"),
      checkedInBy: "Admin",
    },
  ]);

  console.log("Seed data inserted.");
}
