import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertResumeSchema, insertAnalysisSchema } from "@shared/schema";
import { PDFProcessor } from "./services/pdf-processor";
import { ATSAnalyzer } from "./services/ats-analyzer";
import multer from "multer";

// Debug flag
const DEBUG_MODE = false; // Set to true to enable debug logging

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    console.log("File filter check:", file.originalname, file.mimetype);
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/plain') { // Allow text files for testing
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and text files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const pdfProcessor = new PDFProcessor();
  const atsAnalyzer = new ATSAnalyzer();

  // Upload and analyze resume
  app.post("/api/resumes/upload", upload.single('resume'), async (req, res) => {
    try {
      console.log("Upload request received:", 
        req.file ? `File present: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)` : "No file", 
        "Content-Type:", req.headers['content-type']);
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({ message: "Empty file received" });
      }

      // Extract text from PDF/DOC/DOCX/TXT
      let extractedText;
      try {
        console.log(`Attempting to extract text from ${req.file.originalname}`);
        extractedText = await pdfProcessor.extractText(req.file.buffer, req.file.mimetype);
        
        if (!extractedText || extractedText.trim().length === 0) {
          return res.status(400).json({ message: "Could not extract text from the uploaded file. Please ensure it contains readable text." });
        }
        
        console.log(`Successfully extracted ${extractedText.length} characters from document`);
      } catch (extractError) {
        console.error("Text extraction failed:", extractError);
        return res.status(400).json({ 
          message: "Failed to extract text from document", 
          error: extractError instanceof Error ? extractError.message : "Unknown extraction error" 
        });
      }
      
      // Create resume record (using existing user ID for demo, should come from auth)
      const userId = 2; // Using existing test_user ID
      
      try {
        // Clear all previous analyses for this user to prevent contamination
        // Get all user's resumes
        const userResumes = await storage.getResumesByUser(userId);
        
        // Delete analyses for all user's resumes
        for (const resume of userResumes) {
          await storage.deleteAnalysisByResumeId(resume.id);
          console.log(`Cleared previous analyses for resume ID: ${resume.id}`);
        }
        
        // Create new resume record
        const resumeData = {
          userId: userId,
          filename: req.file.originalname,
          originalText: extractedText,
        };

        const validatedData = insertResumeSchema.parse(resumeData);
        const resume = await storage.createResume(validatedData);
        console.log(`Created new resume record with ID: ${resume.id}`);

        // Perform initial ATS analysis
        const analysis = await atsAnalyzer.analyzeResume(extractedText);
        
        const analysisData = {
          resumeId: resume.id,
          jobDescription: null,
          ...analysis,
        };

        const validatedAnalysis = insertAnalysisSchema.parse(analysisData);
        const savedAnalysis = await storage.createAnalysis(validatedAnalysis);
        console.log(`Created new analysis record with ID: ${savedAnalysis.id}`);

        res.json({
          resume,
          analysis: savedAnalysis,
          session_cleared: true
        });
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        res.status(500).json({ 
          message: "Failed to save resume data", 
          error: dbError instanceof Error ? dbError.message : "Unknown database error" 
        });
      }
    } catch (error) {
      console.error("Resume upload error:", error);
      res.status(500).json({ 
        message: "Failed to process resume",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Analyze resume against job description
  app.post("/api/resumes/:id/analyze", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const { jobDescription } = req.body;

      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }

      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Get existing analysis if it exists
      let existingAnalysis = await storage.getAnalysis(resumeId);
      
      // Perform enhanced analysis with job description
      const analysis = await atsAnalyzer.analyzeResumeWithJob(resume.originalText, jobDescription);
      
      const analysisData = {
        resumeId: resume.id,
        jobDescription,
        ...analysis,
        // Preserve any existing data that should be maintained
        ...(existingAnalysis ? {
          formatIssues: existingAnalysis.formatIssues || analysis.formatIssues,
          improvements: existingAnalysis.improvements || analysis.improvements,
        } : {}),
      };

      // Delete the old analysis before creating a new one
      if (existingAnalysis) {
        await storage.deleteAnalysisByResumeId(resumeId);
      }

      const validatedAnalysis = insertAnalysisSchema.parse(analysisData);
      const savedAnalysis = await storage.createAnalysis(validatedAnalysis);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Resume analysis error:", error);
      res.status(500).json({ 
        message: "Failed to analyze resume",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get resume analysis
  app.get("/api/resumes/:id/analysis", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(resumeId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Get the resume to include the original text
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      // Include the original text in the response
      const responseData = {
        ...analysis,
        originalText: resume.originalText
      };

      res.json(responseData);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ 
        message: "Failed to get analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get user's resumes
  app.get("/api/users/:id/resumes", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const resumes = await storage.getResumesByUser(userId);
      res.json(resumes);
    } catch (error) {
      console.error("Get resumes error:", error);
      res.status(500).json({ 
        message: "Failed to get resumes",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get interview prep questions
  app.get("/api/resumes/:id/interview-prep", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Extract job title from query or use default
      const jobTitle = req.query.jobTitle as string;
      
      const questions = await atsAnalyzer.openAI.generateInterviewQuestions(resume.originalText, jobTitle);
      res.json(questions);
    } catch (error) {
      console.error("Interview prep error:", error);
      res.status(500).json({ message: "Failed to generate interview questions" });
    }
  });
  
  // New endpoint for combined ATS analysis and interview questions
  app.get("/api/resumes/:id/complete-analysis", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const resume = await storage.getResume(resumeId);
      
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Get the latest analysis for this resume
      const analysis = await storage.getAnalysis(resumeId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Extract job title from query or use default
      const jobTitle = req.query.jobTitle as string;
      
      // Generate interview questions
      const interviewData = await atsAnalyzer.openAI.generateInterviewQuestions(resume.originalText, jobTitle);
      
      // Format recommendations from improvements
      const recommendations = analysis.improvements.map(imp => 
        `${imp.title}: ${imp.description}`
      );
      
      // Return in the exact format requested by the user
      res.json({
        ats_score: analysis.atsScore,
        interview_questions: interviewData.questions.map(q => q.question),
        recommendations: recommendations
      });
    } catch (error) {
      console.error("Complete analysis error:", error);
      res.status(500).json({ message: "Failed to generate complete analysis" });
    }
  });

  // New endpoint for the required workflow with fresh analysis
  app.post("/api/resumes/:id/fresh-analysis", async (req, res) => {
    try {
      const resumeId = parseInt(req.params.id);
      const { jobDescription } = req.body;

      if (DEBUG_MODE) console.log(`Starting fresh analysis for resume ${resumeId}`);

      // Get the resume
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Clear existing analysis to prevent contamination
      if (DEBUG_MODE) console.log(`Clearing existing analyses for resume ${resumeId}`);
      await storage.deleteAnalysisByResumeId(resumeId);

      // Extract text from resume (already stored in resume.originalText)
      const extractedText = resume.originalText;
      
      if (!extractedText || extractedText.trim().length === 0) {
        return res.status(400).json({ message: "No text content found in resume" });
      }

      // Perform fresh AI analysis
      let analysis;
      if (jobDescription) {
        if (DEBUG_MODE) console.log(`Analyzing resume with job description`);
        analysis = await atsAnalyzer.analyzeResumeWithJob(extractedText, jobDescription);
      } else {
        if (DEBUG_MODE) console.log(`Analyzing resume without job description`);
        analysis = await atsAnalyzer.analyzeResume(extractedText);
      }

      // Save the fresh analysis
      const analysisData = {
        resumeId: resume.id,
        jobDescription: jobDescription || null,
        ...analysis,
      };

      const validatedAnalysis = insertAnalysisSchema.parse(analysisData);
      const savedAnalysis = await storage.createAnalysis(validatedAnalysis);

      // Generate fresh interview questions
      if (DEBUG_MODE) console.log(`Generating fresh interview questions`);
      const jobTitle = req.query.jobTitle as string;
      const interviewData = await atsAnalyzer.openAI.generateInterviewQuestions(extractedText, jobTitle);

      // Extract job titles, projects, and skills from resume
      if (DEBUG_MODE) console.log(`Extracting resume information`);
      const jobTitles = await atsAnalyzer.openAI.extractJobTitles(extractedText);
      const projects = await atsAnalyzer.openAI.extractProjects(extractedText);
      const skills = await atsAnalyzer.openAI.extractSkills(extractedText);

      // Return in the exact format requested by the user
      res.json({
        session_cleared: true,
        resume_text_extracted: extractedText,
        dynamic_analysis: {
          job_titles: jobTitles,
          projects: projects,
          skills: skills
        },
        fresh_questions: interviewData.questions.map(q => q.question),
        live_ats_score: savedAnalysis.atsScore,
        current_keyword_analysis: {
          matches: savedAnalysis.keywordMatches || [],
          missing: savedAnalysis.missingKeywords || [],
          score: savedAnalysis.keywordScore
        }
      });
    } catch (error) {
      console.error("Fresh analysis error:", error);
      res.status(500).json({ 
        message: "Failed to generate fresh analysis",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
