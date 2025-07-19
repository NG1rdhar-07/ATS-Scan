import { motion } from "framer-motion";
import { FileText, Key, Edit, BarChart3, Lightbulb, CheckCircle, AlertTriangle, XCircle, ArrowUp, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type Analysis } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ScoreMeter } from "@/components/ui/score-meter";
import { useState, useEffect } from "react";

interface ATSOverviewProps {
  analysis: Analysis;
}

export function ATSOverview({ analysis }: ATSOverviewProps) {
  const industryAverage = 68;
  const topPercentile = 85;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [calculatedScore, setCalculatedScore] = useState(analysis.atsScore || 0);
  
  // Calculate dynamic ATS score based on component scores
  useEffect(() => {
    // Weight factors for each component
    const formatWeight = 0.3; // 30%
    const keywordWeight = 0.4; // 40%
    const contentWeight = 0.3; // 30%
    
    // Calculate weighted score
    const dynamicScore = Math.round(
      (analysis.formatScore * formatWeight) +
      (analysis.keywordScore * keywordWeight) +
      (analysis.contentScore * contentWeight)
    );
    
    // Apply bonus for high keyword match (over 80%)
    const keywordMatchPercentage = analysis.keywordMatches && analysis.missingKeywords ?
      (analysis.keywordMatches.length / (analysis.keywordMatches.length + analysis.missingKeywords.length)) * 100 : 0;
    
    let finalScore = dynamicScore;
    if (keywordMatchPercentage >= 80) {
      finalScore += 5; // Bonus points for excellent keyword matching
    }
    
    // Cap at 100
    finalScore = Math.min(finalScore, 100);
    
    setCalculatedScore(finalScore);
  }, [analysis]);
  
  // Animate the score when component mounts or score changes
  useEffect(() => {
    // Start from current animated score for smoother transitions
    const startValue = animatedScore || 0;
    const endValue = calculatedScore;
    const duration = 1000; // 1 second animation
    const frameRate = 20; // Update every 20ms
    const totalFrames = duration / frameRate;
    const increment = (endValue - startValue) / totalFrames;
    
    let currentFrame = 0;
    const animationTimer = setInterval(() => {
      currentFrame++;
      const newScore = Math.round(startValue + (increment * currentFrame));
      
      if (currentFrame >= totalFrames) {
        clearInterval(animationTimer);
        setAnimatedScore(endValue);
      } else {
        setAnimatedScore(newScore);
      }
    }, frameRate);
    
    return () => clearInterval(animationTimer);
  }, [calculatedScore, animatedScore]);

  // Data for the donut chart
  const scoreData = [
    { name: "Format", value: analysis.formatScore, color: "#22c55e" },
    { name: "Keywords", value: analysis.keywordScore, color: "#eab308" },
    { name: "Content", value: analysis.contentScore, color: "#3b82f6" },
  ];

  // Generate prioritized action items based on scores
  const generateActionItems = () => {
    const actionItems = [];
    
    // Add items based on score values
    if (analysis.formatScore < 70) {
      actionItems.push({
        title: "Improve Resume Format",
        description: "Your resume format needs attention for better ATS compatibility.",
        priority: "high",
        impact: "+15 ATS points",
        tab: "format"
      });
    }
    
    if (analysis.keywordScore < 60) {
      actionItems.push({
        title: "Enhance Keyword Matching",
        description: "Your resume is missing important keywords from the job description.",
        priority: "high",
        impact: "+20 ATS points",
        tab: "keywords"
      });
    } else if (analysis.keywordScore < 80) {
      actionItems.push({
        title: "Optimize Keyword Placement",
        description: "Improve the placement and context of keywords throughout your resume.",
        priority: "medium",
        impact: "+10 ATS points",
        tab: "keywords"
      });
    }
    
    if (analysis.contentScore < 65) {
      actionItems.push({
        title: "Strengthen Content Quality",
        description: "Your resume content needs more quantifiable achievements and stronger action verbs.",
        priority: "medium",
        impact: "+15 ATS points",
        tab: "content"
      });
    }
    
    // If we have improvements from the analysis, add those too
    if (analysis.improvements && analysis.improvements.length > 0) {
      // Only add improvements not already covered by our generated items
      const existingTitles = actionItems.map(item => item.title);
      analysis.improvements
        .filter(imp => !existingTitles.includes(imp.title))
        .forEach(imp => {
          actionItems.push({
            ...imp,
            impact: imp.impact || "+5-15 ATS points",
            tab: imp.category === "format" ? "format" : 
                 imp.category === "keywords" ? "keywords" : 
                 imp.category === "content" ? "content" : "overview"
          });
        });
    }
    
    // Sort by priority (high, medium, low)
    return actionItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - 
             priorityOrder[b.priority as keyof typeof priorityOrder];
    });
  };
  
  const actionItems = generateActionItems();

  return (
    <div className="space-y-8">
      {/* Main Score and Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall ATS Score with Circular Meter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall ATS Score</h3>
          <div className="w-48 h-48">
            <ScoreMeter 
              score={animatedScore} 
              label="ATS Score" 
              size="xl"
              showImprovement={true}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {analysis.atsScore >= 80 ? "Excellent! Your resume is highly ATS-compatible." :
               analysis.atsScore >= 65 ? "Good progress! A few more improvements needed." :
               "Your resume needs significant improvements for ATS compatibility."}
            </p>
          </div>
        </motion.div>
        
        {/* Score Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1000}
                  animationBegin={300}
                >
                  {scoreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}/100`, 'Score']} 
                  labelFormatter={(index) => scoreData[index].name}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {scoreData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></div>
                <div>
                  <div className="text-xs font-medium">{entry.name}</div>
                  <div className="text-sm font-bold">{entry.value}/100</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Individual Score Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 p-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{analysis.formatScore}</div>
                <div className="text-sm text-green-700">Format Score</div>
              </div>
              <FileText className="text-2xl text-green-500" />
            </div>
            <div className="mt-3 text-xs text-green-800">
              {analysis.formatScore >= 80 ? "Excellent format structure" : 
               analysis.formatScore >= 60 ? "Good format with minor issues" : 
               "Format needs significant improvement"}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{analysis.keywordScore}</div>
                <div className="text-sm text-yellow-700">Keyword Score</div>
              </div>
              <Key className="text-2xl text-yellow-500" />
            </div>
            <div className="mt-3 text-xs text-yellow-800">
              {analysis.keywordScore >= 80 ? "Strong keyword matching" : 
               analysis.keywordScore >= 60 ? "Moderate keyword presence" : 
               "Missing critical keywords"}
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 h-full">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{analysis.contentScore}</div>
                <div className="text-sm text-blue-700">Content Score</div>
              </div>
              <Edit className="text-2xl text-blue-500" />
            </div>
            <div className="mt-3 text-xs text-blue-800">
              {analysis.contentScore >= 80 ? "Compelling content quality" : 
               analysis.contentScore >= 60 ? "Good content with room for improvement" : 
               "Content needs significant enhancement"}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Improvement Roadmap */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Improvement Roadmap</h4>
        <div className="space-y-3">
          {actionItems.length > 0 ? (
            actionItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start space-x-3 p-4 rounded-lg border-l-4 ${
                  item.priority === 'high' 
                    ? 'bg-red-50 border-red-400'
                    : item.priority === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex-shrink-0 flex flex-col items-center space-y-2">
                  <Badge 
                    variant={
                      item.priority === 'high' 
                        ? 'destructive'
                        : item.priority === 'medium'
                        ? 'default'
                        : 'secondary'
                    }
                    className="capitalize"
                  >
                    {item.priority}
                  </Badge>
                  <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded flex items-center">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    {item.impact}
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.title}</h5>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <Button 
                    variant="link" 
                    className={`p-0 mt-1 text-sm flex items-center ${
                      item.priority === 'high' 
                        ? 'text-red-600 hover:text-red-700'
                        : item.priority === 'medium'
                        ? 'text-yellow-600 hover:text-yellow-700'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    View suggestions <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No specific improvements identified yet.</p>
              <p className="text-sm">Upload a job description for targeted recommendations.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Completeness */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Section Completeness</h4>
        <div className="space-y-3">
          {analysis.sectionCompleteness?.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {section.status === 'complete' ? (
                  <CheckCircle className="text-green-500 h-5 w-5" />
                ) : section.status === 'incomplete' ? (
                  <AlertTriangle className="text-yellow-500 h-5 w-5" />
                ) : (
                  <XCircle className="text-red-500 h-5 w-5" />
                )}
                <span className="font-medium text-gray-900 capitalize">{section.section}</span>
              </div>
              {section.status === 'complete' ? (
                <span className="text-sm text-green-600">Complete</span>
              ) : (
                <Button variant="link" className="text-sm text-blue-600 hover:text-blue-700 p-0">
                  {section.status === 'incomplete' ? 'Improve' : 'Add Section'}
                </Button>
              )}
            </motion.div>
          ))}

          {(!analysis.sectionCompleteness || analysis.sectionCompleteness.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>Section analysis will appear here after processing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Industry Benchmark */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Industry Benchmark</h4>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Your Score vs Industry Average</span>
          <span className="text-sm text-gray-500">Software Engineering</span>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Your Score</span>
              <span className="font-bold text-yellow-600">{analysis.atsScore}</span>
            </div>
            <Progress value={analysis.atsScore} className="h-3" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Industry Average</span>
              <span className="font-bold text-blue-600">{industryAverage}</span>
            </div>
            <Progress value={industryAverage} className="h-3" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Top 10%</span>
              <span className="font-bold text-green-600">{topPercentile}</span>
            </div>
            <Progress value={topPercentile} className="h-3" />
          </div>
        </div>
        
        <Card className="mt-4 p-3 bg-white">
          <p className="text-sm text-gray-600 flex items-start">
            <Lightbulb className="text-yellow-500 mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
            {analysis.atsScore > industryAverage 
              ? "You're performing above industry average! Focus on keyword optimization to reach the top 10%."
              : "Focus on the high-priority improvements to boost your score above industry average."
            }
          </p>
        </Card>
      </Card>
    </div>
  );
}
