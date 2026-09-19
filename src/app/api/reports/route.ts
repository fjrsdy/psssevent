import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, registrations, participants } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  try {
    const eventList = await db.select().from(events).orderBy(desc(events.date));
    const reportData = await Promise.all(
      eventList.map(async (evt) => {
        const regs = await db.select({ id: registrations.id, status: registrations.status }).from(registrations).where(eq(registrations.eventId, evt.id));
        const total = regs.length;
        const checkedIn = regs.filter((r) => r.status === "checked_in").length;
        const participantsData = await db.select({ count: count() }).from(registrations).where(eq(registrations.eventId, evt.id));
        return {
          event: evt,
          totalRegistrations: total,
          checkedIn,
          pending: total - checkedIn,
          attendanceRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
          participantCount: participantsData[0]?.count || 0,
        };
      })
    );
    return NextResponse.json({ reports: reportData, events: eventList });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
