import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Claim, Task } from "@shared/schema";

interface AIInsightsProps {
  claims: Claim[];
  tasks: Task[];
}

export function AIInsights({ claims, tasks }: AIInsightsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState<string[]>([
    "Analyzing claim patterns...",
    "Identifying optimization opportunities...",
    "Generating insights...",
  ]);
  const [currentLoadingIndex, setCurrentLoadingIndex] = useState(0);

  useEffect(() => {
    // Simulate loading messages changing over time
    if (loading) {
      const interval = setInterval(() => {
        setCurrentLoadingIndex((prev) => 
          prev < loadingMessages.length - 1 ? prev + 1 : prev
        );
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [loading, loadingMessages]);

  const generateInsights = async () => {
    setLoading(true);
    setCurrentLoadingIndex(0);
    
    try {
      // Simulate API call to OpenAI
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // In production, this would be a real API call to your backend
      // which would then use OpenAI to generate insights
      // const response = await fetch('/api/ai/insights', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ claims, tasks }),
      // });
      // const data = await response.json();
      
      // For now, we'll generate some sample insights based on the data
      const newInsights = generateSampleInsights(claims, tasks);
      const newRecommendations = generateSampleRecommendations(claims, tasks);
      
      setInsights(newInsights);
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  };

  // This would be replaced by actual AI processing in production
  function generateSampleInsights(claims: Claim[], tasks: Task[]): string[] {
    const statuses = claims.map(claim => claim.status);
    const pendingCount = statuses.filter(s => s !== 'completed').length;
    const completedCount = statuses.filter(s => s === 'completed').length;
    const missingInfoCount = statuses.filter(s => s === 'missing_info').length;
    
    const overdueTasksCount = tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return task.status !== 'completed' && dueDate < new Date();
    }).length;
    
    return [
      `${pendingCount} claims require attention with ${overdueTasksCount} overdue tasks.`,
      `${missingInfoCount} claims are stalled due to missing information.`,
      `The average claim processing time is trending 8% faster than last month.`,
      `Claims with complete documentation are processed 3.2× faster.`,
      `Freight bill date documentation is missing in 68% of delayed claims.`
    ];
  }
  
  function generateSampleRecommendations(claims: Claim[], tasks: Task[]): string[] {
    return [
      "Focus on completing the 3 high-priority claims nearing their SLA deadlines.",
      "Implement automated email reminders for claims missing freight bill information.",
      "Group similar claims by damage type to improve processing efficiency.",
      "Schedule follow-ups with the 2 carriers who have multiple pending claims.",
      "Consider adding shipping weight to the claim form as it's correlated with claim processing speed."
    ];
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">AI Insights & Recommendations</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center gap-1"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1"></div>
              Analyzing
            </>
          ) : (
            <>
              <span className="material-icons text-sm">refresh</span>
              Refresh Insights
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground animate-pulse">
              {loadingMessages[currentLoadingIndex]}
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-11/12 mb-2" />
            <Skeleton className="h-4 w-10/12 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-9/12" />
          </div>
        ) : insights.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <span className="material-icons text-primary text-lg mr-1">insights</span>
                Key Insights
              </h3>
              <ul className="text-sm space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start">
                    <span className="material-icons text-primary text-sm mr-1 mt-0.5">arrow_right</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <span className="material-icons text-primary text-lg mr-1">lightbulb</span>
                Recommendations
              </h3>
              <ul className="text-sm space-y-2">
                {recommendations.map((recommendation, i) => (
                  <li key={i} className="flex items-start">
                    <span className="material-icons text-primary text-sm mr-1 mt-0.5">check_circle</span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary-foreground">
                Pattern Analysis
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary-foreground">
                Claim Optimization 
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary-foreground">
                Risk Assessment
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="material-icons text-4xl text-muted-foreground mb-2">
              psychology_alt
            </span>
            <p className="text-sm text-muted-foreground max-w-xs">
              Click "Refresh Insights" to generate AI-powered analysis of your claims data and receive personalized recommendations.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}