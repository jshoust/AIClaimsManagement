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
    // Address information
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    // Product information
    purchaseDate?: string;
    productName?: string;
    productSku?: string;
    productQuantity?: string;
    // Additional claim details
    damageDescription?: string;
    preferredResolution?: string;
    dateOfIncident?: string;
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
        "description": "string",
        
        "addressLine1": "string",
        "addressLine2": "string",
        "city": "string",
        "state": "string",
        "zipCode": "string",
        "country": "string",
        
        "purchaseDate": "string",
        "productName": "string",
        "productSku": "string",
        "productQuantity": "string",
        
        "damageDescription": "string",
        "preferredResolution": "string",
        "dateOfIncident": "string"
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
    if (!fs.existsSync(filePath)) {
      console.error(`PDF file not found at path: ${filePath}`);
      return {
        missingInformation: ["PDF file not found or inaccessible"],
        extractedData: {},
        summary: "Could not access the PDF document"
      };
    }
    
    try {
      // Import pdf-parse dynamically to avoid issues in environments where it's not available
      const pdfParse = await import('pdf-parse');
      
      // Read the PDF file as buffer
      const dataBuffer = fs.readFileSync(filePath);
      
      try {
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
          
          // Return generic analysis for now - image processing requires different handling
          return {
            missingInformation: ["Document requires manual review - text extraction failed"],
            extractedData: {
              description: "PDF document uploaded, but text extraction failed"
            },
            summary: "Document requires manual content extraction"
          };
        }
      } catch (parseError) {
        console.error("Error parsing PDF content:", parseError);
        
        // Return basic analysis since image analysis is failing
        return {
          missingInformation: ["Document requires manual review - PDF parsing failed"],
          extractedData: {
            description: "PDF document uploaded, but parsing failed"
          },
          summary: "Document requires manual content extraction"
        };
      }
    } catch (importError) {
      console.error("Error importing pdf-parse:", importError);
      
      // Return basic analysis
      return {
        missingInformation: ["Document requires manual review - PDF processing unavailable"],
        extractedData: {
          description: "PDF document uploaded, but processing tools unavailable"
        },
        summary: "Document requires manual content extraction"
      };
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
 * Placeholder for future image document analysis
 * Currently returns a generic response instructing manual review
 * 
 * @param imageBase64 Base64-encoded image data
 * @returns Analysis result with generic response
 */
export async function analyzeImageDocument(imageBase64: string): Promise<DocumentAnalysisResult> {
  console.log("Image analysis requested but currently disabled");
  
  // Return a generic response for now
  return {
    missingInformation: [
      "Document requires manual review",
      "Customer contact information",
      "Claim details",
      "Damage description",
      "Order information"
    ],
    extractedData: {
      description: "This document was uploaded as an image or scanned PDF and requires manual review."
    },
    summary: "Document requires manual extraction of information. A task has been created to review this document."
  };
}