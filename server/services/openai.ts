import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

export interface DocumentAnalysisResult {
  missingInformation: string[];
  extractedData: {
    customerName?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    orderNumber?: string;
    claimAmount?: string;
    claimType?: string;
    description?: string;
    [key: string]: string | undefined;
  };
  summary: string;
}

/**
 * Analyzes a document to identify missing information and extract key data
 * @param text Text content from the document
 * @returns Analysis result with missing information, extracted data, and summary
 */
export async function analyzeDocument(text: string): Promise<DocumentAnalysisResult> {
  try {
    const prompt = `
    You are an expert claims analyst for Boon AI Claims Processing.
    
    Please analyze the following claim document text and provide a detailed analysis with the following information:
    
    1. Identify any missing information that would be needed to process the claim properly.
    2. Extract all key information from the claim in a structured format.
    3. Provide a brief summary of the claim.
    
    Respond with JSON in the following format:
    {
      "missingInformation": ["string array of missing information items"],
      "extractedData": {
        "customerName": "string",
        "contactPerson": "string",
        "email": "string",
        "phone": "string",
        "orderNumber": "string",
        "claimAmount": "string",
        "claimType": "string",
        "description": "string"
      },
      "summary": "string summary of the claim"
    }
    
    The claim document text is as follows:
    ${text}
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a claims analysis assistant for Boon Claims Management." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const result = JSON.parse(content) as DocumentAnalysisResult;

    return {
      missingInformation: result.missingInformation || [],
      extractedData: result.extractedData || {},
      summary: result.summary || "No summary available"
    };
  } catch (error: any) {
    console.error("Error analyzing document with OpenAI:", error);
    throw new Error(`Failed to analyze document: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyzes a claim form PDF document using file path
 * Uses pdf-parse library to extract text and then analyzes with OpenAI
 * 
 * @param filePath Path to the PDF file
 * @returns Analysis result
 */
export async function analyzePDFDocument(filePath: string): Promise<DocumentAnalysisResult> {
  try {
    // Import pdf-parse dynamically to avoid issues in environments where it's not available
    const pdfParse = await import('pdf-parse');
    
    // Read the PDF file as buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF to extract text
    const pdfData = await pdfParse.default(dataBuffer);
    
    // Get the text content
    const pdfText = pdfData.text;
    
    // If text extraction was successful
    if (pdfText && pdfText.length > 0) {
      console.log("Successfully extracted text from PDF, length: " + pdfText.length);
      return analyzeDocument(pdfText);
    } else {
      console.warn("PDF text extraction returned empty content");
      
      // For scanned PDFs or image-based PDFs, we need a different approach
      // Convert the PDF to base64 and try image analysis
      const fileBuffer = fs.readFileSync(filePath);
      const base64Data = fileBuffer.toString('base64');
      
      // Use image-based analysis as fallback
      return analyzeImageDocument(base64Data);
    }
  } catch (error: any) {
    console.error("Error in analyzePDFDocument:", error);
    
    // Return a basic result if PDF handling fails
    return {
      missingInformation: ["Could not process PDF document properly"],
      extractedData: {},
      summary: "Failed to process PDF document"
    };
  }
}

/**
 * Analyzes a document image
 * @param imageBase64 Base64-encoded image data
 * @returns Analysis result
 */
export async function analyzeImageDocument(imageBase64: string): Promise<DocumentAnalysisResult> {
  try {
    const prompt = `
    You are an expert claims analyst for Boon AI Claims Processing.
    
    Please analyze the following claim form image and provide a detailed analysis with the following information:
    
    1. Identify any missing information that would be required to process the claim properly. Every empty or incomplete field should be listed.
    2. Extract all key information from the claim in a structured format.
    3. Provide a brief summary of the claim.
    
    The important fields to check for are:
    - Customer name
    - Contact person
    - Email address
    - Phone number
    - Order number
    - Claim amount
    - Claim type
    - Description of the claim
    
    Consider any empty or incomplete field as missing information.
    
    Respond with JSON in the following format:
    {
      "missingInformation": ["string array of missing information items"],
      "extractedData": {
        "customerName": "string",
        "contactPerson": "string",
        "email": "string",
        "phone": "string",
        "orderNumber": "string",
        "claimAmount": "string",
        "claimType": "string",
        "description": "string"
      },
      "summary": "string summary of the claim"
    }
    `;

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a claims analysis assistant for Boon Claims Management with expertise in extracting information from claim forms." },
        { 
          role: "user", 
          content: [
            { 
              type: "text", 
              text: prompt 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/application/pdf;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    
    try {
      const result = JSON.parse(content) as DocumentAnalysisResult;
      return {
        missingInformation: result.missingInformation || [],
        extractedData: result.extractedData || {},
        summary: result.summary || "No summary available"
      };
    } catch (jsonError) {
      console.error("Error parsing JSON from OpenAI response:", jsonError);
      // If JSON parsing fails, return a basic structure
      return {
        missingInformation: ["Could not parse document properly"],
        extractedData: {},
        summary: "Failed to properly analyze document format"
      };
    }
  } catch (error: any) {
    console.error("Error analyzing image with OpenAI:", error);
    throw new Error(`Failed to analyze image document: ${error.message || 'Unknown error'}`);
  }
}