import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useDocuments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all documents
  const documents = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Get documents by claim ID
  const getDocumentsByClaim = (claimId: number | null) => {
    return useQuery<Document[]>({
      queryKey: ['/api/claims', claimId, 'documents'],
      enabled: !!claimId,
    });
  };
  
  // Get a single document by ID
  const getDocumentById = (id: number | null) => {
    return useQuery<Document>({
      queryKey: ['/api/documents', id],
      enabled: !!id,
    });
  };
  
  // Delete a document
  const deleteDocument = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      // Also invalidate any claim-specific document lists
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === '/api/claims' && query.queryKey[2] === 'documents'
      });
      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete document: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Analyze a document
  const analyzeDocument = useMutation({
    mutationFn: (id: number) => 
      apiRequest('POST', `/api/documents/${id}/analyze`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', id] });
      toast({
        title: "Document Analyzed",
        description: "The document has been analyzed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to analyze document: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  return {
    documents,
    getDocumentsByClaim,
    getDocumentById,
    deleteDocument,
    analyzeDocument
  };
}