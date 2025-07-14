import { users, resumes, analyses, type User, type InsertUser, type Resume, type InsertResume, type Analysis, type InsertAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createResume(resume: InsertResume): Promise<Resume>;
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUser(userId: number): Promise<Resume[]>;
  
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(resumeId: number): Promise<Analysis | undefined>;
  getAnalysesByUser(userId: number): Promise<Analysis[]>;
  deleteAnalysisByResumeId(resumeId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const [resume] = await db
      .insert(resumes)
      .values(insertResume)
      .returning();
    return resume;
  }

  async getResume(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume || undefined;
  }

  async getResumesByUser(userId: number): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.userId, userId));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    // Cast the complex types to satisfy Drizzle's type requirements
    const analysisData = {
      ...insertAnalysis,
      improvements: insertAnalysis.improvements as any,
      sectionCompleteness: insertAnalysis.sectionCompleteness as any,
    };
    
    const [analysis] = await db
      .insert(analyses)
      .values(analysisData)
      .returning();
    return analysis;
  }

  async getAnalysis(resumeId: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.resumeId, resumeId));
    return analysis || undefined;
  }

  async getAnalysesByUser(userId: number): Promise<Analysis[]> {
    return await db
      .select({
        id: analyses.id,
        resumeId: analyses.resumeId,
        jobDescription: analyses.jobDescription,
        atsScore: analyses.atsScore,
        formatScore: analyses.formatScore,
        keywordScore: analyses.keywordScore,
        contentScore: analyses.contentScore,
        keywordMatches: analyses.keywordMatches,
        missingKeywords: analyses.missingKeywords,
        improvements: analyses.improvements,
        sectionCompleteness: analyses.sectionCompleteness,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .innerJoin(resumes, eq(analyses.resumeId, resumes.id))
      .where(eq(resumes.userId, userId));
  }

  async deleteAnalysisByResumeId(resumeId: number): Promise<void> {
    console.log(`Deleting previous analyses for resumeId: ${resumeId}`);
    await db.delete(analyses).where(eq(analyses.resumeId, resumeId));
    console.log(`Successfully cleared previous analyses for resumeId: ${resumeId}`);
  }
}

export const storage = new DatabaseStorage();
