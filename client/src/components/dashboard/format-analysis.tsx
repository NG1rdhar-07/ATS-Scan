import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronRight, FileText, Table, Image, Type, Layout } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type Analysis } from "@shared/schema";

interface FormatAnalysisProps {
  analysis: Analysis;
  resumeId?: string;
}

interface FormatIssue {
  id: string;
  type: "critical" | "warning" | "info";
  title: string;
  description: string;
  location?: string;
  suggestion: string;
  beforeExample?: string;
  afterExample?: string;
}

export function FormatAnalysis({ analysis, resumeId }: FormatAnalysisProps) {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [showBeforeAfter, setShowBeforeAfter] = useState<string | null>(null);

  // Generate format issues based on analysis data
  const formatIssues: FormatIssue[] = [];
  
  // Add issues based on the analysis.issues array
  if (analysis.improvements) {
    analysis.improvements
      .filter(improvement => improvement.category === "Format")
      .forEach((improvement, index) => {
        formatIssues.push({
          id: `format-${index}`,
          type: improvement.priority === "high" ? "critical" : 
                improvement.priority === "medium" ? "warning" : "info",
          title: improvement.title,
          description: improvement.description,
          suggestion: improvement.suggestions[0] || "Fix this issue to improve ATS compatibility",
          beforeExample: "[Example of problematic format]",
          afterExample: "[Example of improved format]"
        });
      });
  }

  // Add some common ATS format issues if none were found
  if (formatIssues.length === 0) {
    // Check if format score is perfect
    if (analysis.formatScore < 100) {
      formatIssues.push(
        {
          id: "tables",
          type: "critical",
          title: "Tables Detected",
          description: "Tables are not ATS-friendly and can cause parsing issues",
          location: "Throughout document",
          suggestion: "Replace tables with bullet points or simple text formatting",
          beforeExample: "| Skill | Proficiency |\n| React | Expert |",
          afterExample: "• React (Expert)\n• JavaScript (Advanced)"
        },
        {
          id: "headers",
          type: "warning",
          title: "Headers/Footers",
          description: "Text in headers or footers may be ignored by ATS systems",
          location: "Page margins",
          suggestion: "Move important information from headers/footers into the main content",
          beforeExample: "[Header with contact info]",
          afterExample: "Contact info placed at top of main content"
        },
        {
          id: "graphics",
          type: "warning",
          title: "Graphics or Images",
          description: "Visual elements cannot be parsed by most ATS systems",
          location: "Throughout document",
          suggestion: "Remove images and graphics, use text instead",
          beforeExample: "[Image of skill chart]",
          afterExample: "Skills: JavaScript (5 years), Python (3 years)"
        },
        {
          id: "fonts",
          type: "info",
          title: "Non-standard Fonts",
          description: "Unusual fonts may not render properly in ATS systems",
          location: "Throughout document",
          suggestion: "Use standard fonts like Arial, Calibri, or Times New Roman",
          beforeExample: "[Fancy decorative font]",
          afterExample: "[Clean standard font]"
        }
      );
    }
  }

  const getIssueIcon = (type: "critical" | "warning" | "info") => {
    switch (type) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "info":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getIssueTypeIcon = (title: string) => {
    if (title.toLowerCase().includes("table")) return <Table className="h-5 w-5" />;
    if (title.toLowerCase().includes("image") || title.toLowerCase().includes("graphic")) return <Image className="h-5 w-5" />;
    if (title.toLowerCase().includes("font")) return <Type className="h-5 w-5" />;
    if (title.toLowerCase().includes("header") || title.toLowerCase().includes("footer")) return <Layout className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const toggleIssue = (id: string) => {
    setExpandedIssue(expandedIssue === id ? null : id);
    setShowBeforeAfter(null);
  };

  const toggleBeforeAfter = (id: string) => {
    setShowBeforeAfter(showBeforeAfter === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Format Score */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Format Score</h3>
          <span className="text-2xl font-bold" style={{
            color: analysis.formatScore >= 75 ? "#10B981" : 
                  analysis.formatScore >= 50 ? "#F59E0B" : "#EF4444"
          }}>
            {analysis.formatScore}/100
          </span>
        </div>
        <Progress 
          value={analysis.formatScore} 
          className="h-2 mb-2"
          style={{
            backgroundColor: "#e5e7eb",
          }}
          indicatorStyle={{
            backgroundColor: analysis.formatScore >= 75 ? "#10B981" : 
                          analysis.formatScore >= 50 ? "#F59E0B" : "#EF4444"
          }}
        />
        <p className="text-sm text-gray-500 mt-2">
          {analysis.formatScore >= 75 ? "Your resume format is ATS-friendly" : 
           analysis.formatScore >= 50 ? "Your resume format needs some improvements" : 
           "Your resume format needs significant improvements"}
        </p>
      </Card>

      {/* Format Issues */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Format Issues</h3>
        
        {formatIssues.length > 0 ? (
          <div className="space-y-3">
            {formatIssues.map((issue) => (
              <motion.div 
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`border rounded-lg overflow-hidden ${issue.type === "critical" ? "border-red-200 bg-red-50" : 
                                                                issue.type === "warning" ? "border-amber-200 bg-amber-50" : 
                                                                "border-blue-200 bg-blue-50"}`}
              >
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleIssue(issue.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getIssueIcon(issue.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{issue.title}</span>
                        <div className="flex-shrink-0 ml-2">
                          {getIssueTypeIcon(issue.title)}
                        </div>
                      </div>
                      {issue.location && (
                        <p className="text-xs text-gray-500">Location: {issue.location}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {expandedIssue === issue.id ? 
                      <ChevronDown className="h-5 w-5 text-gray-400" /> : 
                      <ChevronRight className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>

                {expandedIssue === issue.id && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="pl-8">
                      <p className="text-sm mb-3">{issue.description}</p>
                      <div className="bg-white p-3 rounded border mb-3">
                        <p className="text-sm font-medium mb-1">Suggestion:</p>
                        <p className="text-sm">{issue.suggestion}</p>
                      </div>
                      
                      {(issue.beforeExample && issue.afterExample) && (
                        <div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBeforeAfter(issue.id);
                            }}
                            className="mb-3"
                          >
                            {showBeforeAfter === issue.id ? "Hide Example" : "View Before/After"}
                          </Button>
                          
                          {showBeforeAfter === issue.id && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="grid grid-cols-2 gap-4 mt-2"
                            >
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <p className="text-xs font-medium mb-1 text-red-600">Before:</p>
                                <pre className="text-xs whitespace-pre-wrap">{issue.beforeExample}</pre>
                              </div>
                              <div className="bg-green-50 p-3 rounded border border-green-200">
                                <p className="text-xs font-medium mb-1 text-green-600">After:</p>
                                <pre className="text-xs whitespace-pre-wrap">{issue.afterExample}</pre>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-green-600 mb-2">No Format Issues Detected</h4>
            <p className="text-gray-500">Your resume format appears to be ATS-friendly</p>
          </div>
        )}
      </Card>

      {/* ATS Format Tips */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">ATS Format Best Practices</h3>
        <ul className="space-y-2">
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Use standard section headings (Experience, Education, Skills)</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Stick to standard fonts (Arial, Calibri, Times New Roman)</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Avoid tables, text boxes, headers, footers, and images</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Use standard bullet points (•) instead of custom symbols</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm">Keep formatting simple and consistent throughout</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}