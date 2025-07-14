// Using OpenRouter as a unified API gateway to access various AI models
// OpenRouter API keys should start with 'sk-or-v1-'
const OPENROUTER_API_KEY = process.env.OPENAI_API_KEY || ""; // User provided API key
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Log API key configuration for debugging
console.log("API Key configured (first 10 chars):", OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + "..." : "No API key found");
console.log("API Key length:", OPENROUTER_API_KEY ? OPENROUTER_API_KEY.length : 0);

// Flag to determine if we should use fallback responses due to API issues
// IMPORTANT: Always set to false to ensure we always try to connect to the API first
const USE_FALLBACK = false; // Force live API connection

// Debug API key
console.log("API Key configured:", OPENROUTER_API_KEY ? "Yes (" + OPENROUTER_API_KEY.substring(0, 5) + "...)" : "No");
console.log("Using fallback responses:", USE_FALLBACK ? "Yes" : "No");

interface MoonshotResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callMoonshotAPI(messages: any[]): Promise<MoonshotResponse> {
  // If fallback mode is enabled, skip API call and return fallback response
  if (USE_FALLBACK) {
    console.log("Using fallback response instead of calling API");
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            contentScore: 65,
            improvements: [{
              priority: "medium",
              category: "API Error",
              title: "API Service Unavailable",
              description: "Using fallback analysis due to API service error"
            }],
            sectionCompleteness: [
              { section: "Contact Information", status: "incomplete" },
              { section: "Summary/Objective", status: "incomplete" },
              { section: "Work Experience", status: "incomplete" },
              { section: "Skills", status: "incomplete" },
              { section: "Education", status: "incomplete" }
            ]
          })
        }
      }]
    };
  }
  
  try {
    if (!OPENROUTER_API_KEY) {
      console.error("Missing API key");
      throw new Error("API key not configured");
    }
    
    // Validate API key format
    if (!OPENROUTER_API_KEY.startsWith('sk-or-v1-') && !OPENROUTER_API_KEY.startsWith('sk-')) {
      console.error("Invalid API key format");
      console.error("OpenRouter API keys should start with 'sk-or-v1-' or 'sk-'");
      console.error(`Your API key starts with: ${OPENROUTER_API_KEY.substring(0, 5)}...`);
      console.warn("Attempting to use the key anyway, but authentication may fail");
    }
    
    // Clear any cached data to ensure fresh analysis
    console.log("Ensuring fresh analysis with no cached data");

    console.log("Calling API with key:", OPENROUTER_API_KEY.substring(0, 10) + "...");
    console.log("Request payload:", JSON.stringify({
      model: "kimi/kimi-v2", // Using Kimi K2 model through OpenRouter
      messages: messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + "..." })),
      temperature: 0.7,
      // Added cache control to prevent using cached responses
      cache_control: "no-cache",
    }));
    
    // Log the request details for debugging
    console.log("Making API request to:", `${OPENROUTER_BASE_URL}/chat/completions`);
    console.log("Using authorization header:", `Bearer ${OPENROUTER_API_KEY.substring(0, 5)}...`);
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://ats-scan.com', // Identify your application
        'X-Title': 'ATS-Scan Resume Analyzer',
        'Cache-Control': 'no-cache', // Prevent browser caching
        'OpenRouter-Completions-Version': 'v1' // Ensure using the correct API version
      },
      body: JSON.stringify({
        model: "kimi/kimi-v2", // Kimi K2 model through OpenRouter
        messages,
        temperature: 0.7,
        // Added cache control to prevent using cached responses
        cache_control: "no-cache",
      }),
    });

    if (!response.ok) {
      let errorText;
      try {
        // Try to parse as JSON for structured error information
        const errorJson = await response.json();
        errorText = JSON.stringify(errorJson);
        console.error(`API error (${response.status}):`, errorJson);
        
        // Log specific error details if available
        if (errorJson.error && errorJson.error.message) {
          console.error(`API error message: ${errorJson.error.message}`);
        }
        
        // Check for common authentication issues
        if (response.status === 401) {
          console.error('Authentication error: Please check your API key format and validity');
          console.error('OpenRouter API keys should start with "sk-or-v1-"');
          console.error(`Your API key starts with: ${OPENROUTER_API_KEY.substring(0, 5)}...`);
        }
      } catch (e) {
        // Fallback to text if not JSON
        errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("API response received:", JSON.stringify(responseData).substring(0, 100) + "...");
    return responseData;
  } catch (error) {
    console.error("API call failed:", error);
    // Return a fallback response instead of throwing
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            contentScore: 65,
            improvements: [{
              priority: "medium",
              category: "API Error",
              title: "API Service Unavailable",
              description: "Using fallback analysis due to API service error"
            }],
            sectionCompleteness: []
          })
        }
      }]
    };
  }
}

export class OpenAIService {
  
  private generateFallbackAnalysis(resumeText: string) {
    const text = resumeText.toLowerCase();
    let contentScore = 60;
    const improvements = [];
    const sectionCompleteness = [];

    // Analyze content quality
    const hasEmail = /\S+@\S+\.\S+/.test(text);
    const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text);
    const hasExperience = text.includes('experience') || text.includes('work');
    const hasEducation = text.includes('education') || text.includes('degree');
    const hasSkills = text.includes('skills') || text.includes('technologies');
    const hasSummary = text.includes('summary') || text.includes('profile');
    
    // Check for quantified achievements
    const hasNumbers = /\d+%|\d+\+|increased|improved|reduced|led \d+|managed \d+/.test(text);
    const bulletCount = (resumeText.match(/[•·-]/g) || []).length;
    const wordCount = resumeText.split(/\s+/).length;

    // Scoring logic
    if (hasNumbers) contentScore += 15;
    if (bulletCount >= 5) contentScore += 10;
    if (wordCount >= 300) contentScore += 10;
    if (wordCount > 800) contentScore -= 5;

    // Section completeness analysis
    sectionCompleteness.push(
      {
        section: "Contact Information",
        status: (hasEmail && hasPhone) ? "complete" : "incomplete",
        suggestions: !hasEmail || !hasPhone ? ["Add professional email and phone number"] : undefined
      },
      {
        section: "Professional Experience",
        status: hasExperience ? "complete" : "missing",
        suggestions: !hasExperience ? ["Add work experience with quantified achievements"] : undefined
      },
      {
        section: "Education",
        status: hasEducation ? "complete" : "incomplete",
        suggestions: !hasEducation ? ["Include education background and certifications"] : undefined
      },
      {
        section: "Skills",
        status: hasSkills ? "complete" : "missing",
        suggestions: !hasSkills ? ["Add relevant technical and soft skills"] : undefined
      },
      {
        section: "Summary/Profile",
        status: hasSummary ? "complete" : "missing",
        suggestions: !hasSummary ? ["Add professional summary highlighting key strengths"] : undefined
      }
    );

