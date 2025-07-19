import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/dashboard/resume-preview";
import { AnalysisTabs } from "@/components/dashboard/analysis-tabs";
import { type Analysis } from "@shared/schema";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { resumeId } = useParams();
  const { toast } = useToast();

  // Use the standard query for initial load
  const { data: analysis, isLoading, error, refetch } = useQuery<Analysis>({
    queryKey: ["/api/resumes", resumeId, "analysis"],
    enabled: !!resumeId,
  });
  
  // Add a mutation for refreshing with fresh analysis
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!resumeId) throw new Error("No resume ID provided");
      return api.freshAnalysis(resumeId);
    },
    onSuccess: () => {
      toast({
        title: "Analysis Refreshed",
        description: "Your resume has been re-analyzed with fresh data.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh analysis",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load analysis</p>
          <Button onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      {/* Top Navigation */}
      <nav className="glass-effect border-b border-slate-200/50 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 dashboard-gradient rounded-xl shadow-md">
              <Search className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient-primary">ATS-Scan</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
              {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
            <Button className="btn-primary shadow-lg">
              <Download className="mr-2 h-4 w-4" />
              Export Resume
            </Button>
            <div className="w-10 h-10 dashboard-gradient rounded-full shadow-md"></div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-10 gap-6">
          {/* Left Panel (30%) - Resume Preview & Score */}
          <div className="lg:col-span-3">
            <ResumePreview analysis={analysis} />
          </div>

          {/* Right Panel (70%) - Analysis Tabs */}
          <div className="lg:col-span-7">
            <AnalysisTabs analysis={analysis} resumeId={resumeId} />
          </div>
        </div>
      </div>
    </div>
  );
}
