import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalText: text("original_text").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").references(() => resumes.id).notNull(),
  jobDescription: text("job_description"),
  atsScore: integer("ats_score").notNull(),
  formatScore: integer("format_score").notNull(),
  keywordScore: integer("keyword_score").notNull(),
  contentScore: integer("content_score").notNull(),
  keywordMatches: jsonb("keyword_matches").$type<string[]>().default([]),
  missingKeywords: jsonb("missing_keywords").$type<string[]>().default([]),
  improvements: jsonb("improvements").$type<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    suggestions: string[];
  }[]>(),
  sectionCompleteness: jsonb("section_completeness").$type<{
    section: string;
    status: 'complete' | 'incomplete' | 'missing';
    suggestions?: string[];
  }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  filename: true,
  originalText: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
}).extend({
  keywordMatches: z.array(z.string()).optional(),
  missingKeywords: z.array(z.string()).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;