    // Generate improvements based on analysis
    if (!hasNumbers) {
      improvements.push({
        priority: "high",
        category: "Content",
        title: "Add Quantified Achievements",
        description: "Your resume lacks specific numbers and metrics that demonstrate impact",
        suggestions: [
          "Add percentage improvements (e.g., 'Improved efficiency by 30%')",
          "Include specific numbers (e.g., 'Managed team of 5 developers')",
          "Quantify results wherever possible"
        ]
      });
    }

    if (bulletCount < 5) {
      improvements.push({
        priority: "medium",
        category: "Format",
        title: "Use More Bullet Points",
        description: "Bullet points help organize information for better readability",
        suggestions: [
          "Convert paragraph text to bullet points",
          "Use action verbs to start each bullet",
          "Keep bullets concise and impactful"
        ]
      });
    }

    if (!hasSummary) {
      improvements.push({
        priority: "high",
        category: "Content",
        title: "Add Professional Summary",
        description: "A strong summary helps recruiters quickly understand your value proposition",
        suggestions: [
          "Write 2-3 sentences highlighting your expertise",
          "Include years of experience and key skills",
          "Mention your career goals or specialization"
        ]
      });
    }

    if (wordCount < 200) {
      improvements.push({
        priority: "medium",
        category: "Content",
        title: "Expand Content",
        description: "Your resume appears too brief to showcase your full potential",
        suggestions: [
          "Add more details about your responsibilities",
          "Include additional projects or achievements",
          "Expand on your technical skills and experience"
        ]
      });
    }

