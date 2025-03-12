import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Claim, InsertClaim } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useClaims() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all claims
  const claims = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Get a single claim by ID
  const getClaimById = (id: number | null) => {
    return useQuery<Claim>({
      queryKey: ['/api/claims', id],
      enabled: !!id,
    });
  };
  
  // Create a new claim
  const createClaim = useMutation({
    mutationFn: (newClaim: InsertClaim) => 
      apiRequest('POST', '/api/claims', newClaim),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      toast({
        title: "Claim Created",
        description: "The claim has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create claim: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Update an existing claim
  const updateClaim = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Claim> }) => 
      apiRequest('PATCH', `/api/claims/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', variables.id] });
      toast({
        title: "Claim Updated",
        description: "The claim has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update claim: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  // Send a follow-up email for missing information
  const sendFollowUpEmail = useMutation({
    mutationFn: ({ to, subject, body, claimId }: { to: string; subject: string; body: string; claimId: number }) => 
      apiRequest('POST', '/api/send-email', { to, subject, body, claimId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', variables.claimId, 'activities'] });
      toast({
        title: "Email Sent",
        description: "Follow-up email has been sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send email: " + (error as Error).message,
        variant: "destructive",
      });
    }
  });
  
  return {
    claims,
    getClaimById,
    createClaim,
    updateClaim,
    sendFollowUpEmail
  };
}
