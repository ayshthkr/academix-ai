import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

// Class schema for storing course information
export const class_ = pgTable("Class", {
  // Change from UUID to memorable ID format (xxx-xxxx)
  id: varchar("id", { length: 8 }).primaryKey().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objectives: text("objectives"),
  duration: integer("duration").notNull(),
  targetAudience: varchar("targetAudience", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Class = InferSelectModel<typeof class_>;

// WeekPlan schema for storing week-by-week content
export const weekPlan = pgTable("WeekPlan", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  classId: varchar("classId", { length: 8 })
    .notNull()
    .references(() => class_.id, { onDelete: "cascade" }),
  weekNumber: integer("weekNumber").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  topics: json("topics").notNull(), // Change from content to topics JSON array
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type WeekPlan = InferSelectModel<typeof weekPlan>;
