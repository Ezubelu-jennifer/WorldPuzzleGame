import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (from the starter code)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Countries table for tracking available countries
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  regionsCount: integer("regions_count").notNull(),
  difficulty: integer("difficulty").notNull(), // 1-5 difficulty rating
  imageUrl: text("image_url"), // URL to country image (if available)
  outlinePath: text("outline_path").notNull(), // SVG path for country outline
});

export const insertCountrySchema = createInsertSchema(countries).omit({
  id: true,
});

export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countries.$inferSelect;

// Regions table for tracking country states/regions/provinces
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull(), // Foreign key to country
  name: text("name").notNull(),
  svgPath: text("svg_path").notNull(), // SVG path for the region shape
  correctX: integer("correct_x").notNull(), // Correct X position
  correctY: integer("correct_y").notNull(), // Correct Y position
  fillColor: text("fill_color").notNull(), // Fill color of the region
  strokeColor: text("stroke_color").notNull(), // Stroke color of the region
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// GameSessions table for tracking user game sessions
export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // Can be null for anonymous players
  countryId: integer("country_id").notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  hintsUsed: integer("hints_used").notNull().default(0),
  score: integer("score"),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  completedAt: true,
  score: true,
  isCompleted: true,
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

// Types for frontend game state
export interface GameState {
  countryId: number;
  countryName: string;
  regions: RegionPiece[];
  placedPieces: number[];
  hintsUsed: number;
  startTime: number | null;
  endTime: number | null;
  isCompleted: boolean;
  score: number | null;
}

export interface RegionPiece {
  id: number;
  name: string;
  svgPath: string;
  correctX: number;
  correctY: number;
  currentX?: number;
  currentY?: number;
  isPlaced: boolean;
  fillColor: string;
  strokeColor: string;
}
