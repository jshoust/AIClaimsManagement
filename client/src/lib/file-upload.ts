import { Document } from "@shared/schema";

/**
 * Document upload response interface including analysis result
 */
export interface DocumentUploadResponse {
  document: Document;
  analysisResult?: {
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
  };
}

/**
 * Handles file upload to the server
 * @param file The file to upload
 * @param claimId Optional claim ID to associate with the document
 * @returns A promise that resolves to the upload response with document and analysis data
 */
export async function uploadFile(file: File, claimId?: number | null): Promise<DocumentUploadResponse> {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('file', file);
  
  if (claimId !== undefined && claimId !== null) {
    formData.append('claimId', claimId.toString());
  }
  
  // Add uploaded by information (in a real app, this would come from the authenticated user)
  formData.append('uploadedBy', 'John Doe');
  
  // Send the file to the server
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload file: ${error}`);
  }
  
  const data = await response.json();
  
  // Handle both the old and new response formats
  if (data.document) {
    // New format: { document, analysisResult? }
    return data as DocumentUploadResponse;
  } else {
    // Old format: just the document
    return { document: data as Document };
  }
}