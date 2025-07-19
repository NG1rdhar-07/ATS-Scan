import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ATSOverview } from "./ats-overview";
import { FormatAnalysis } from "./format-analysis";
import { KeywordAnalysis } from "./keyword-analysis";
import { ContentEnhancement } from "./content-enhancement";
import { InterviewPrep } from "./interview-prep";
import { useQueryClient } from "@tanstack/react-query";
import { type Analysis } from "@shared/schema";

interface AnalysisTabsProps {
  analysis: Analysis;
  resumeId?: string;
}

export function AnalysisTabs({ analysis, resumeId }: AnalysisTabsProps) {
  // Store the active tab in state to maintain it across re-renders
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  
  // Refresh data when tab changes to ensure we have the latest data
  useEffect(() => {
    if (resumeId) {
      // Invalidate and refetch the analysis when tab changes
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", resumeId, "analysis"] });
    }
  }, [activeTab, resumeId, queryClient]);
  
  return (
    <div className="card-modern shadow-lg">
      <Tabs 
        defaultValue="overview" 
        value={activeTab}
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <div className="border-b border-slate-200/50">
          <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0 rounded-none">
            <TabsTrigger 
              value="overview" 
              className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-all hover:bg-blue-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              ATS Overview
            </TabsTrigger>
            <TabsTrigger 
              value="format" 
              className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:text-green-700 font-medium transition-all hover:bg-green-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              Format Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="keywords" 
              className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 font-medium transition-all hover:bg-blue-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              Keyword Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 font-medium transition-all hover:bg-purple-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              Content Enhancement
            </TabsTrigger>
            <TabsTrigger 
              value="interview" 
              className="py-4 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 font-medium transition-all hover:bg-orange-50/50"
              onClick={(e) => e.stopPropagation()}
            >
              Interview Prep
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6 bg-white/50">
          <TabsContent value="overview" className="mt-0">
            <ATSOverview analysis={analysis} />
          </TabsContent>

          <TabsContent value="format" className="mt-0">
            <FormatAnalysis analysis={analysis} resumeId={resumeId} />
          </TabsContent>

          <TabsContent value="keywords" className="mt-0">
            <KeywordAnalysis analysis={analysis} resumeId={resumeId} />
          </TabsContent>

          <TabsContent value="content" className="mt-0">
            <ContentEnhancement analysis={analysis} resumeId={resumeId} />
          </TabsContent>

          <TabsContent value="interview" className="mt-0">
            <InterviewPrep resumeId={resumeId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
