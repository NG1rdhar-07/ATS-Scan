import { ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreMeter } from "@/components/ui/score-meter";
import { type Analysis } from "@shared/schema";

interface ResumePreviewProps {
  analysis: Analysis;
}

export function ResumePreview({ analysis }: ResumePreviewProps) {
  return (
    <div className="space-y-6">
      {/* ATS Score Meter */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">ATS Score</h3>
        <div className="flex justify-center">
          <ScoreMeter score={analysis.atsScore} />
        </div>
      </Card>

      {/* Resume Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Resume Preview</h3>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Resume Thumbnail */}
        <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">📄</div>
            <p className="text-gray-500">Resume Preview</p>
            <p className="text-sm text-gray-400">PDF rendering would go here</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Format Score</span>
            <span className="font-medium">{analysis.formatScore}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Keyword Score</span>
            <span className="font-medium">{analysis.keywordScore}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Content Score</span>
            <span className="font-medium">{analysis.contentScore}/100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Keyword Matches</span>
            <span className="font-medium text-green-600">
              {analysis.keywordMatches?.length || 0} found
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
