import { db } from "@/db";
import { events, registrations, participants } from "./schema";
import { eq, desc } from "drizzle-orm";

export async function getEvents() {
  return db.select().from(events).orderBy(desc(events.date));
}

export async function getEventBySlug(slug: string) {
  return db.select().from(events).where(eq(events.slug, slug)).limit(1);
}

export async function getRegistrationsByEvent(eventId: number) {
  return db
    .select({
      id: registrations.id,
      status: registrations.status,
      checkedInAt: registrations.checkedInAt,
      checkedInBy: registrations.checkedInBy,
      createdAt: registrations.createdAt,
      participantId: participants.id,
      fullName: participants.fullName,
      email: participants.email,
      organization: participants.organization,
      phone: participants.phone,
      qrCode: registrations.qrCode,
      ticketNumber: registrations.ticketNumber,
    })
    .from(registrations)
    .leftJoin(participants, eq(registrations.participantId, participants.id))
    .where(eq(registrations.eventId, eventId));
}

export async function getRegistrationById(id: number) {
  return db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
}

export async function getRegistrationByQR(qr: string) {
  return db.select().from(registrations).where(eq(registrations.qrCode, qr)).limit(1);
}
