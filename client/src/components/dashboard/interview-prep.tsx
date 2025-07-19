import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, CheckCircle2, ChevronDown, ChevronRight, Users, Brain, Code, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface InterviewPrepProps {
  resumeId?: string;
}

interface InterviewQuestion {
  category: string;
  question: string;
  tips: string[];
  resume_context?: string;
}

const categoryIcons: Record<string, any> = {
  "Behavioral": Users,
  "Technical": Code,
  "Leadership": Target,
  "Problem Solving": Brain,
  "Role-Specific": MessageCircle,
};

const categoryColors: Record<string, string> = {
  "Behavioral": "bg-blue-100 text-blue-800",
  "Technical": "bg-green-100 text-green-800", 
  "Leadership": "bg-purple-100 text-purple-800",
  "Problem Solving": "bg-orange-100 text-orange-800",
  "Role-Specific": "bg-pink-100 text-pink-800",
};

export function InterviewPrep({ resumeId }: InterviewPrepProps) {
  // Use a controlled input that won't cause page resets
  const [jobTitle, setJobTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [preparedQuestions, setPreparedQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: interviewData, isLoading, refetch } = useQuery<{
    questions: InterviewQuestion[];
  }>({
    queryKey: ["/api/resumes", resumeId, "interview-prep", jobTitle],
    enabled: !!resumeId,
    queryFn: async () => {
      setIsGenerating(true);
      try {
        const url = `/api/resumes/${resumeId}/interview-prep${jobTitle ? `?jobTitle=${encodeURIComponent(jobTitle)}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch interview questions');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching interview questions:", error);
        throw error;
      } finally {
        setIsGenerating(false);
      }
    }
  });

  const handleJobTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobTitle.trim() !== '') {
      refetch();
      toast({
        title: "Questions Updated",
        description: `Generated questions for ${jobTitle || 'general software role'}`,
      });
    } else {
      toast({
        title: "Job Title Required",
        description: "Please enter a job title to generate relevant questions",
        variant: "destructive"
      });
    }
  };

  const toggleQuestionPreparation = (index: number) => {
    const newPrepared = new Set(preparedQuestions);
    if (newPrepared.has(index)) {
      newPrepared.delete(index);
    } else {
      newPrepared.add(index);
    }
    setPreparedQuestions(newPrepared);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  const questions = interviewData?.questions || [];
  const preparedCount = preparedQuestions.size;
  const totalQuestions = questions.length;
  const progressPercentage = totalQuestions > 0 ? Math.round((preparedCount / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Job Title Input */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Customize Interview Questions
          </h3>
          <p className="text-gray-600 text-sm">
            Enter a specific job title to get tailored interview questions
          </p>
        </div>
        
        <form onSubmit={handleJobTitleSubmit} className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., Senior Frontend Developer, Data Scientist, Product Manager"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              'Update Questions'
            )}
          </Button>
        </form>
      </Card>

      {/* Progress Tracker */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Interview Preparation Progress
          </h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {preparedCount}/{totalQuestions} Prepared
          </Badge>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <motion.div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-600">
          {progressPercentage}% complete - Keep practicing to ace your interview!
        </p>
      </Card>

      {/* Interview Questions */}
      <div className="space-y-4">
        {questions.map((question, index) => {
          const IconComponent = categoryIcons[question.category] || MessageCircle;
          const isExpanded = expandedQuestion === index;
          const isPrepared = preparedQuestions.has(index);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-4 transition-all duration-200 ${isPrepared ? 'ring-2 ring-green-500 bg-green-50' : 'hover:shadow-md'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                      <Badge 
                        variant="secondary" 
                        className={categoryColors[question.category] || "bg-gray-100 text-gray-800"}
                      >
                        {question.category}
                      </Badge>
                    </div>
                    
                    <h4 className="text-md font-medium text-gray-800 mb-2">
                      {question.question}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQuestionPreparation(index)}
                      className={isPrepared ? "bg-green-100 border-green-500 text-green-700" : ""}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${isPrepared ? 'text-green-600' : 'text-gray-400'}`} />
                      {isPrepared ? 'Prepared' : 'Mark as Prepared'}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {question.resume_context && (
                          <div className="mb-3">
                            <h5 className="font-medium text-gray-700 mb-1">📄 Context:</h5>
                            <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{question.resume_context}</p>
                          </div>
                        )}
                        <h5 className="font-medium text-gray-700 mb-2">💡 Answer Tips:</h5>
                        <ul className="space-y-2">
                          {question.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-600">
                              <span className="text-blue-500 font-bold">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {questions.length === 0 && !isLoading && (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No Interview Questions Available
          </h3>
          <p className="text-gray-500 mb-4">
            We couldn't generate interview questions at this time. Try specifying a job title above.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </Card>
      )}
    </div>
  );
}