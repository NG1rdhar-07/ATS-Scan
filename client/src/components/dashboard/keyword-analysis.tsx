import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, TrendingUp, PlusCircle, AlertCircle, CheckCircle, BarChart, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KeywordCloud } from "@/components/ui/keyword-cloud";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@/lib/api";
import { type Analysis } from "@shared/schema";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface KeywordAnalysisProps {
  analysis: Analysis;
  resumeId?: string;
}

export function KeywordAnalysis({ analysis, resumeId }: KeywordAnalysisProps) {
  const [jobDescription, setJobDescription] = useState(analysis.jobDescription || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update job description when analysis changes
  useEffect(() => {
    if (analysis && analysis.jobDescription) {
      setJobDescription(analysis.jobDescription);
    }
  }, [analysis]);
  
  // Initialize component when it becomes visible
  useEffect(() => {
    // Ensure we have the latest data when this component mounts
    if (resumeId) {
      // Invalidate and refetch the analysis to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", resumeId, "analysis"] });
      
      // If we have missing keywords but no job description, we might need to refresh
      if (analysis && (!analysis.keywordMatches || analysis.keywordMatches.length === 0) && 
          (!analysis.missingKeywords || analysis.missingKeywords.length === 0) && 
          jobDescription) {
        // Auto-analyze if we have a job description but no keyword analysis
        handleAnalyze();
      }
    }
  }, [resumeId, queryClient]);

  const analyzeMutation = useMutation({
    mutationFn: async (jobDesc: string) => {
      // Use the api.analyzeResume function instead of directly calling the endpoint
      if (!resumeId) throw new Error("No resume ID provided");
      return api.analyzeResume(resumeId, jobDesc);
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "Keyword analysis updated successfully.",
      });
      // Invalidate and refetch the analysis
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", resumeId, "analysis"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze keywords",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please paste a job description to analyze keywords.",
        variant: "destructive",
      });
      return;
    }
    
    if (!resumeId) {
      toast({
        title: "Missing Resume ID",
        description: "Cannot analyze without a valid resume.",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure we're passing the current job description
    analyzeMutation.mutate(jobDescription);
  };

  const handleClearJob = () => {
    setJobDescription("");
    toast({
      title: "Job Description Cleared",
      description: "You can now enter a new job description.",
    });
  };

  // Calculate keyword match statistics
  const keywordMatch = analysis.keywordMatches?.length || 0;
  const missingKeywords = analysis.missingKeywords?.length || 0;
  const totalKeywords = keywordMatch + missingKeywords;
  const matchPercentage = totalKeywords > 0 ? Math.round((keywordMatch / totalKeywords) * 100) : 0;
  
  // Target score indicators
  const targetScore = 80; // Target keyword match percentage
  const isTargetReached = matchPercentage >= targetScore;
  
  // Calculate keyword density for found keywords
  const [keywordDensity, setKeywordDensity] = useState<Record<string, number>>({});
  
  // Get resume text from the analysis
  const resumeText = analysis?.originalText || "";
  
  // Calculate actual keyword density based on resume text
  useEffect(() => {
    if (analysis.keywordMatches && analysis.keywordMatches.length > 0 && resumeText) {
      const density: Record<string, number> = {};
      const wordCount = resumeText.split(/\s+/).length;
      
      analysis.keywordMatches.forEach(keyword => {
        // Count occurrences of the keyword in the resume text (case insensitive)
        const regex = new RegExp(keyword, 'gi');
        const matches = resumeText.match(regex) || [];
        const count = matches.length;
        
        // Calculate density as percentage of total words
        density[keyword] = wordCount > 0 ? (count / wordCount) * 100 : 0;
      });
      
      setKeywordDensity(density);
    }
  }, [analysis.keywordMatches, resumeText]);
  
  // Prepare keyword cloud data with weights based on actual density
  const cloudKeywords = [
    ...(analysis.keywordMatches?.map(keyword => ({
      text: keyword,
      weight: keywordDensity[keyword] ? keywordDensity[keyword] * 10 : 5, // Use actual density or default
      found: true,
      status: "found"
    })) || []),
    ...(analysis.missingKeywords?.map(keyword => ({
      text: keyword,
      // Make missing keywords more prominent for visibility
      weight: 8,
      found: false,
      status: "missing"
    })) || []),
  ];
  
  // Identify partial matches by checking for similar words in resume
  const partialMatches = useMemo(() => {
    if (!analysis.missingKeywords || !resumeText) return [];
    
    const resumeLower = resumeText.toLowerCase();
    
    // Find missing keywords that have parts present in the resume
    return analysis.missingKeywords
      .filter(keyword => {
        // For multi-word keywords, check if any significant part exists
        if (keyword.includes(' ')) {
          const parts = keyword.toLowerCase().split(/\s+/);
          return parts.some(part => 
            part.length > 3 && // Only consider meaningful parts
            new RegExp(`\\b${part}\\b`, 'i').test(resumeLower)
          );
        } 
        // For single-word keywords, check for similar words using stemming/partial matching
        else {
          // Check for word variations (e.g., plural forms, different tenses)
          const keywordBase = keyword.toLowerCase().replace(/s$|ing$|ed$/, '');
          if (keywordBase.length < 4) return false; // Skip very short base words
          
          // Look for the base form in the resume
          return new RegExp(`\\b${keywordBase}\\w*\\b`, 'i').test(resumeLower);
        }
      })
      .slice(0, 8) // Increase limit to 8 partial matches
      .map(keyword => ({
        text: keyword,
        weight: 7, // Increase weight for better visibility
        found: false,
        status: "partial"
      }));
  }, [analysis.missingKeywords, resumeText]);
  
  // Add partial matches to cloud keywords
  const enhancedCloudKeywords = [...cloudKeywords, ...partialMatches];
  
  // Selected keyword for suggestion dialog
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("cloud");

  // Function to handle keyword suggestion dialog
  const handleKeywordClick = (keyword: string) => {
    setSelectedKeyword(keyword);
    setShowSuggestionDialog(true);
    
    // Log keyword click for analytics
    console.log(`Keyword clicked: ${keyword}`);
    
    // If it's a missing keyword, highlight it in the suggestions
    if (analysis.missingKeywords?.includes(keyword)) {
      // Switch to suggestions tab when clicking a missing keyword
      setActiveTab("suggestions");
    }
  };

  // Generate contextual suggestion for a keyword based on resume content and keyword type
  const generateSuggestion = (keyword: string) => {
    // Determine if this is a found, partial, or missing keyword
    const keywordStatus = analysis.keywordMatches?.includes(keyword) 
      ? 'found' 
      : partialMatches.some(k => k.text === keyword) 
        ? 'partial' 
        : 'missing';
    
    // Categorize the keyword to provide more relevant suggestions
    const isTechnicalSkill = /javascript|python|java|react|node|sql|aws|docker|kubernetes|git|mongodb|api|frontend|backend|database|cloud|code|program|develop|engineer|architect/i.test(keyword);
    const isSoftSkill = /leadership|management|communication|teamwork|collaboration|problem-solving|analytical|creative|detail-oriented|agile|scrum/i.test(keyword);
    const isEducation = /certification|degree|education|graduate|bachelor|master|phd/i.test(keyword);
    const isLeadership = /lead|manage|direct|supervise|oversee|coordinate/i.test(keyword);
    const isDomain = /finance|healthcare|retail|marketing|sales|education|manufacturing|logistics|security|analytics/i.test(keyword);
    
    // Determine appropriate section and suggestions based on keyword category
    let context = "professional experience";
    let suggestion = `Consider adding "${keyword}" in your experience section with a quantifiable achievement.`;
    let example = `Implemented ${keyword} solutions that increased efficiency by 35% and reduced costs by $50,000 annually.`;
    
    if (isEducation) {
      context = "education section";
      suggestion = `Add "${keyword}" to your education section to highlight relevant qualifications.`;
      example = `${keyword} certification completed with distinction, resulting in 3 new project opportunities.`;
    } else if (isTechnicalSkill) {
      context = "technical skills section";
      suggestion = `Include "${keyword}" in your skills section, with specific examples of implementation.`;
      example = `Advanced ${keyword} skills demonstrated through successful implementation in 5+ projects.`;
    } else if (isSoftSkill) {
      context = "soft skills section";
      suggestion = `Incorporate "${keyword}" with examples that demonstrate this quality.`;
      example = `Utilized strong ${keyword} to resolve conflicts and improve team productivity by 25%.`;
    } else if (isLeadership) {
      context = "leadership experience";
      suggestion = `Highlight your "${keyword}" experience with team size and outcomes.`;
      example = `${keyword} a cross-functional team of 8 developers, delivering project 15% under budget.`;
    } else if (isDomain) {
      context = "domain expertise";
      suggestion = `Emphasize your experience in the "${keyword}" domain with specific achievements.`;
      example = `Applied ${keyword} expertise to develop industry-specific solutions that increased client satisfaction by 40%.`;
    }
    
    // Customize suggestions based on keyword status
    if (keywordStatus === 'found') {
      suggestion = `Great job including "${keyword}" in your resume! Consider enhancing it with more specific details.`;
    } else if (keywordStatus === 'partial') {
      suggestion = `You have similar terms to "${keyword}" but should use the exact keyword for better ATS matching.`;
    }
    
    // Calculate estimated impact based on keyword status
    const impact = keywordStatus === 'missing' ? "+10-15 ATS points" : 
                  keywordStatus === 'partial' ? "+5-10 ATS points" : 
                  "+1-5 ATS points (optimization)";
    
    return {
      keyword,
      status: keywordStatus,
      context,
      suggestion,
      example,
      impact
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job Description Input */}
        <div className="card-modern p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Job Description</h4>
          <form onSubmit={handleAnalyze}>
            <Textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-40 resize-none"
              placeholder="Paste the job description here to analyze keyword match..."
            />
            <div className="mt-3 flex gap-2">
              <Button 
                type="submit"
                disabled={analyzeMutation.isPending || !jobDescription.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze Keywords
                  </>
                )}
              </Button>
              {analysis.jobDescription && (
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleClearJob();
                  }}
                  type="button"
                  variant="outline"
                  disabled={analyzeMutation.isPending}
                >
                  Change Job Role
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Keyword Match Results */}
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-800">Keyword Match</h4>
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{matchPercentage}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {targetScore}%
              </div>
            </div>
          </div>
          
          {/* Match Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-1">
              <span>Current Match</span>
              <span className="font-medium">{matchPercentage}%</span>
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <Progress 
                    value={matchPercentage} 
                    max={100} 
                    className="h-2"
                    indicatorClassName={`${isTargetReached ? 'bg-green-500' : 'bg-yellow-500'}`}
                  />
                </div>
              </div>
              <div className="flex text-xs justify-between">
                <span>0%</span>
                <span className="text-yellow-600">50%</span>
                <span className="text-green-600">100%</span>
              </div>
            </div>
          </div>
          
          {/* Match Statistics */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="p-3 bg-green-50 border border-green-100">
              <div className="text-xs text-green-600 mb-1">Found</div>
              <div className="text-xl font-bold text-green-700">{keywordMatch}</div>
            </Card>
            <Card className="p-3 bg-red-50 border border-red-100">
              <div className="text-xs text-red-600 mb-1">Missing</div>
              <div className="text-xl font-bold text-red-700">{missingKeywords}</div>
            </Card>
            <Card className="p-3 bg-blue-50 border border-blue-100">
              <div className="text-xs text-blue-600 mb-1">Total</div>
              <div className="text-xl font-bold text-blue-700">{totalKeywords}</div>
            </Card>
          </div>
          
          {/* Status Message */}
          <div className={`p-3 rounded-lg mb-4 flex items-start space-x-2 ${isTargetReached ? 'bg-green-50' : 'bg-yellow-50'}`}>
            {isTargetReached ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isTargetReached 
                  ? "Great job! Your resume has a strong keyword match." 
                  : `You're ${targetScore - matchPercentage}% away from the target match.`}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {isTargetReached
                  ? "Your resume is well-optimized for this job description."
                  : "Add missing keywords to improve your ATS compatibility."}
              </p>
            </div>
          </div>

          {/* No analysis yet */}
          {(!analysis.keywordMatches || analysis.keywordMatches.length === 0) && 
           (!analysis.missingKeywords || analysis.missingKeywords.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Search className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No keyword analysis available yet.</p>
              <p className="text-sm">Add a job description above to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Keyword Analysis Tabs */}
      <div className="card-modern">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cloud" onClick={(e) => e.stopPropagation()}>Interactive Word Cloud</TabsTrigger>
            <TabsTrigger value="comparison" onClick={(e) => e.stopPropagation()}>Keyword Comparison</TabsTrigger>
            <TabsTrigger value="suggestions" onClick={(e) => e.stopPropagation()}>Keyword Suggestions</TabsTrigger>
          </TabsList>
          
          {/* Word Cloud Tab */}
          <TabsContent value="cloud" className="p-6 pt-2">
            <div className="mb-2 flex justify-between items-center">
              <h4 className="text-lg font-semibold text-slate-800">Keyword Visualization</h4>
              <div className="text-sm text-gray-500">Click on keywords for suggestions</div>
            </div>
            <KeywordCloud 
              keywords={enhancedCloudKeywords} 
              onKeywordClick={handleKeywordClick}
              className="min-h-[300px]"
            />
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Found</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Partial Match</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Missing</span>
              </div>
            </div>
          </TabsContent>
          
          {/* Comparison Tab */}
          <TabsContent value="comparison" className="p-6 pt-2">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Keyword Density Comparison</h4>
              <p className="text-sm text-gray-600">Compare your resume's keyword density with job requirements</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Found Keywords ({analysis.keywordMatches?.length || 0})
                </h5>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {analysis.keywordMatches?.map((keyword, index) => {
                    const density = keywordDensity[keyword] || 0.1;
                    const formattedDensity = density.toFixed(1);
                    // Determine color intensity based on density
                    const intensityClass = 
                      density > 1.5 ? "bg-green-600" : 
                      density > 0.8 ? "bg-green-500" : 
                      "bg-green-400";
                    
                    return (
                      <div 
                        key={index} 
                        className="flex justify-between items-center p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                        onClick={() => handleKeywordClick(keyword)}
                      >
                        <span className="font-medium text-green-700">{keyword}</span>
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`${intensityClass} h-2 rounded-full`} 
                              style={{ width: `${Math.min(density * 25, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600">{formattedDensity}%</span>
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-4 text-gray-500">
                      <p>No matching keywords found</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h5 className="text-sm font-medium text-red-700 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Missing Keywords ({analysis.missingKeywords?.length || 0})
                </h5>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {analysis.missingKeywords?.map((keyword, index) => {
                    // Check if this is a partial match
                    const isPartialMatch = partialMatches.some(k => k.text === keyword);
                    const bgClass = isPartialMatch ? "bg-yellow-50" : "bg-red-50";
                    const textClass = isPartialMatch ? "text-yellow-700" : "text-red-700";
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex justify-between items-center p-2 ${bgClass} rounded-lg hover:bg-opacity-80 transition-colors cursor-pointer`}
                        onClick={() => handleKeywordClick(keyword)}
                      >
                        <div className="flex items-center">
                          <span className={`font-medium ${textClass}`}>{keyword}</span>
                          {isPartialMatch && (
                            <Badge variant="outline" className="ml-2 text-xs text-yellow-600 border-yellow-200 bg-yellow-50">
                              Partial Match
                            </Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent form submission
                            e.stopPropagation(); // Prevent triggering the parent onClick
                            handleKeywordClick(keyword);
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" />
                          Add Suggestion
                        </Button>
                      </div>
                    );
                  }) || (
                    <div className="text-center py-4 text-gray-500">
                      <p>No missing keywords found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="p-6 pt-2">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-2">Keyword Integration Suggestions</h4>
              <p className="text-sm text-gray-600">How to effectively add missing keywords to your resume</p>
            </div>
            
            {/* Priority Explanation */}
            <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-blue-800 mb-1">Prioritized Suggestions</h5>
                <p className="text-xs text-blue-700">
                  These suggestions are ordered by potential impact on your ATS score. Focus on high-impact keywords first to maximize your resume's effectiveness.
                </p>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {analysis.missingKeywords?.slice(0, 5).map((keyword, index) => {
                const suggestion = generateSuggestion(keyword);
                // Check if this is a partial match
                const isPartialMatch = partialMatches.some(k => k.text === keyword);
                const borderClass = isPartialMatch ? "border-yellow-300" : "border-gray-200";
                
                return (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border ${borderClass} rounded-lg hover:shadow-md transition-shadow`}
                  >
                    <div className="flex justify-between">
                      <h5 className="font-medium text-gray-900 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                          Keyword
                        </span>
                        {keyword}
                        {isPartialMatch && (
                          <Badge variant="outline" className="ml-2 text-xs text-yellow-600 border-yellow-200 bg-yellow-50">
                            Partial Match
                          </Badge>
                        )}
                      </h5>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        {suggestion.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{suggestion.suggestion}</p>
                    <div className="mt-3 p-3 bg-gray-50 rounded text-sm border-l-2 border-blue-400">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Example:</span>
                      {suggestion.example}
                    </div>
                    <div className="mt-3 flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        type="button"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          navigator.clipboard.writeText(suggestion.example);
                          toast({
                            title: "Copied to clipboard",
                            description: "Example text copied to clipboard",
                          });
                        }}
                      >
                        Copy to Clipboard
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        className="text-blue-600"
                        onClick={(e) => {
                          e.preventDefault(); // Prevent form submission
                          handleKeywordClick(keyword);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                );
              }) || (
                <div className="text-center py-8 text-gray-500">
                  <p>No keyword suggestions available</p>
                  <p className="text-sm">Add a job description to get personalized suggestions</p>
                </div>
              )}
              
              {analysis.missingKeywords && analysis.missingKeywords.length > 5 && (
                <div className="text-center mt-6 pb-2">
                  <Button 
                    variant="outline" 
                    className="text-blue-600"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent form submission
                      // Show all suggestions by setting a state or opening a dialog
                      toast({
                        title: "All Suggestions",
                        description: `Viewing all ${analysis.missingKeywords.length} keyword suggestions`,
                      });
                    }}
                  >
                    View All Suggestions ({analysis.missingKeywords.length})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Keyword Suggestion Dialog */}
      <Dialog open={showSuggestionDialog} onOpenChange={setShowSuggestionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="mr-2">Keyword Suggestion</span>
              {selectedKeyword && (
                generateSuggestion(selectedKeyword).status === 'missing' ? (
                  <Badge variant="destructive" className="text-xs">Missing</Badge>
                ) : generateSuggestion(selectedKeyword).status === 'partial' ? (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50 text-xs">Partial Match</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">Found</Badge>
                )
              )}
            </DialogTitle>
            <DialogDescription>
              How to effectively use "{selectedKeyword}" in your resume
            </DialogDescription>
          </DialogHeader>
          
          {selectedKeyword && (
            <div className="space-y-4">
              {/* Status-specific message */}
              {generateSuggestion(selectedKeyword).status === 'found' && (
                <div className="p-3 bg-green-50 rounded-md border border-green-100 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                  <p className="text-sm text-green-700">
                    Great job! This keyword is already in your resume. Consider optimizing how it's used for maximum impact.
                  </p>
                </div>
              )}
              
              {generateSuggestion(selectedKeyword).status === 'partial' && (
                <div className="p-3 bg-yellow-50 rounded-md border border-yellow-100 flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5 mr-2" />
                  <p className="text-sm text-yellow-700">
                    You have similar terms to this keyword. For better ATS matching, consider using the exact keyword.
                  </p>
                </div>
              )}
              
              {generateSuggestion(selectedKeyword).status === 'missing' && (
                <div className="p-3 bg-red-50 rounded-md border border-red-100 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5 mr-2" />
                  <p className="text-sm text-red-700">
                    This keyword is missing from your resume. Adding it could significantly improve your ATS score.
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-1">Recommended Section</h4>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <BarChart className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {generateSuggestion(selectedKeyword).context}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Implementation Strategy</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {generateSuggestion(selectedKeyword).suggestion}
                </p>
                
                <div className="p-3 bg-blue-50 rounded-md text-sm border border-blue-100">
                  <span className="text-xs font-medium text-blue-700 block mb-1">Example:</span>
                  {generateSuggestion(selectedKeyword).example}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <Badge variant="outline" className={`
                  ${generateSuggestion(selectedKeyword).status === 'missing' ? 'text-red-600 border-red-200 bg-red-50' : 
                    generateSuggestion(selectedKeyword).status === 'partial' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' : 
                    'text-green-600 border-green-200 bg-green-50'}
                `}>
                  {generateSuggestion(selectedKeyword).impact}
                </Badge>
                <div className="space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generateSuggestion(selectedKeyword).example);
                      toast({
                        title: "Copied to clipboard",
                        description: "Example text copied to clipboard",
                      });
                    }}
                  >
                    Copy Example
                  </Button>
                  <Button 
                    size="sm"
                    className={`
                      ${generateSuggestion(selectedKeyword).status === 'missing' ? 'bg-red-600 hover:bg-red-700' : 
                        generateSuggestion(selectedKeyword).status === 'partial' ? 'bg-yellow-600 hover:bg-yellow-700' : 
                        'bg-green-600 hover:bg-green-700'}
                    `}
                  >
                    {generateSuggestion(selectedKeyword).status === 'found' ? 'Optimize Usage' : 'Add to Resume'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
