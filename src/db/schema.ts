import { pgTable, serial, text, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  category: text("category"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date").notNull(),
  venue: text("venue").notNull(),
  venueCity: text("venue_city"),
  maxParticipants: integer("max_participants").default(100),
  status: text("status").default("open").notNull(), // open, closed, completed
  imageUrl: text("image_url"),
  info: text("info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  position: text("position"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  participantId: integer("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  qrCode: text("qr_code").notNull().unique(),
  ticketNumber: text("ticket_number").notNull().unique(),
  status: text("status").default("registered").notNull(), // registered, checked_in, cancelled
  checkedInAt: timestamp("checked_in_at"),
  checkedInBy: text("checked_in_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
