import OpenAI from "openai";
import { Claim, Task, Activity } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export interface AIAnalysisResult {
  insights: ClaimInsight[];
  recommendations: Recommendation[];
  summaryText: string;
  processingDuration: number;
}

/**
 * Generates AI insights based on claim data
 * @param claims Array of claims to analyze
 * @param tasks Array of tasks related to claims
 * @param activities Array of activities related to claims
 * @returns AI analysis result with insights and recommendations
 */
export async function generateClaimInsights(
  claims: Claim[],
  tasks: Task[],
  activities: Activity[]
): Promise<AIAnalysisResult> {
  const startTime = Date.now();
  
  try {
    // Prepare data for analysis
    const claimsData = claims.map(claim => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      shipperName: claim.shipperName,
      companyName: claim.companyName,
      claimAmount: claim.claimAmount,
      dateSubmitted: claim.dateSubmitted,
      // Don't include dateResolved since it doesn't exist in schema
      claimType: claim.claimType,
      assignedTo: claim.assignedTo
    }));
    
    const tasksData = tasks.map(task => ({
      id: task.id,
      claimId: task.claimId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status, // Use status instead of completed
      assignedTo: task.assignedTo
    }));
    
    const activitiesData = activities.map(activity => ({
      id: activity.id,
      claimId: activity.claimId,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp,
      createdBy: activity.createdBy // Use createdBy instead of performedBy
    }));
    
    // Analyze data with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert claims management AI analyst. Analyze the claims data and provide actionable insights and recommendations in JSON format. Focus on identifying patterns, inefficiencies, and opportunities for improvement.`
        },
        {
          role: "user",
          content: `Please analyze the following claims management data and provide insights and recommendations:
          
          Claims: ${JSON.stringify(claimsData)}
          Tasks: ${JSON.stringify(tasksData)}
          Activities: ${JSON.stringify(activitiesData)}
          
          Generate a thorough analysis with:
          1. Key insights about patterns, bottlenecks, and opportunities
          2. Specific actionable recommendations
          3. A brief summary of the overall claims portfolio status
          
          Respond with JSON in this format:
          {
            "insights": [
              {
                "insight": "String describing a specific insight",
                "confidenceScore": Number between 0-1,
                "category": "One of: efficiency, risk, opportunity, trend"
              }
            ],
            "recommendations": [
              {
                "recommendation": "String describing a specific recommendation",
                "priority": "One of: high, medium, low",
                "impactArea": "One of: process, documentation, communication, resource",
                "estimatedImpact": "String describing the potential impact"
              }
            ],
            "summaryText": "String with a concise summary of the claims portfolio status"
          }
          `
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });
    
    // Parse the response
    const responseContent = response.choices[0].message.content || '{}';
    const result = JSON.parse(responseContent);
    
    const processingDuration = Date.now() - startTime;
    
    return {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      summaryText: result.summaryText || 'Analysis complete',
      processingDuration
    };
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Return fallback insights in case of error
    return {
      insights: [
        {
          insight: "Unable to generate real-time insights. Please check your connection to the AI service.",
          confidenceScore: 1,
          category: "efficiency"
        }
      ],
      recommendations: [
        {
          recommendation: "Verify your OpenAI API key is correctly configured.",
          priority: "high",
          impactArea: "process",
          estimatedImpact: "Restoration of AI analysis capabilities"
        }
      ],
      summaryText: "AI insight generation is currently unavailable. Basic dashboard statistics are still accurate.",
      processingDuration: Date.now() - startTime
    };
  }
}

/**
 * Generate claim prediction based on historical data and new claim information
 * @param historicalClaims Array of existing claims for context
 * @param newClaimData Partial claim data to analyze
 * @returns Prediction about claim outcome, processing time, and potential issues
 */
export async function predictClaimOutcome(
  historicalClaims: Claim[],
  newClaimData: Partial<Claim>
): Promise<{
  likelyOutcome: string;
  estimatedProcessingDays: number;
  potentialIssues: string[];
  recommendedActions: string[];
}> {
  try {
    // Analyze with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert claims analyst AI that predicts claim outcomes based on historical patterns."
        },
        {
          role: "user",
          content: `Based on these historical claims:
          ${JSON.stringify(historicalClaims)}
          
          Predict the outcome for this new claim:
          ${JSON.stringify(newClaimData)}
          
          Provide a prediction in JSON format with:
          - likelyOutcome (approval status)
          - estimatedProcessingDays (number)
          - potentialIssues (array of strings)
          - recommendedActions (array of strings)`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    const responseContent = response.choices[0].message.content || '{}';
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error predicting claim outcome:", error);
    
    // Fallback prediction
    return {
      likelyOutcome: "Unable to generate prediction",
      estimatedProcessingDays: 0,
      potentialIssues: ["AI prediction service unavailable"],
      recommendedActions: ["Try again later or contact system administrator"]
    };
  }
}