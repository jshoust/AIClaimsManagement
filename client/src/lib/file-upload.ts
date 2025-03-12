/**
 * Handles file upload to the server
 * @param file The file to upload
 * @param claimId Optional claim ID to associate with the document
 * @returns A promise that resolves to the created document
 */
export async function uploadFile(file: File, claimId?: number | null) {
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
  
  return response.json();
}