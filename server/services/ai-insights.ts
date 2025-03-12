import OpenAI from "openai";
import { Claim, Task, Activity } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define interface for claim insights
interface ClaimInsight {
  insight: string;
  confidenceScore: number;
  category: 'efficiency' | 'risk' | 'opportunity' | 'trend';
}

// Define interface for recommendations
interface Recommendation {
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  impactArea: 'process' | 'documentation' | 'communication' | 'resource';
  estimatedImpact: string;
}

// Define interface for AI analysis result
export interface AIAnalysisResult {
  insights: ClaimInsight[];
  recommendations: Recommendation[];
  summaryText: string;
  processingDuration: number;
}

// Define interface for claim prediction result
export interface ClaimPredictionResult {
  likelyOutcome: string;
  estimatedProcessingDays: number;
  confidenceScore: number;
  potentialIssues: string[];
  recommendedActions: string[];
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
      dateSubmitted: claim.dateSubmitted,
      completionDate: claim.completionDate,
      amount: claim.claimAmount,
      missingInfo: claim.status === 'missing_info'
    }));
    
    const tasksData = tasks.map(task => ({
      id: task.id,
      claimId: task.claimId,
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate,
      completionDate: task.completionDate
    }));
    
    const activitiesData = activities.map(activity => ({
      id: activity.id,
      claimId: activity.claimId,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp
    }));
    
    // Prepare the prompt for OpenAI
    const prompt = `
      You are an AI claims processing analyst for trucking claims. Analyze the following data:
      
      Claims: ${JSON.stringify(claimsData)}
      Tasks: ${JSON.stringify(tasksData)}
      Activities: ${JSON.stringify(activitiesData)}
      
      Generate the following:
      1. Three to five key insights about claim processing efficiency, risks, opportunities, and trends
      2. Three specific recommendations to improve the claim processing workflow
      3. A brief summary paragraph of overall claim processing performance
      
      Return your analysis as a JSON object with the following structure:
      {
        "insights": [
          {
            "insight": "string describing insight",
            "confidenceScore": number between 0 and 1,
            "category": one of "efficiency", "risk", "opportunity", or "trend"
          }
        ],
        "recommendations": [
          {
            "recommendation": "string describing recommendation",
            "priority": one of "high", "medium", or "low",
            "impactArea": one of "process", "documentation", "communication", or "resource",
            "estimatedImpact": "string describing impact"
          }
        ],
        "summaryText": "overall summary paragraph"
      }
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI claims processing analyst for a trucking company. Provide data-driven insights and recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });
    
    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Ensure the response has the expected structure
    const aiResult: AIAnalysisResult = {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      summaryText: result.summaryText || "Analysis complete.",
      processingDuration: Date.now() - startTime
    };
    
    return aiResult;
    
  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    // Return fallback response in case of error
    return {
      insights: [
        {
          insight: "Unable to generate AI insights at this time.",
          confidenceScore: 0,
          category: "efficiency"
        }
      ],
      recommendations: [
        {
          recommendation: "Check system configuration for AI analysis.",
          priority: "high",
          impactArea: "process",
          estimatedImpact: "Will enable AI-powered insights"
        }
      ],
      summaryText: "AI analysis service is currently unavailable. Please check your OpenAI API key configuration.",
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
  newClaimData: Record<string, any>
): Promise<ClaimPredictionResult> {
  try {
    // Prepare historical data
    const historicalData = historicalClaims.map(claim => ({
      status: claim.status,
      dateSubmitted: claim.dateSubmitted,
      completionDate: claim.completionDate,
      amount: claim.claimAmount,
      missingInfo: claim.status === 'missing_info'
    }));
    
    // Prepare the prompt for OpenAI
    const prompt = `
      You are an AI claims processing predictor for a trucking company. Based on historical claim data and a new claim submission, predict:
      1. The likely outcome (approved, denied, partial approval)
      2. Estimated days to process the claim
      3. Potential issues that might delay processing
      4. Recommended actions to ensure smooth processing
      
      Historical claims: ${JSON.stringify(historicalData)}
      New claim: ${JSON.stringify(newClaimData)}
      
      Return your prediction as a JSON object with the following structure:
      {
        "likelyOutcome": "string - approved, denied, or partial",
        "estimatedProcessingDays": number,
        "confidenceScore": number between 0 and 1,
        "potentialIssues": ["string array of potential issues"],
        "recommendedActions": ["string array of recommended actions"]
      }
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { role: "system", content: "You are an AI claims processing predictor for a trucking company. Provide outcome predictions and recommendations." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
    });
    
    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    // Ensure the response has the expected structure
    const prediction: ClaimPredictionResult = {
      likelyOutcome: result.likelyOutcome || "Unknown",
      estimatedProcessingDays: result.estimatedProcessingDays || 14,
      confidenceScore: result.confidenceScore || 0.5,
      potentialIssues: result.potentialIssues || [],
      recommendedActions: result.recommendedActions || []
    };
    
    return prediction;
    
  } catch (error) {
    console.error("Error predicting claim outcome:", error);
    
    // Return fallback response in case of error
    return {
      likelyOutcome: "Unable to predict at this time",
      estimatedProcessingDays: 14,
      confidenceScore: 0,
      potentialIssues: ["AI prediction service unavailable"],
      recommendedActions: ["Submit claim with complete documentation"]
    };
  }
}