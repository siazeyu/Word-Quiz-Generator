import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const textbooksTable = pgTable("textbooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTextbookSchema = createInsertSchema(textbooksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTextbook = z.infer<typeof insertTextbookSchema>;
export type Textbook = typeof textbooksTable.$inferSelect;
