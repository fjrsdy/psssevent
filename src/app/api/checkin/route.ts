import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrCode, scannedBy } = body;

    if (!qrCode) {
      return NextResponse.json({ error: "QR code required" }, { status: 400 });
    }

    const reg = await db.select().from(registrations).where(eq(registrations.qrCode, qrCode)).limit(1);
    if (reg.length === 0) {
      return NextResponse.json({ error: "Registration not found", found: false }, { status: 404 });
    }

    const registration = reg[0];
    if (registration.status === "checked_in") {
      return NextResponse.json({ error: "Already checked in", found: true, checkedIn: true, registration }, { status: 409 });
    }

    const updated = await db.update(registrations)
      .set({ status: "checked_in", checkedInAt: new Date(), checkedInBy: scannedBy || "System" })
      .where(eq(registrations.qrCode, qrCode))
      .returning();

    const participant = await db.select().from(participants).where(eq(participants.id, registration.participantId)).limit(1);

    return NextResponse.json({
      success: true,
      found: true,
      checkedIn: true,
      registration: updated[0],
      participant: participant[0] || null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to check in" }, { status: 500 });
  }
}
