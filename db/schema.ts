import {
  integer,
  pgSchema,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const schema = pgSchema("whiskey-receipts");

export const receipts = schema.table("receipts", {
  id: varchar("id").primaryKey(),
  store_id: integer("store_id").notNull(),
  date: timestamp("timestamp").notNull(),
  documentType: varchar("document_type").notNull(),
});

export const stores = schema.table("stores", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name").notNull(),
});
