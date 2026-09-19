import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, participants, events } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, fullName, email, phone, organization, position, address } = body;

    if (!eventId || !fullName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check event exists
    const event = await db.select().from(events).where(eq(events.id, Number(eventId))).limit(1);
    if (event.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Create participant
    const participantResult = await db.insert(participants).values({
      fullName,
      email,
      phone: phone || "",
      organization: organization || "",
      position: position || "",
      address: address || "",
    }).returning();

    const participant = participantResult[0];

    // Generate QR code and ticket number
    const qrCode = `EVT${eventId}-${participant.id}-${Date.now().toString(36).toUpperCase()}`;
    const ticketNumber = `TICKET-EVT-${String(eventId).padStart(3, "0")}-${String(participant.id).padStart(3, "0")}`;

    // Create registration
    const regResult = await db.insert(registrations).values({
      eventId: Number(eventId),
      participantId: participant.id,
      qrCode,
      ticketNumber,
      status: "registered",
    }).returning();

    return NextResponse.json({ success: true, registration: regResult[0], participant, qrCode, ticketNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to register" }, { status: 500 });
  }
}
