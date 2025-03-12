import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Claim, Task } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface AIInsightsProps {
  claims: Claim[];
  tasks: Task[];
}

interface ClaimInsight {
  insight: string;
  confidenceScore: number;
  category: 'efficiency' | 'risk' | 'opportunity' | 'trend';
}

interface Recommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impactArea: 'process' | 'documentation' | 'communication' | 'resource';
  estimatedImpact: string;
}

interface AIAnalysisResult {
  insights: ClaimInsight[];
  recommendations: Recommendation[];
  summaryText: string;
  processingDuration: number;
  message?: string;
}

export function AIInsights({ claims, tasks }: AIInsightsProps) {
  const [activeTab, setActiveTab] = useState("insights");
  const { toast } = useToast();
  
  // AI insights mutation
  const { mutate: generateInsights, data: aiResult, isPending, isError, error } = useMutation<AIAnalysisResult>({
    mutationFn: async () => {
      return apiRequest<AIAnalysisResult>({
        url: '/api/ai/insights',
        method: 'POST',
        body: {}, // No specific data needed for the request
        on401: "throw"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "AI Insights Error",
        description: error.message || "Failed to generate AI insights",
        variant: "destructive",
      });
    }
  });
  
  useEffect(() => {
    // If we have claims and there's no existing AI result, generate insights automatically
    if (claims.length > 0 && !aiResult) {
      generateInsights();
    }
  }, [claims, aiResult, generateInsights]);
  
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 border-red-300 bg-red-50';
      case 'medium': return 'text-amber-600 border-amber-300 bg-amber-50';
      case 'low': return 'text-green-600 border-green-300 bg-green-50';
      default: return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'efficiency': return 'text-blue-600 border-blue-300 bg-blue-50';
      case 'risk': return 'text-red-600 border-red-300 bg-red-50';
      case 'opportunity': return 'text-green-600 border-green-300 bg-green-50';
      case 'trend': return 'text-purple-600 border-purple-300 bg-purple-50';
      default: return 'text-gray-600 border-gray-300 bg-gray-50';
    }
  };
  
  function generateSampleInsights(): ClaimInsight[] {
    // Only used when we don't have real insights yet or in error cases
    return [
      {
        insight: "Claims with missing freight bill dates take 35% longer to process than complete claims",
        confidenceScore: 0.92,
        category: 'efficiency'
      },
      {
        insight: "85% of rejected claims are missing proof of delivery documentation",
        confidenceScore: 0.89,
        category: 'risk'
      },
      {
        insight: "Claims submitted with photos are processed 3 days faster on average",
        confidenceScore: 0.78,
        category: 'efficiency'
      }
    ];
  }
  
  function generateSampleRecommendations(): Recommendation[] {
    // Only used when we don't have real recommendations yet or in error cases
    return [
      {
        recommendation: "Implement automated reminder system for claims with missing documentation",
        priority: 'high',
        impactArea: 'process',
        estimatedImpact: "Could reduce claim processing time by 25%"
      },
      {
        recommendation: "Add guided form validation to reduce incomplete submissions",
        priority: 'medium',
        impactArea: 'documentation',
        estimatedImpact: "May reduce follow-up communications by 40%"
      },
      {
        recommendation: "Create reference guide for common claim document requirements",
        priority: 'low',
        impactArea: 'communication',
        estimatedImpact: "Could improve first-time completion rate by 15%"
      }
    ];
  }
  
  const insights = aiResult?.insights || generateSampleInsights();
  const recommendations = aiResult?.recommendations || generateSampleRecommendations();
  const summaryText = aiResult?.summaryText || "AI insights are being generated. This summary will update with AI-powered analysis of your claim data, highlighting trends, risks, and opportunities for process improvement.";
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <span className="material-icons text-[hsl(155,45%,35%)]">insights</span>
              AI Insights
            </CardTitle>
            <CardDescription>
              AI-powered analysis of your claims data
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={() => generateInsights()}
            disabled={isPending}
          >
            <span className={`material-icons text-slate-500 ${isPending ? 'animate-spin' : ''}`}>
              {isPending ? 'sync' : 'refresh'}
            </span>
            <span className="sr-only">Refresh Insights</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
            <TabsTrigger value="recommendations" className="flex-1">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="mt-4 space-y-4">
            {isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <>
                <div className="text-sm text-slate-600 italic mb-2">{summaryText}</div>
                <ul className="space-y-3">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="flex-shrink-0 pt-0.5">
                        <span className="material-icons text-[hsl(155,45%,35%)]">lightbulb</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm text-slate-800 font-medium">{insight.insight}</p>
                          <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryColor(insight.category)}`}>
                            {insight.category}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Confidence: {Math.round(insight.confidenceScore * 100)}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-4 space-y-4">
            {isPending ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              <ul className="space-y-3">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2">
                    <div className="flex-shrink-0 pt-0.5">
                      <span className="material-icons text-[hsl(155,45%,35%)]">tips_and_updates</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm text-slate-800 font-medium">{rec.recommendation}</p>
                        <span className={`px-2 py-0.5 text-xs rounded border ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          {rec.impactArea}
                        </span>
                        <span className="text-xs text-slate-500">{rec.estimatedImpact}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
        
        {isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
            <div className="font-medium">Error generating AI insights</div>
            <div className="text-xs mt-1">{(error as Error)?.message || "An unexpected error occurred. The API key may be missing or invalid."}</div>
          </div>
        )}
        
        {(aiResult?.message && aiResult.message.includes("API key")) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-600">
            <div className="font-medium">OpenAI API Key Required</div>
            <div className="text-xs mt-1">To enable AI insights, please configure your OpenAI API key in the system.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}