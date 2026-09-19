import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const reg = await db.select().from(registrations).where(eq(registrations.id, Number(id))).limit(1);
    if (reg.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const participant = await db.select().from(participants).where(eq(participants.id, reg[0].participantId)).limit(1);
    return NextResponse.json({ registration: reg[0], participant: participant[0] || null });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
