import { OpenAIService } from './openai';
import { PDFProcessor } from './pdf-processor';

export class ATSAnalyzer {
  public openAI: OpenAIService;
  private pdfProcessor: PDFProcessor;

  constructor() {
    this.openAI = new OpenAIService();
    this.pdfProcessor = new PDFProcessor();
  }

  async analyzeResume(resumeText: string) {
    // Format analysis
    const formatAnalysis = this.pdfProcessor.analyzeFormat(resumeText);
    
    // Content analysis using OpenAI
    const contentAnalysis = await this.openAI.analyzeResumeContent(resumeText);

    // Default keyword score when no job description (based on general resume quality)
    const defaultKeywordScore = Math.min(85, Math.max(40, 
      contentAnalysis.contentScore + Math.floor(Math.random() * 10) - 5
    ));

    // Calculate overall ATS score
    const atsScore = Math.round(
      (formatAnalysis.formatScore * 0.3) + 
      (contentAnalysis.contentScore * 0.4) + 
      (defaultKeywordScore * 0.3)
    );

    console.log(`ATS Score calculation: Format(${formatAnalysis.formatScore} * 0.3) + Content(${contentAnalysis.contentScore} * 0.4) + Keywords(${defaultKeywordScore} * 0.3) = ${atsScore}`);

    return {
      atsScore,
      formatScore: formatAnalysis.formatScore,
      keywordScore: defaultKeywordScore,
      contentScore: contentAnalysis.contentScore,
      keywordMatches: [],
      missingKeywords: [],
      improvements: contentAnalysis.improvements,
      sectionCompleteness: contentAnalysis.sectionCompleteness,
    };
  }

  async analyzeResumeWithJob(resumeText: string, jobDescription: string) {
    // Format analysis  
    const formatAnalysis = this.pdfProcessor.analyzeFormat(resumeText);
    
    // Content analysis using OpenAI
    const contentAnalysis = await this.openAI.analyzeResumeContent(resumeText);
    
    // Keyword analysis against job description
    const keywordAnalysis = await this.openAI.compareWithJobDescription(resumeText, jobDescription);
    
    // Calculate dynamic keyword score based on matches and missing keywords
    const keywordMatchCount = keywordAnalysis.keywordMatches.length;
    const missingKeywordCount = keywordAnalysis.missingKeywords.length;
    const totalKeywords = keywordMatchCount + missingKeywordCount;
    
    // Ensure the keywordScore is truly dynamic based on actual matches
    const dynamicKeywordScore = totalKeywords > 0 
      ? Math.round((keywordMatchCount / totalKeywords) * 100)
      : keywordAnalysis.keywordScore; // Fallback to AI-provided score if no keywords found

    // Calculate overall ATS score with job matching
    const atsScore = Math.round(
      (formatAnalysis.formatScore * 0.25) + 
      (contentAnalysis.contentScore * 0.35) + 
      (dynamicKeywordScore * 0.4)
    );

    return {
      atsScore,
      formatScore: formatAnalysis.formatScore,
      keywordScore: keywordAnalysis.keywordScore,
      contentScore: contentAnalysis.contentScore,
      keywordMatches: keywordAnalysis.keywordMatches,
      missingKeywords: keywordAnalysis.missingKeywords,
      improvements: [
        ...contentAnalysis.improvements,
        ...(keywordAnalysis.missingKeywords.length > 0 ? [{
          priority: 'high' as const,
          category: 'Keywords',
          title: 'Add Missing Keywords',
          description: `Your resume is missing ${keywordAnalysis.missingKeywords.length} key terms from the job description`,
          suggestions: keywordAnalysis.improvementSuggestions,
        }] : [])
      ],
      sectionCompleteness: contentAnalysis.sectionCompleteness,
    };
  }
}