    return {
      contentScore: Math.min(100, contentScore),
      improvements,
      sectionCompleteness
    };
  }

  private generateFallbackKeywordAnalysis(resumeText: string, jobDescription: string) {
    const resumeTextLower = resumeText.toLowerCase();
    const jobDescLower = jobDescription.toLowerCase();
    
    // Common technical keywords for different roles
    const commonKeywords = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker',
      'kubernetes', 'agile', 'scrum', 'git', 'mongodb', 'postgresql', 'api',
      'microservices', 'ci/cd', 'testing', 'html', 'css', 'typescript',
      'machine learning', 'data analysis', 'project management', 'leadership',
      'frontend', 'backend', 'full stack', 'devops', 'cloud', 'mobile', 'web',
      'database', 'security', 'ui/ux', 'analytics', 'automation', 'rest api'
    ];

    const keywordMatches = [];
    const missingKeywords = [];

    // Extract potential multi-word keywords from job description
    const extractKeywords = (text: string) => {
      const keywords = [];
      
      // Extract single words
      const words = text.split(/\W+/).filter(word => word.length > 3);
      keywords.push(...words);
      
      // Extract common technical terms and phrases
      commonKeywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          keywords.push(keyword);
        }
      });
      
      // Extract potential multi-word phrases (2-3 words)
      const phrases = text.match(/\b[a-z][a-z\s]{5,30}?\b/g) || [];
      keywords.push(...phrases);
      
      // Extract capitalized terms (likely technologies or proper nouns)
      const capitalizedTerms = text.match(/\b[A-Z][a-zA-Z]+\b/g) || [];
      keywords.push(...capitalizedTerms.map(term => term.toLowerCase()));
      
      return [...new Set(keywords)]; // Remove duplicates
    };

    // Get keywords from job description
    const jobKeywords = extractKeywords(jobDescLower)
      .filter(keyword => keyword.length > 3)
      .slice(0, 20); // Limit to 20 keywords

    // Check each keyword against resume
    jobKeywords.forEach(keyword => {
      if (resumeTextLower.includes(keyword.toLowerCase())) {
        keywordMatches.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    // Add some common matches if none found
    if (keywordMatches.length === 0) {
      const defaultMatches = ['programming', 'software', 'development', 'experience'];
      defaultMatches.forEach(match => {
        if (resumeTextLower.includes(match)) {
          keywordMatches.push(match);
        }
      });
    }

    const keywordScore = keywordMatches.length > 0 ? 
      Math.round((keywordMatches.length / (keywordMatches.length + missingKeywords.length)) * 100) : 
      30;

    // Group missing keywords by category for better suggestions
    const categorizeKeywords = (keywords) => {
      const categories = {
        technical: [],
        soft: [],
        domain: [],
        other: []
      };
      
      const technicalTerms = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'mongodb', 'api', 'frontend', 'backend', 'database', 'cloud'];
      const softSkills = ['leadership', 'management', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'analytical', 'creative', 'detail-oriented', 'agile', 'scrum'];
      const domainTerms = ['finance', 'healthcare', 'retail', 'marketing', 'sales', 'education', 'manufacturing', 'logistics', 'security', 'analytics'];
      
      keywords.forEach(keyword => {
        if (technicalTerms.some(term => keyword.includes(term))) {
          categories.technical.push(keyword);
        } else if (softSkills.some(skill => keyword.includes(skill))) {
          categories.soft.push(keyword);
        } else if (domainTerms.some(domain => keyword.includes(domain))) {
          categories.domain.push(keyword);
        } else {
          categories.other.push(keyword);
        }
      });
      
      return categories;
    };
    
    const categorizedKeywords = categorizeKeywords(missingKeywords);
    
    // Generate more specific improvement suggestions based on categories
    const generateSuggestions = () => {
      const suggestions = [];
      
      if (missingKeywords.length === 0) {
        return ["Great keyword coverage for this role!"];
      }
      
      // Add general suggestion with top missing keywords
      suggestions.push(`Add these key missing terms: ${missingKeywords.slice(0, 3).join(', ')}`);
      
      // Add category-specific suggestions
      if (categorizedKeywords.technical.length > 0) {
        suggestions.push(`Highlight technical skills like: ${categorizedKeywords.technical.slice(0, 3).join(', ')}`);
      }
      
      if (categorizedKeywords.soft.length > 0) {
        suggestions.push(`Incorporate soft skills such as: ${categorizedKeywords.soft.slice(0, 2).join(', ')}`);
      }
      
      if (categorizedKeywords.domain.length > 0) {
        suggestions.push(`Add domain knowledge in: ${categorizedKeywords.domain.slice(0, 2).join(', ')}`);
      }
      
      // Add general advice
      suggestions.push("Tailor your resume to match terminology used in the job description");
      
      return suggestions;
    };
    
    return {
      keywordMatches,
      missingKeywords: missingKeywords.slice(0, 10), // Increase to 10 missing keywords
      keywordScore,
      improvementSuggestions: generateSuggestions()
    };
  }

  async generateInterviewQuestions(resumeText: string, jobTitle?: string): Promise<{
    questions: Array<{
      category: string;
      question: string;
      tips: string[];
      resume_context?: string;
    }>;
  }> {
    try {
      console.log("Generating personalized interview questions...");
      // Extract key information from resume for personalized questions
      const jobTitles = await this.extractJobTitles(resumeText);
      const companies = await this.extractCompanies(resumeText);
      const skills = await this.extractSkills(resumeText);
      const achievements = await this.extractAchievements(resumeText);
      const projects = await this.extractProjects(resumeText);
      
      // Check if we have meaningful extracted data
      const hasValidData = (
        (jobTitles.length > 0 && jobTitles[0] !== 'Software Engineer') ||
        (companies.length > 0 && companies[0] !== 'No specific company identified') ||
        (skills.length > 0) ||
        (projects.length > 0 && projects[0] !== 'No specific projects identified')
      );
      
      console.log("Extracted resume information for personalized questions:", {
        jobTitles: jobTitles.slice(0, 3),
        companies: companies.slice(0, 3),
        skills: skills.slice(0, 5),
        projects: projects.slice(0, 3),
        achievements: achievements.slice(0, 2),
        hasValidData
      });
      
      // If we don't have meaningful data, use fallback immediately
      if (!hasValidData) {
        console.log("Insufficient resume data extracted, using fallback method");
        return await this.generateFallbackInterviewQuestions(resumeText, jobTitle);
      }

      // Enhance the prompt with more specific instructions for personalization
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `You are an expert interview coach specializing in highly personalized interview preparation. Generate interview questions that are deeply tailored to the candidate's specific resume details and the job they're applying for.
          
You MUST reference specific details from their resume such as:
- Exact job titles they've held
- Specific company names where they've worked
- Concrete projects they've completed (with technical details when available)
- Particular skills they possess (both technical and soft skills)
- Quantifiable achievements and results they've delivered

Distribute questions across these categories:
- 3-4 Technical/Skills questions that directly reference their listed technical skills and ask about implementation details, problem-solving approaches, or technical challenges
- 2-3 Behavioral questions that reference specific companies, teams, or situations from their work history
- 2-3 Project-based questions that ask about specific projects mentioned in their resume, focusing on their role, challenges, and outcomes
- 2-3 Experience questions that reference specific achievements or responsibilities
- 1-2 Role-specific questions that connect their past experience to the job they're applying for

Each question MUST:
1. Include specific details from their resume (names, technologies, metrics, etc.)
2. Be open-ended to encourage detailed responses
3. Focus on their unique experience rather than generic scenarios
4. Include practical tips for answering effectively
5. Reference exactly which part of their resume the question relates to

AVOID GENERIC QUESTIONS AT ALL COSTS. Every question must contain specific details from the resume.

Return JSON with this structure:
{
  "questions": [
    {
      "category": "string",
      "question": "string", 
      "tips": ["string", ...],
      "resume_context": "string" // What part of the resume this question relates to
    }
  ]
}`
        },
        {
          role: "user",
          content: `Resume: ${resumeText}\n\nJob Title: ${jobTitle || 'Software Engineer'}\n\nExtracted Information:\nJob Titles: ${jobTitles.join(', ')}\nCompanies: ${companies.join(', ')}\nSkills: ${skills.join(', ')}\nProjects: ${projects.join('; ')}\nAchievements: ${achievements.join('; ')}\n\nGenerate 10-15 highly personalized interview questions that specifically reference the candidate's experience, skills, projects, and achievements. Each question MUST include resume_context field explaining what part of the resume it relates to. DO NOT generate generic questions - every question must reference specific details from the resume.`
        }
      ]);

      // Validate the response
      if (!response?.choices?.[0]?.message?.content) {
        console.log("Empty or invalid response from AI, using fallback method");
        return await this.generateFallbackInterviewQuestions(resumeText, jobTitle);
      }
      
      // Try to parse the JSON response
      let result;
      try {
        result = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        console.log("Response content:", response.choices[0].message.content.substring(0, 200));
        return await this.generateFallbackInterviewQuestions(resumeText, jobTitle);
      }
      
      const questions = result.questions || [];
      
      // Check if we got meaningful questions
      if (questions.length === 0) {
        console.log("No questions returned from AI, using fallback method");
        return await this.generateFallbackInterviewQuestions(resumeText, jobTitle);
      }
      
      // Check if questions are personalized by looking for specific resume details
      const personalizedQuestions = questions.filter(q => {
        const questionText = q.question.toLowerCase();
        return (
          // Check for company names
          companies.some(company => company !== 'No specific company identified' && 
                                   questionText.includes(company.toLowerCase())) ||
          // Check for job titles
          jobTitles.some(title => title !== 'Software Engineer' && 
                                 questionText.includes(title.toLowerCase())) ||
          // Check for skills (at least one specific skill)
          skills.some(skill => questionText.includes(skill.toLowerCase())) ||
          // Check for project names
          projects.some(project => {
            const projectName = project.includes(':') ? project.split(':')[0] : project;
            return projectName !== 'No specific projects identified' && 
                   questionText.includes(projectName.toLowerCase());
          })
        );
      });
      
      // If less than 70% of questions are personalized, use fallback
      if (personalizedQuestions.length < questions.length * 0.7) {
        console.log("Insufficient personalization in AI questions, using fallback method");
        console.log(`Only ${personalizedQuestions.length} of ${questions.length} questions were personalized`);
        return await this.generateFallbackInterviewQuestions(resumeText, jobTitle);
      }
      
      // Enhance the questions with additional context if needed
      const enhancedQuestions = questions.map(question => {
        // Add more specific tips based on question category
        if (question.category === "Technical" && !question.tips.some(tip => tip.includes("example"))) {
          question.tips.push("Prepare a specific code or implementation example to illustrate your answer");
        }
        if (question.category === "Behavioral" && !question.tips.some(tip => tip.includes("STAR"))) {
          question.tips.push("Use the STAR method: Situation, Task, Action, Result");
        }
        return question;
      });
      
      // Ensure we have enough questions
      if (enhancedQuestions.length < 10) {
        console.log(`Only ${enhancedQuestions.length} questions from AI, adding fallback questions`);
        const fallbackQuestions = this.generateFallbackInterviewQuestions(resumeText, jobTitle).questions;
        // Filter fallback questions to avoid duplication with existing questions
        const filteredFallbacks = fallbackQuestions.filter(fallbackQ => 
          !enhancedQuestions.some(existingQ => {
            // Check for similarity in questions
            const fallbackWords = fallbackQ.question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const existingWords = existingQ.question.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const commonWords = fallbackWords.filter(w => existingWords.includes(w));
            // If more than 40% of significant words match, consider it a duplicate
            return commonWords.length > 0.4 * Math.min(fallbackWords.length, existingWords.length);
          })
        );
        
        const combinedQuestions = [...enhancedQuestions, ...filteredFallbacks];
        return { questions: combinedQuestions.slice(0, 15) };
      }
      
      return { questions: enhancedQuestions.slice(0, 15) };
    } catch (error) {
      console.error("Moonshot AI interview prep error:", error);
      return this.generateFallbackInterviewQuestions(resumeText, jobTitle);
    }
  }
  
  async extractJobTitles(text: string): Promise<string[]> {
    try {
      console.log("Attempting to extract job titles using AI...");
      // Try to extract job titles using AI with improved prompt
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `You are a specialized resume parser focused on extracting job titles.
          
Extract ALL job titles from the resume, including current and previous positions.
Look for patterns like:
- Lines with job titles followed by company names
- Sections labeled "Experience", "Work History", or "Employment"
- Job titles near dates (e.g., "Software Engineer | 2018-2020")
- Titles that appear after words like "as", "position", or "role"

Return ONLY a JSON array of strings containing the job titles without any additional text.
Example: ["Senior Software Engineer", "Frontend Developer", "IT Intern"]

Do not include:
- Company names
- Dates
- Locations
- Descriptions
- Any other text

If no job titles are found, return an empty array []`
        },
        {
          role: "user",
          content: `Extract job titles from this resume:\n\n${text}`
        }
      ]);

      console.log("AI response received for job titles");
      const responseContent = response.choices[0].message.content || "[]";
      console.log("Response content:", responseContent.substring(0, 100));
      
      let result;
      try {
        result = JSON.parse(responseContent);
        console.log("Successfully parsed job titles JSON:", result);
      } catch (parseError) {
        console.error("Failed to parse job titles JSON:", parseError);
        console.log("Attempting to extract JSON array from response text");
        
        // Try to extract JSON array from text if the response isn't properly formatted
        const jsonMatch = responseContent.match(/\[.*\]/s);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
            console.log("Extracted and parsed JSON array from text");
          } catch (e) {
            console.error("Failed to parse extracted JSON array");
            result = [];
          }
        } else {
          result = [];
        }
      }
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("AI job title extraction error:", error);
      // Enhanced fallback extraction
      console.log("Using enhanced fallback extraction for job titles");
      
      const commonTitles = [
        'software engineer', 'developer', 'programmer', 'architect', 'designer',
        'manager', 'director', 'analyst', 'consultant', 'specialist', 'lead',
        'administrator', 'devops', 'full stack', 'frontend', 'backend', 'data scientist',
        'engineer', 'technician', 'coordinator', 'supervisor', 'head of', 'chief',
        'cto', 'ceo', 'cfo', 'vp', 'vice president', 'president', 'founder',
        'intern', 'assistant', 'associate', 'senior', 'junior', 'principal',
        'project manager', 'product manager', 'program manager', 'scrum master'
      ];
      
      const titles = [];
      const lines = text.split('\n');
      
      // First pass: Look for experience section headers
      let experienceSection = false;
      let experienceSectionEndIndex = lines.length;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Detect start of experience section
        if (!experienceSection && 
            (lowerLine.includes('experience') || 
             lowerLine.includes('employment') || 
             lowerLine.includes('work history'))) {
          experienceSection = true;
          continue;
        }
        
        // Detect end of experience section (next major section)
        if (experienceSection && 
            (lowerLine.includes('education') || 
             lowerLine.includes('skills') || 
             lowerLine.includes('projects') || 
             lowerLine.includes('certifications'))) {
          experienceSectionEndIndex = i;
          break;
        }
      }
      
      // Second pass: Extract titles with priority to experience section
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        const lowercaseLine = line.toLowerCase();
        const inExperienceSection = experienceSection && i < experienceSectionEndIndex;
        
        // Check for job title patterns
        const hasTitle = commonTitles.some(title => lowercaseLine.includes(title));
        const hasYear = /20\d\d|19\d\d/.test(line);
        const hasDateRange = /\d{4}\s*(-|to|–)\s*\d{4}|\d{4}\s*(-|to|–)\s*(present|current|now)/i.test(line);
        const isPotentialTitle = line.length < 100 && 
                               (hasTitle || 
                                /^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) || // Proper noun pattern
                                /position|title|role/i.test(line));
        
        if (isPotentialTitle || (inExperienceSection && (hasYear || hasDateRange))) {
          // Extract the title, prioritizing known title keywords
          let extractedTitle = line;
          
          // If line has a common title, extract just that part with some context
          for (const title of commonTitles) {
            if (lowercaseLine.includes(title)) {
              const titleIndex = lowercaseLine.indexOf(title);
              const startIndex = Math.max(0, titleIndex - 10);
              const endIndex = Math.min(line.length, titleIndex + title.length + 20);
              
              // Extract and clean the title
              extractedTitle = line.substring(startIndex, endIndex)
                .replace(/^[^a-zA-Z]+/, '') // Remove leading non-alphabetic chars
                .replace(/\s*\d{4}.*$/, '') // Remove trailing dates
                .replace(/\s*at\s.*$/, '') // Remove "at Company"
                .replace(/\s*\|.*$/, '') // Remove pipe and following text
                .replace(/\s*-.*$/, '') // Remove dash and following text
                .trim();
              
              break;
            }
          }
          
          // Add if it's not already in the list and looks like a title
          if (extractedTitle && 
              !titles.includes(extractedTitle) && 
              extractedTitle.length > 3 && 
              extractedTitle.length < 50) {
            titles.push(extractedTitle);
          }
        }
      }
      
      console.log("Fallback extraction found job titles:", titles);
      return titles.length > 0 ? titles : ['Software Engineer'];
    }
  }
  
  async extractCompanies(text: string): Promise<string[]> {
    try {
      // Try to extract companies using AI
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `Extract company names from the resume. Return a JSON array of strings containing only the company names.`
        },
        {
          role: "user",
          content: `Extract company names from this resume:\n\n${text}`
        }
      ]);

      const result = JSON.parse(response.choices[0].message.content || "[]");
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("AI company extraction error:", error);
      // Fallback to regex extraction
      const companies = [];
      const lines = text.split('\n');
      
      // Look for lines that might contain company names
      for (const line of lines) {
        // Companies often appear after words like "at", "for", or with Inc, LLC, etc.
        if (/\bat\s+[A-Z][\w\s&]+|\bfor\s+[A-Z][\w\s&]+|[A-Z][\w\s&]+(Inc|LLC|Ltd|Corp|Company|Technologies|Solutions)/.test(line)) {
          const match = line.match(/\bat\s+([A-Z][\w\s&]+)|\bfor\s+([A-Z][\w\s&]+)|([A-Z][\w\s&]+(Inc|LLC|Ltd|Corp|Company|Technologies|Solutions))/);
          if (match) {
            const company = (match[1] || match[2] || match[3]).trim();
            if (company && !companies.includes(company) && company.length > 2 && company.length < 50) {
              companies.push(company);
            }
          }
        }
      }
      
      return companies.length > 0 ? companies : ['previous company'];
    }
  }
  
  async extractSkills(text: string): Promise<string[]> {
    try {
      console.log("Attempting to extract skills using AI...");
      // Try to extract skills using AI with improved prompt
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `You are a specialized resume parser focused on extracting skills.
          
Extract ALL technical and professional skills from the resume, including:
- Programming languages (Python, Java, JavaScript, etc.)
- Frameworks and libraries (React, Angular, Django, etc.)
- Tools and platforms (AWS, Docker, Kubernetes, etc.)
- Databases (SQL, MongoDB, PostgreSQL, etc.)
- Methodologies (Agile, Scrum, TDD, etc.)
- Soft skills (Leadership, Communication, Problem-solving, etc.)

Look for skills in:
- Skills/Technologies sections
- Project descriptions
- Work experience bullet points
- Education and certification sections

Return ONLY a JSON array of strings containing the skills without any additional text.
Example: ["JavaScript", "React", "Node.js", "AWS", "Agile", "Leadership"]

Do not include:
- Job titles
- Company names
- Descriptions
- Any other text

If no skills are found, return an empty array []`
        },
        {
          role: "user",
          content: `Extract skills from this resume:\n\n${text}`
        }
      ]);

      console.log("AI response received for skills");
      const responseContent = response.choices[0].message.content || "[]";
      console.log("Response content:", responseContent.substring(0, 100));
      
      let result;
      try {
        result = JSON.parse(responseContent);
        console.log("Successfully parsed skills JSON:", result);
      } catch (parseError) {
        console.error("Failed to parse skills JSON:", parseError);
        console.log("Attempting to extract JSON array from response text");
        
        // Try to extract JSON array from text if the response isn't properly formatted
        const jsonMatch = responseContent.match(/\[.*\]/s);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
            console.log("Extracted and parsed JSON array from text");
          } catch (e) {
            console.error("Failed to parse extracted JSON array");
            result = [];
          }
        } else {
          result = [];
        }
      }
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("AI skills extraction error:", error);
      // Enhanced fallback extraction
      console.log("Using enhanced fallback extraction for skills");
      
      const commonSkills = [
        // Programming languages
        'javascript', 'typescript', 'python', 'java', 'c#', 'c++', 'c', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
        'scala', 'perl', 'r', 'matlab', 'bash', 'powershell', 'shell', 'objective-c', 'dart', 'groovy', 'lua',
        
        // Web technologies
        'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind', 'material-ui', 'jquery', 'ajax', 'json', 'xml',
        'webpack', 'babel', 'eslint', 'prettier', 'npm', 'yarn', 'pnpm', 'vite', 'parcel',
        
        // Frontend frameworks
        'react', 'angular', 'vue', 'svelte', 'ember', 'backbone', 'next.js', 'nuxt', 'gatsby',
        'redux', 'mobx', 'recoil', 'zustand', 'context api', 'hooks',
        
        // Backend frameworks
        'node', 'express', 'koa', 'fastify', 'nest.js', 'django', 'flask', 'spring', 'spring boot',
        'asp.net', '.net core', '.net framework', 'laravel', 'symfony', 'rails', 'phoenix',
        
        // Databases
        'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'sqlite', 'firebase',
        'dynamodb', 'cassandra', 'redis', 'elasticsearch', 'neo4j', 'couchdb', 'mariadb',
        
        // Cloud & DevOps
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'github actions',
        'gitlab ci', 'travis ci', 'circle ci', 'terraform', 'ansible', 'puppet', 'chef',
        'serverless', 'lambda', 'ec2', 's3', 'rds', 'ecs', 'eks', 'fargate',
        
        // Project management & methodologies
        'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'jira', 'trello', 'asana',
        'confluence', 'git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial',
        
        // Data science & ML
        'machine learning', 'ai', 'artificial intelligence', 'data science', 'big data', 'analytics',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'scipy',
        'hadoop', 'spark', 'kafka', 'tableau', 'power bi', 'looker', 'dbt',
        
        // API & architecture
        'rest', 'graphql', 'soap', 'microservices', 'soa', 'grpc', 'websocket',
        'mvc', 'mvvm', 'event-driven', 'domain-driven', 'tdd', 'bdd',
        
        // Mobile
        'android', 'ios', 'react native', 'flutter', 'xamarin', 'ionic', 'cordova',
        'swift ui', 'kotlin multiplatform', 'jetpack compose',
        
        // Testing
        'unit testing', 'integration testing', 'e2e testing', 'jest', 'mocha', 'chai',
        'jasmine', 'karma', 'cypress', 'selenium', 'puppeteer', 'playwright',
        
        // Soft skills
        'leadership', 'communication', 'teamwork', 'problem solving', 'critical thinking',
        'time management', 'project management', 'mentoring', 'collaboration'
      ];
      
      // Add common abbreviations and variations
      const skillVariations = {
        'javascript': ['js'],
        'typescript': ['ts'],
        'python': ['py'],
        'react': ['reactjs', 'react.js'],
        'node': ['nodejs', 'node.js'],
        'express': ['expressjs', 'express.js'],
        'next.js': ['nextjs'],
        'vue': ['vuejs', 'vue.js'],
        'angular': ['angularjs', 'angular.js'],
        'continuous integration': ['ci'],
        'continuous deployment': ['cd'],
        'amazon web services': ['aws'],
        'google cloud platform': ['gcp'],
        'microsoft azure': ['azure'],
        'postgresql': ['postgres'],
        'mongodb': ['mongo'],
        'kubernetes': ['k8s'],
        'artificial intelligence': ['ai'],
        'machine learning': ['ml'],
        'test driven development': ['tdd'],
        'behavior driven development': ['bdd']
      };
      
      // Expand the skills list with variations
      for (const [skill, variations] of Object.entries(skillVariations)) {
        if (!commonSkills.includes(skill)) {
          commonSkills.push(skill);
        }
        for (const variation of variations) {
          if (!commonSkills.includes(variation)) {
            commonSkills.push(variation);
          }
        }
      }
      
      const skills = [];
      const lowerText = text.toLowerCase();
      
      // First look for a skills section
      const lines = text.split('\n');
      let inSkillsSection = false;
      let skillsSectionEndIndex = lines.length;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();
        
        // Detect start of skills section
        if (!inSkillsSection && 
            (lowerLine.includes('skills') || 
             lowerLine.includes('technologies') || 
             lowerLine.includes('technical proficiencies'))) {
          inSkillsSection = true;
          continue;
        }
        
        // Detect end of skills section (next major section)
        if (inSkillsSection && 
            (lowerLine.includes('experience') || 
             lowerLine.includes('education') || 
             lowerLine.includes('projects') || 
             lowerLine.includes('certifications'))) {
          skillsSectionEndIndex = i;
          break;
        }
        
        // Extract skills from skills section
        if (inSkillsSection && i < skillsSectionEndIndex) {
          // Look for comma or bullet separated skills
          if (line.includes(',') || line.includes('•') || line.includes('·') || line.includes('-')) {
            const separators = /[,•·\-]/g;
            const skillCandidates = line.split(separators).map(s => s.trim()).filter(s => s.length > 0);
            
            for (const candidate of skillCandidates) {
              if (candidate.length > 2 && candidate.length < 30 && !skills.includes(candidate)) {
                skills.push(candidate);
              }
            }
          }
        }
      }
      
      // Then check for common skills throughout the text
      for (const skill of commonSkills) {
        if (lowerText.includes(skill.toLowerCase())) {
          // Normalize skill name (use proper casing for known skills)
          const normalizedSkill = skill.toLowerCase() === skill ? skill : skill;
          
          if (!skills.includes(normalizedSkill)) {
            skills.push(normalizedSkill);
          }
        }
      }
      
      console.log("Fallback extraction found skills:", skills.slice(0, 10), "...");
      return skills.length > 0 ? skills : ['programming', 'development'];
    }
  }
  
  async extractAchievements(text: string): Promise<string[]> {
    try {
      // Try to extract achievements using AI
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `Extract quantifiable achievements and accomplishments from the resume. Return a JSON array of strings containing only the achievements.`
        },
        {
          role: "user",
          content: `Extract achievements from this resume:\n\n${text}`
        }
      ]);

      const result = JSON.parse(response.choices[0].message.content || "[]");
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("AI achievement extraction error:", error);
      // Fallback to regex extraction
      const achievements = [];
      const lines = text.split('\n');
      
      // Look for lines with quantifiable achievements
      for (const line of lines) {
        if (/increased|improved|reduced|saved|delivered|implemented|launched|led|managed|created|developed|\d+%|\$\d+|\d+ users|\d+ customers/.test(line.toLowerCase())) {
          if (line.length > 20 && line.length < 200 && !achievements.includes(line.trim())) {
            achievements.push(line.trim());
          }
        }
      }
      
      return achievements.length > 0 ? achievements : ['past achievement or project'];
    }
  }
  
  async extractProjects(text: string): Promise<string[]> {
    try {
      console.log("Attempting to extract projects using AI...");
      // Try to extract projects using AI with improved prompt
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `You are a specialized resume parser focused on extracting projects.
          
Extract ALL projects from the resume, including:
- Personal projects
- Professional projects
- Academic projects
- Open source contributions

Look for projects in:
- Dedicated "Projects" sections
- Work experience descriptions
- Portfolio mentions
- GitHub/repository links

For each project, include:
- Project name
- A very brief (1-2 sentence) description if available

Return ONLY a JSON array of strings, each containing a project name and optionally a brief description.
Example: ["E-commerce Platform: Built a full-stack online store with React and Node.js", "Inventory Management System: Automated tracking for warehouse operations"]

Do not include:
- Job titles
- Company names (unless part of the project name)
- Dates
- Any other text

If no projects are found, return an empty array []`
        },
        {
          role: "user",
          content: `Extract projects from this resume:\n\n${text}`
        }
      ]);

      console.log("AI response received for projects");
      const responseContent = response.choices[0].message.content || "[]";
      console.log("Response content:", responseContent.substring(0, 100));
      
      let result;
      try {
        result = JSON.parse(responseContent);
        console.log("Successfully parsed projects JSON:", result);
      } catch (parseError) {
        console.error("Failed to parse projects JSON:", parseError);
        console.log("Attempting to extract JSON array from response text");
        
        // Try to extract JSON array from text if the response isn't properly formatted
        const jsonMatch = responseContent.match(/\[.*\]/s);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
            console.log("Extracted and parsed JSON array from text");
          } catch (e) {
            console.error("Failed to parse extracted JSON array");
            result = [];
          }
        } else {
          result = [];
        }
      }
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("AI project extraction error:", error);
      // Enhanced fallback extraction
      console.log("Using enhanced fallback extraction for projects");
      
      const projects = [];
      const lines = text.split('\n');
      
      // First pass: Look for projects section
      let inProjectsSection = false;
      let projectsSectionEndIndex = lines.length;
      let currentProject = "";
      let projectDescription = "";
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        const lowerLine = line.toLowerCase();
        
        // Detect start of projects section
        if (!inProjectsSection && 
            (lowerLine.includes('project') && 
             (lowerLine.startsWith('project') || 
              lowerLine.endsWith('project') || 
              lowerLine.endsWith('projects') || 
              lowerLine.includes('project experience')))) {
          inProjectsSection = true;
          continue;
        }
        
        // Detect end of projects section (next major section)
        if (inProjectsSection && 
            (lowerLine.includes('experience') || 
             lowerLine.includes('education') || 
             lowerLine.includes('skills') || 
             lowerLine.includes('certifications'))) {
          projectsSectionEndIndex = i;
          
          // Save the last project if there's one in progress
          if (currentProject.length > 0) {
            const fullProject = projectDescription.length > 0 ? 
              `${currentProject}: ${projectDescription}` : currentProject;
            
            if (!projects.includes(fullProject)) {
              projects.push(fullProject);
            }
            
            currentProject = "";
            projectDescription = "";
          }
          
          break;
        }
        
        // Extract projects from projects section
        if (inProjectsSection && i < projectsSectionEndIndex) {
          // Check if this line looks like a project title
          const isPotentialProjectTitle = 
            (line.length < 80 && 
             (line.endsWith(':') || 
              /^[A-Z][^\s]*/.test(line) || // Starts with capital letter
              line.includes('project') || 
              line.includes('app') || 
              line.includes('system') || 
              line.includes('platform') || 
              line.includes('website') || 
              line.includes('application')));
          
          if (isPotentialProjectTitle) {
            // Save previous project if there was one
            if (currentProject.length > 0) {
              const fullProject = projectDescription.length > 0 ? 
                `${currentProject}: ${projectDescription}` : currentProject;
              
              if (!projects.includes(fullProject)) {
                projects.push(fullProject);
              }
            }
            
            // Start new project
            currentProject = line.replace(/:$/, '').trim();
            projectDescription = "";
          } else if (currentProject.length > 0) {
            // This is likely a description for the current project
            if (projectDescription.length === 0) {
              projectDescription = line;
            } else if (projectDescription.length < 100) {
              // Only add more to the description if it's still reasonably short
              projectDescription += " " + line;
            }
          }
        }
      }
      
      // Second pass: Look for project indicators throughout the text
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0 || line.length > 150) continue;
        
        const lowerLine = line.toLowerCase();
        
        // Look for project indicators in the text
        if ((lowerLine.includes('project') || 
             lowerLine.includes('developed') || 
             lowerLine.includes('created') || 
             lowerLine.includes('built') || 
             lowerLine.includes('implemented') || 
             lowerLine.includes('designed') || 
             lowerLine.includes('architected')) && 
            line.length > 15 && 
            line.length < 150
        ) {
          // Extract project name and brief description
          let projectInfo = line.trim();
          
          // If it's a project header, try to get the next line for more context
          if (projectInfo.length < 50 && lines.indexOf(line) < lines.length - 1) {
            const nextLine = lines[lines.indexOf(line) + 1];
            if (nextLine && nextLine.trim().length > 0 && !nextLine.toLowerCase().includes('project')) {
              projectInfo += ': ' + nextLine.trim();
            }
          }
          
          if (!projects.includes(projectInfo)) {
            projects.push(projectInfo);
          }
        }
      }
      
      // Third pass: Look for bullet points that might describe projects
      let potentialProjectBullets = [];
      let inBulletList = false;
      let bulletListContext = "";
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Check if this is a bullet point
        const isBulletPoint = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line);
        
        if (isBulletPoint) {
          // If this is the first bullet point, check the preceding line for context
          if (!inBulletList && i > 0) {
            bulletListContext = lines[i-1].trim();
          }
          
          inBulletList = true;
          
          // Check if this bullet point describes a project
          const cleanedLine = line.replace(/^[•\-*\d\.]+\s*/, '').trim();
          if (cleanedLine.length > 15 && 
              (cleanedLine.includes('project') || 
               cleanedLine.includes('developed') || 
               cleanedLine.includes('created') || 
               cleanedLine.includes('built') || 
               cleanedLine.includes('implemented') || 
               cleanedLine.includes('designed') || 
               cleanedLine.includes('application') || 
               cleanedLine.includes('system') || 
               cleanedLine.includes('platform'))) {
            
            // If we have context, add it to the project description
            let projectEntry = cleanedLine;
            if (bulletListContext && 
                bulletListContext.length > 0 && 
                bulletListContext.length < 80 && 
                !projects.includes(`${bulletListContext}: ${cleanedLine}`)) {
              projectEntry = `${bulletListContext}: ${cleanedLine}`;
            }
            
            if (!potentialProjectBullets.includes(projectEntry)) {
              potentialProjectBullets.push(projectEntry);
            }
          }
        } else if (inBulletList && line.length > 0) {
          // Check if this is the end of the bullet list
          inBulletList = false;
          bulletListContext = "";
        }
      }
      
      // Add potential project bullets to projects list
      for (const bullet of potentialProjectBullets) {
        if (!projects.includes(bullet)) {
          projects.push(bullet);
        }
      }
      
      // Fourth pass: Look for GitHub repositories or portfolio links
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue;
        
        // Check for GitHub or portfolio links
        if ((line.includes('github.com') || 
             line.includes('gitlab.com') || 
             line.toLowerCase().includes('repository') || 
             line.toLowerCase().includes('portfolio')) && 
            line.length < 150) {
          
          // Extract repository name if possible
          let repoInfo = line;
          const repoMatch = line.match(/github\.com\/[\w-]+\/([\w-]+)/i);
          if (repoMatch && repoMatch[1]) {
            // Format the repository name nicely
            const repoName = repoMatch[1].replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
            repoInfo = `GitHub Project: ${repoName.charAt(0).toUpperCase() + repoName.slice(1)}`;
          }
          
          if (!projects.includes(repoInfo)) {
            projects.push(repoInfo);
          }
        }
      }
      
      return projects.length > 0 ? projects : ['No specific projects identified'];
    }
  }

  private async generateFallbackInterviewQuestions(resumeText: string, jobTitle?: string) {
    console.log("Generating personalized fallback interview questions");
    const text = resumeText.toLowerCase();
    const questions = [];
    
    // Extract information from resume for personalized questions
    const jobTitles = await this.extractJobTitles(resumeText);
    const companies = await this.extractCompanies(resumeText);
    const skills = await this.extractSkills(resumeText);
    const achievements = await this.extractAchievements(resumeText);
    const projects = await this.extractProjects(resumeText);
    
    console.log("Extracted resume information for fallback questions:", {
      jobTitles: jobTitles.slice(0, 3),
      companies: companies.slice(0, 3),
      skills: skills.slice(0, 5),
      projects: projects.slice(0, 3),
      achievements: achievements.slice(0, 2)
    });

    // Generate personalized behavioral questions based on companies and job titles
    if (companies.length > 0 && companies[0] !== 'No specific company identified') {
      // Add company-specific questions for each company (up to 2)
      for (let i = 0; i < Math.min(companies.length, 2); i++) {
        questions.push({
          category: "Behavioral",
          question: `During your time at ${companies[i]}, what was the most significant challenge you faced and how did you overcome it?`,
          tips: [
            "Use the STAR method (Situation, Task, Action, Result)",
            "Focus on a specific project or initiative",
            "Highlight your problem-solving approach"
          ],
          resume_context: `Work experience at ${companies[i]} mentioned in resume`
        });
      }
      
      // Add leadership/teamwork question if multiple companies
      if (companies.length >= 2) {
        questions.push({
          category: "Leadership",
          question: `How would you compare the team cultures at ${companies[0]} and ${companies[1]}? What leadership approaches were most effective in each environment?`,
          tips: [
            "Compare and contrast specific aspects of each company culture",
            "Discuss how you adapted your working style to each environment",
            "Highlight specific leadership techniques that worked well"
          ],
          resume_context: `Work experience at both ${companies[0]} and ${companies[1]} mentioned in resume`
        });
      }
    }
    
    // Generate job title specific questions
    if (jobTitles.length > 0 && jobTitles[0] !== 'Software Engineer') {
      // For each job title (up to 2), create a specific question
      for (let i = 0; i < Math.min(jobTitles.length, 2); i++) {
        const title = jobTitles[i];
        
        // Create different question types based on the job title
        if (title.toLowerCase().includes('senior') || title.toLowerCase().includes('lead') || title.toLowerCase().includes('manager')) {
          questions.push({
            category: "Leadership",
            question: `As a ${title}, describe a situation where you had to make a difficult decision that impacted your team or project. What was your decision-making process?`,
            tips: [
              "Explain the context and constraints you were working with",
              "Detail your analysis and the factors you considered",
              "Discuss the outcome and what you learned from the experience"
            ],
            resume_context: `${title} role mentioned in resume`
          });
        } else {
          questions.push({
            category: "Role-specific",
            question: `In your role as ${title}, what was the most innovative solution you implemented and what impact did it have?`,
            tips: [
              "Describe the specific problem you were trying to solve",
              "Explain what made your solution innovative",
              "Quantify the results if possible"
            ],
            resume_context: `${title} role mentioned in resume`
          });
        }
      }
    }

    // Generate skill-specific technical questions
    if (skills.length > 0) {
      // Group skills by category for better question generation
      const programmingLanguages = skills.filter(skill => 
        ['javascript', 'python', 'java', 'c#', 'c++', 'typescript', 'go', 'ruby', 'php', 'swift', 'kotlin'].some(lang => 
          skill.toLowerCase().includes(lang)
        )
      );
      
      const frameworks = skills.filter(skill => 
        ['react', 'angular', 'vue', 'django', 'flask', 'spring', 'express', 'node', '.net', 'laravel', 'rails'].some(framework => 
          skill.toLowerCase().includes(framework)
        )
      );
      
      const databases = skills.filter(skill => 
        ['sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'dynamodb', 'firebase', 'redis'].some(db => 
          skill.toLowerCase().includes(db)
        )
      );
      
      const cloudTech = skills.filter(skill => 
        ['aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'serverless', 'lambda'].some(tech => 
          skill.toLowerCase().includes(tech)
        )
      );
      
      // Generate language-specific questions
      if (programmingLanguages.length > 0) {
        const lang = programmingLanguages[0];
        questions.push({
          category: "Technical",
          question: `You've listed ${lang} as one of your skills. Describe a complex problem you solved using ${lang} and explain your approach to the solution.`,
          tips: [
            "Provide specific technical details about the implementation",
            "Explain any libraries or frameworks you utilized",
            "Discuss performance considerations and trade-offs"
          ],
          resume_context: `${lang} skill mentioned in resume`
        });
      }
      
      // Generate framework-specific questions
      if (frameworks.length > 0) {
        const framework = frameworks[0];
        questions.push({
          category: "Technical",
          question: `How have you leveraged ${framework} in your previous projects? What specific features or patterns did you implement?`,
          tips: [
            "Discuss specific components or modules you built",
            "Explain architectural decisions you made",
            "Mention any performance optimizations you implemented"
          ],
          resume_context: `${framework} skill mentioned in resume`
        });
      }
      
      // Generate database-specific questions
      if (databases.length > 0) {
        const db = databases[0];
        questions.push({
          category: "Technical",
          question: `With your experience in ${db}, how would you design a database schema for a system that needs to handle high-volume transactions while maintaining data integrity?`,
          tips: [
            "Discuss normalization and denormalization trade-offs",
            "Explain indexing strategies you would implement",
            "Address scaling and performance considerations"
          ],
          resume_context: `${db} skill mentioned in resume`
        });
      }
      
      // Generate cloud/DevOps questions
      if (cloudTech.length > 0) {
        const tech = cloudTech[0];
        questions.push({
          category: "Technical",
          question: `Based on your experience with ${tech}, how would you design a scalable and resilient architecture for a mission-critical application?`,
          tips: [
            "Discuss specific services or components you would use",
            "Explain your approach to high availability and disaster recovery",
            "Address security considerations in your design"
          ],
          resume_context: `${tech} skill mentioned in resume`
        });
      }
    }
    
    // Generate project-specific questions
    if (projects.length > 0 && projects[0] !== 'No specific projects identified') {
      // Add questions for up to 2 projects
      for (let i = 0; i < Math.min(projects.length, 2); i++) {
        const project = projects[i];
        const projectName = project.includes(':') ? project.split(':')[0] : project;
        
        questions.push({
          category: "Project",
          question: `Regarding your ${projectName} project, what were the most significant technical challenges you faced and how did you overcome them?`,
          tips: [
            "Describe the specific technical problems in detail",
            "Explain your problem-solving process and alternatives you considered",
            "Highlight the technical skills you applied to solve the issues"
          ],
          resume_context: `Project mentioned in resume: ${project}`
        });
        
        // Add a different type of question for the second project
        if (i === 1) {
          questions.push({
            category: "Project",
            question: `For your ${projectName} project, how did you approach collaboration with other team members and stakeholders?`,
            tips: [
              "Discuss your communication strategies",
              "Explain how you handled disagreements or conflicting priorities",
              "Highlight your role in ensuring project success through teamwork"
            ],
            resume_context: `Project mentioned in resume: ${project}`
          });
        }
      }
    }

    // Leadership/Experience questions
    if (text.includes('lead') || text.includes('manage') || text.includes('senior')) {
      questions.push(
        {
          category: "Leadership",
          question: "How do you prioritize tasks when managing multiple projects?",
          tips: [
            "Mention specific methodologies (Agile, Kanban)",
            "Discuss stakeholder communication",
            "Show understanding of business impact"
          ],
          resume_context: "Leadership experience mentioned in resume"
        },
        {
          category: "Leadership",
          question: "Describe your approach to mentoring junior developers.",
          tips: [
            "Show patience and teaching skills",
            "Discuss knowledge sharing practices",
            "Mention code review processes"
          ],
          resume_context: "Senior/leadership role mentioned in resume"
        }
      );
    }

    // Problem-solving questions
    questions.push(
      {
        category: "Problem Solving",
        question: "Walk me through how you would debug a performance issue in a web application.",
        tips: [
          "Start with gathering information and metrics",
          "Mention specific tools (Chrome DevTools, profilers)",
          "Show systematic problem-solving approach"
        ],
        resume_context: "Technical troubleshooting skills implied in resume"
      },
      {
        category: "Problem Solving",
        question: "How would you approach learning a new technology or framework?",
        tips: [
          "Show continuous learning mindset",
          "Mention documentation, tutorials, and practice projects",
          "Discuss how you stay updated with industry trends"
        ],
        resume_context: "Technical adaptability implied from resume skills"
      }
    );

    // Job title specific question
    if (jobTitles.length > 0 && jobTitles[0] !== 'Software Engineer') {
      questions.push({
        category: "Role-Specific",
        question: `How has your experience as a ${jobTitles[0]} prepared you for this ${jobTitle || 'Software Engineer'} role?`,
        tips: [
          "Highlight transferable skills",
          "Discuss relevant accomplishments",
          "Show career progression"
        ],
        resume_context: `Previous job title in resume: ${jobTitles[0]}`
      });
    }

    // Company/Role specific
    questions.push({
      category: "Role-Specific",
      question: `Why are you interested in this ${jobTitle || 'Software Engineer'} position?`,
      tips: [
        "Research the company and role thoroughly",
        "Connect your experience to their needs",
        "Show enthusiasm for their mission/products"
      ],
      resume_context: `Based on target job title: ${jobTitle || 'Software Engineer'}`
    });

    return {
      questions: questions.slice(0, 10)
    };
  }
  async analyzeResumeContent(resumeText: string): Promise<{
    contentScore: number;
    improvements: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      suggestions: string[];
    }>;
    sectionCompleteness: Array<{
      section: string;
      status: 'complete' | 'incomplete' | 'missing';
      suggestions?: string[];
    }>;
  }> {
    try {
      const response = await callMoonshotAPI([
        {
          role: "system",
          content: `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the resume content and provide detailed feedback in JSON format.

Focus on:
1. Content quality and clarity
2. Section completeness 
3. Achievement quantification
4. Action verb usage
5. Professional language

Return JSON with this structure:
{
  "contentScore": number (0-100),
  "improvements": [
    {
      "priority": "high|medium|low",
      "category": "string",
      "title": "string", 
      "description": "string",
      "suggestions": ["string", ...]
    }
  ],
  "sectionCompleteness": [
    {
      "section": "string",
      "status": "complete|incomplete|missing",
      "suggestions": ["string", ...] (optional)
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze this resume:\n\n${resumeText}`
        }
      ]);

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        contentScore: Math.max(0, Math.min(100, result.contentScore || 50)),
        improvements: result.improvements || [],
        sectionCompleteness: result.sectionCompleteness || [],
      };
    } catch (error) {
      console.error("AI analysis error:", error);
      // Return realistic fallback analysis based on resume text
      return this.generateFallbackAnalysis(resumeText);
    }
  }

  async compareWithJobDescription(resumeText: string, jobDescription: string): Promise<{
    keywordMatches: string[];
    missingKeywords: string[];
    keywordScore: number;
    improvementSuggestions: string[];
  }> {
    try {
      const response = await callMoonshotAPI([
        {
          role: "system", 
          content: `You are an expert at keyword analysis for ATS systems. Compare a resume against a job description and identify keyword matches and gaps.

Return JSON with this structure:
{
  "keywordMatches": ["string", ...],
  "missingKeywords": ["string", ...],
  "keywordScore": number (0-100),
  "improvementSuggestions": ["string", ...]
}`
        },
        {
          role: "user",
          content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nAnalyze keyword match and provide recommendations.`
        }
      ]);

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        keywordMatches: result.keywordMatches || [],
        missingKeywords: result.missingKeywords || [],
        keywordScore: Math.max(0, Math.min(100, result.keywordScore || 50)),
        improvementSuggestions: result.improvementSuggestions || []
      };
    } catch (error) {
      console.error("AI keyword analysis error:", error);
      // Return realistic fallback keyword analysis
      return this.generateFallbackKeywordAnalysis(resumeText, jobDescription);
    }
  }
}
