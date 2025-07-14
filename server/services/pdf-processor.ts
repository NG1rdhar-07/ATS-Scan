import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// For DOCX support
const mammoth = require('mammoth');

// For better text extraction
const textract = require('textract');

export class PDFProcessor {
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      console.log(`Extracting text from file with mime type: ${mimeType}, buffer size: ${buffer.length} bytes`);
      
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty file buffer received');
      }
      
      // Try primary extraction method based on file type
      let extractedText = '';
      
      if (mimeType === 'application/pdf') {
        try {
          // First try with pdf-parse
          const data = await pdfParse(buffer);
          if (data && data.text && data.text.trim().length > 0) {
            extractedText = data.text;
            console.log(`Successfully extracted ${extractedText.length} characters from PDF using pdf-parse`);
          } else {
            // If pdf-parse fails to extract meaningful text, try textract as fallback
            extractedText = await this.extractWithTextract(buffer, mimeType);
          }
        } catch (pdfError) {
          console.error('PDF parsing error with pdf-parse:', pdfError);
          // Try textract as fallback
          extractedText = await this.extractWithTextract(buffer, mimeType);
        }
      } else if (mimeType === 'text/plain') {
        // Handle plain text files
        extractedText = buffer.toString('utf-8');
        console.log(`Successfully extracted ${extractedText.length} characters from text file`);
      } else if (mimeType === 'application/msword' || 
                 mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // Try mammoth for DOCX files
          if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
            console.log(`Successfully extracted ${extractedText.length} characters from DOCX using mammoth`);
          } else {
            // For DOC files or if mammoth fails, try textract
            extractedText = await this.extractWithTextract(buffer, mimeType);
          }
        } catch (docError) {
          console.error('DOCX/DOC parsing error:', docError);
          // Try textract as fallback
          extractedText = await this.extractWithTextract(buffer, mimeType);
        }
      } else {
        throw new Error(`Unsupported file format: ${mimeType}`);
      }
      
      // Validate extracted text
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Could not extract any text from the document');
      }
      
      // Clean up the extracted text
      extractedText = this.cleanExtractedText(extractedText);
      
      console.log(`Final extracted text: ${extractedText.length} characters`);
      return extractedText;
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Use textract as a fallback extraction method
  private extractWithTextract(buffer: Buffer, mimeType: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        preserveLineBreaks: true,
        preserveOnlyMultipleLineBreaks: false
      };
      
      textract.fromBufferWithMime(mimeType, buffer, options, (error: Error, text: string) => {
        if (error) {
          console.error('Textract extraction error:', error);
          reject(error);
        } else {
          console.log(`Successfully extracted ${text.length} characters using textract`);
          resolve(text);
        }
      });
    });
  }
  
  // Clean up extracted text to improve quality
  private cleanExtractedText(text: string): string {
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ');
    
    // Restore paragraph breaks
    cleaned = cleaned.replace(/\. /g, '.\n');
    
    // Remove any non-printable characters
    cleaned = cleaned.replace(/[^\x20-\x7E\n\r\t]/g, '');
    
    return cleaned.trim();
  }

  // Basic format analysis
  analyzeFormat(text: string): {
    formatScore: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for proper sections
    const sections = ['experience', 'education', 'skills', 'summary', 'contact'];
    const foundSections = sections.filter(section => 
      text.toLowerCase().includes(section)
    );

    if (foundSections.length < 3) {
      score -= 20;
      issues.push('Missing essential sections');
      suggestions.push('Add missing sections like Experience, Education, or Skills');
    }

    // Check for bullet points
    const bulletCount = (text.match(/[•·-]/g) || []).length;
    if (bulletCount < 5) {
      score -= 15;
      issues.push('Few bullet points detected');
      suggestions.push('Use bullet points to organize information clearly');
    }

    // Check for phone/email
    const hasEmail = /\S+@\S+\.\S+/.test(text);
    const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(text);
    
    if (!hasEmail) {
      score -= 10;
      issues.push('No email address found');
      suggestions.push('Include a professional email address');
    }

    if (!hasPhone) {
      score -= 10;
      issues.push('No phone number found');
      suggestions.push('Include a phone number for contact');
    }

    // Check length
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 200) {
      score -= 15;
      issues.push('Resume appears too short');
      suggestions.push('Expand your experience and achievements');
    } else if (wordCount > 800) {
      score -= 10;
      issues.push('Resume may be too long');
      suggestions.push('Consider condensing to 1-2 pages');
    }

    return {
      formatScore: Math.max(0, score),
      issues,
      suggestions,
    };
  }
}
