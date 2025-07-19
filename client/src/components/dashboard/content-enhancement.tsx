import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit, ChevronDown, ChevronRight, ArrowRight, Sparkles, BarChart, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { type Analysis } from "@shared/schema";

interface ContentEnhancementProps {
  analysis: Analysis;
  resumeId?: string;
}

interface ContentSuggestion {
  id: string;
  category: "action_verbs" | "achievements" | "skills" | "clarity";
  impact: "high" | "medium" | "low";
  title: string;
  description: string;
  original: string;
  improved: string;
  atsPoints: number;
}

export function ContentEnhancement({ analysis, resumeId }: ContentEnhancementProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Ensure we're using the latest resume text by refreshing the data when this component mounts
  useEffect(() => {
    if (resumeId) {
      // Invalidate and refetch the analysis to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", resumeId, "analysis"] });
    }
  }, [resumeId, queryClient]);
  
  // Use the current resume text from the analysis
  const resumeText = analysis?.originalText || "";


  // Generate content suggestions based on analysis data
  const contentSuggestions: ContentSuggestion[] = [];
  
  // Add suggestions based on the analysis.improvements array
  if (analysis.improvements) {
    analysis.improvements
      .filter(improvement => improvement.category === "Content")
      .forEach((improvement, index) => {
        // Determine category based on title
        let category: "action_verbs" | "achievements" | "skills" | "clarity" = "clarity";
        if (improvement.title.toLowerCase().includes("verb")) {
          category = "action_verbs";
        } else if (improvement.title.toLowerCase().includes("achievement") || 
                  improvement.title.toLowerCase().includes("quantif")) {
          category = "achievements";
        } else if (improvement.title.toLowerCase().includes("skill")) {
          category = "skills";
        }

        // Create a suggestion with example content
        contentSuggestions.push({
          id: `content-${index}`,
          category,
          impact: improvement.priority as "high" | "medium" | "low",
          title: improvement.title,
          description: improvement.description,
          original: "Responsible for managing team projects",
          improved: "Led cross-functional team of 8 engineers, delivering 5 projects ahead of schedule and 15% under budget",
          atsPoints: category === "achievements" ? 8 : 
                    category === "action_verbs" ? 5 : 
                    category === "skills" ? 6 : 3
        });
      });
  }

  // Add some example content suggestions if none were found
  if (contentSuggestions.length === 0) {
    contentSuggestions.push(
      {
        id: "weak-verbs",
        category: "action_verbs",
        impact: "high",
        title: "Strengthen Action Verbs",
        description: "Replace weak verbs with powerful action verbs to demonstrate impact",
        original: "Was responsible for managing the database",
        improved: "Engineered and optimized database architecture, reducing query times by 40%",
        atsPoints: 7
      },
      {
        id: "unquantified",
        category: "achievements",
        impact: "high",
        title: "Quantify Your Achievements",
        description: "Add specific metrics and numbers to demonstrate the scale of your impact",
        original: "Improved customer satisfaction and increased sales",
        improved: "Boosted customer satisfaction scores by 28% and increased quarterly sales by $125K (18%)",
        atsPoints: 9
      },
      {
        id: "skills-context",
        category: "skills",
        impact: "medium",
        title: "Add Context to Skills",
        description: "Provide context for how you've applied your skills in real situations",
        original: "Proficient in Python, SQL, and data analysis",
        improved: "Leveraged Python and SQL to build data pipelines processing 2TB of customer data, generating actionable insights that increased conversion rates by 12%",
        atsPoints: 6
      },
      {
        id: "clarity",
        category: "clarity",
        impact: "medium",
        title: "Improve Clarity and Conciseness",
        description: "Make your statements clearer and more direct",
        original: "I was involved in various aspects of the project including planning and execution of different components",
        improved: "Spearheaded project planning and execution, coordinating 3 cross-functional teams to deliver results 2 weeks ahead of schedule",
        atsPoints: 5
      }
    );
  }

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestion(expandedSuggestion === id ? null : id);
  };

  const filterSuggestions = () => {
    return contentSuggestions.filter(suggestion => {
      if (selectedCategory && suggestion.category !== selectedCategory) return false;
      if (selectedImpact && suggestion.impact !== selectedImpact) return false;
      return true;
    });
  };

  const getImpactBadge = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">High Impact</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Medium Impact</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Low Impact</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "action_verbs":
        return <Edit className="h-5 w-5 text-purple-500" />;
      case "achievements":
        return <BarChart className="h-5 w-5 text-blue-500" />;
      case "skills":
        return <Sparkles className="h-5 w-5 text-amber-500" />;
      case "clarity":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Edit className="h-5 w-5 text-gray-500" />;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const filteredSuggestions = filterSuggestions();

  return (
    <div className="space-y-6">
      {/* Content Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Content Score</h3>
          <span className="text-2xl font-bold" style={{
            color: analysis.contentScore >= 75 ? "#10B981" : 
                  analysis.contentScore >= 50 ? "#F59E0B" : "#EF4444"
          }}>
            {analysis.contentScore}/100
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full mb-2">
          <div 
            className="h-2 rounded-full" 
            style={{
              width: `${analysis.contentScore}%`,
              backgroundColor: analysis.contentScore >= 75 ? "#10B981" : 
                              analysis.contentScore >= 50 ? "#F59E0B" : "#EF4444"
            }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {analysis.contentScore >= 75 ? "Your resume content is compelling and effective" : 
           analysis.contentScore >= 50 ? "Your resume content needs some improvements" : 
           "Your resume content needs significant improvements"}
        </p>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="space-y-1 mr-4">
          <p className="text-sm font-medium">Category:</p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Badge>
            <Badge 
              variant={selectedCategory === "action_verbs" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("action_verbs")}
            >
              Action Verbs
            </Badge>
            <Badge 
              variant={selectedCategory === "achievements" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("achievements")}
            >
              Achievements
            </Badge>
            <Badge 
              variant={selectedCategory === "skills" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("skills")}
            >
              Skills
            </Badge>
            <Badge 
              variant={selectedCategory === "clarity" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("clarity")}
            >
              Clarity
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Impact:</p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedImpact === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedImpact(null)}
            >
              All
            </Badge>
            <Badge 
              variant={selectedImpact === "high" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedImpact("high")}
            >
              High
            </Badge>
            <Badge 
              variant={selectedImpact === "medium" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedImpact("medium")}
            >
              Medium
            </Badge>
            <Badge 
              variant={selectedImpact === "low" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedImpact("low")}
            >
              Low
            </Badge>
          </div>
        </div>
      </div>

      {/* Content Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Content Improvement Suggestions</h3>
        
        {filteredSuggestions.length > 0 ? (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <motion.div 
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="border rounded-lg overflow-hidden"
              >
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between bg-white hover:bg-gray-50"
                  onClick={() => toggleSuggestion(suggestion.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{suggestion.title}</span>
                        <div className="flex items-center space-x-1 ml-2">
                          {getImpactIcon(suggestion.impact)}
                          <span className="text-xs font-medium" style={{
                            color: suggestion.impact === "high" ? "#ef4444" : 
                                  suggestion.impact === "medium" ? "#f59e0b" : "#3b82f6"
                          }}>
                            +{suggestion.atsPoints} ATS points
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{suggestion.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getImpactBadge(suggestion.impact)}
                    {expandedSuggestion === suggestion.id ? 
                      <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {expandedSuggestion === suggestion.id && (
                  <div className="px-4 pb-4 pt-0 bg-gray-50">
                    <div className="pl-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="bg-white p-3 rounded border">
                          <p className="text-xs font-medium mb-2 text-red-600">Original:</p>
                          <p className="text-sm">{suggestion.original}</p>
                        </div>
                        <div className="bg-white p-3 rounded border border-green-200">
                          <p className="text-xs font-medium mb-2 text-green-600">Improved:</p>
                          <p className="text-sm">{suggestion.improved}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Detailed Comparison
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Before & After Comparison</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-red-600">Original Content:</h4>
                                <div className="bg-red-50 p-4 rounded border border-red-200">
                                  <p>{suggestion.original}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-center">
                                <ArrowRight className="h-6 w-6 text-gray-400" />
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-green-600">Improved Content:</h4>
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                  <p>{suggestion.improved}</p>
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                                <h4 className="text-sm font-medium text-blue-600 mb-2">Why This Improves Your ATS Score:</h4>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>
                                      {suggestion.category === "action_verbs" && "Uses stronger action verbs that demonstrate leadership and initiative"}
                                      {suggestion.category === "achievements" && "Includes specific metrics and numbers that quantify your impact"}
                                      {suggestion.category === "skills" && "Provides context for skills with specific applications and results"}
                                      {suggestion.category === "clarity" && "Improves clarity and conciseness for better readability"}
                                    </span>
                                  </li>
                                  <li className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Increases keyword relevance for ATS systems</span>
                                  </li>
                                  <li className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>Demonstrates concrete value to potential employers</span>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Impact on ATS Score:</span>
                          <Badge className="bg-blue-100 text-blue-800">+{suggestion.atsPoints} points</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-green-600 mb-2">No Content Issues Found</h4>
            <p className="text-gray-500">Your resume content appears to be well-optimized</p>
          </div>
        )}
      </Card>

      {/* Content Best Practices */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Content Best Practices</h3>
        <ul className="space-y-3">
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Edit className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium">Use Strong Action Verbs</p>
              <p className="text-sm text-gray-500">Begin bullet points with powerful action verbs like "Achieved," "Launched," "Spearheaded," or "Generated"</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <BarChart className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Quantify Achievements</p>
              <p className="text-sm text-gray-500">Include specific metrics, percentages, dollar amounts, and timeframes to demonstrate impact</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium">Highlight Relevant Skills</p>
              <p className="text-sm text-gray-500">Focus on skills mentioned in the job description and provide context for how you've applied them</p>
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Be Clear and Concise</p>
              <p className="text-sm text-gray-500">Use clear, straightforward language and avoid jargon unless it's industry-standard terminology</p>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}