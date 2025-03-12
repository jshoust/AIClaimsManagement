import { Claim } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DetailPanelProps {
  selectedClaimId: number | null;
  onClose: () => void;
}

export default function DetailPanel({ selectedClaimId, onClose }: DetailPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch claim details when a claim is selected
  const { data: claim, isLoading } = useQuery({
    queryKey: ['/api/claims', selectedClaimId],
    enabled: !!selectedClaimId,
  });

  // Function to send follow-up email
  const sendFollowUpEmail = async () => {
    if (!claim) return;
    
    try {
      // Format missing information as bullet points
      const missingItems = (claim.missingInformation as string[])
        .map(item => `• ${item}`)
        .join('\n');
      
      // Replace placeholders in email template
      const emailBody = 
        `Dear ${claim.contactPerson},\n\n` +
        `We are processing your claim #${claim.claimNumber} but need additional information to proceed. Please provide the following:\n\n` +
        `${missingItems}\n\n` +
        `Thank you,\nWard TLC Claims Department`;
      
      await apiRequest('POST', '/api/send-email', {
        to: claim.email,
        subject: `Missing Information for Claim #${claim.claimNumber}`,
        body: emailBody,
        claimId: claim.id
      });
      
      toast({
        title: "Email Sent",
        description: `Follow-up email sent to ${claim.contactPerson}`,
      });
      
      // Invalidate activities cache to show the new email activity
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', claim.id, 'activities'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send follow-up email",
        variant: "destructive"
      });
    }
  };
  
  // Function to update claim status
  const updateClaimStatus = async (newStatus: string) => {
    if (!claim) return;
    
    try {
      await apiRequest('PATCH', `/api/claims/${claim.id}`, {
        status: newStatus
      });
      
      toast({
        title: "Status Updated",
        description: `Claim status updated to ${newStatus}`,
      });
      
      // Invalidate claims cache
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', claim.id] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claim status",
        variant: "destructive"
      });
    }
  };
  
  if (!selectedClaimId) {
    return (
      <aside className="w-80 border-l border-neutral-200 bg-white p-0 flex flex-col h-full hidden md:block">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="font-medium text-neutral-800">Claim Details</h3>
          <button className="text-neutral-500 hover:text-neutral-700" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4">
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                <span className="material-icons text-neutral-400 text-3xl">description</span>
              </div>
              <h4 className="text-neutral-500 font-medium">No claim selected</h4>
              <p className="text-sm text-neutral-400 mt-1">Select a claim to view details</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }
  
  return (
    <aside className="w-80 border-l border-neutral-200 bg-white p-0 flex flex-col h-full hidden md:block">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="font-medium text-neutral-800">Claim Details</h3>
        <button className="text-neutral-500 hover:text-neutral-700" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : claim ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-neutral-800">Claim #{claim.claimNumber}</h4>
                <StatusBadge status={claim.status as any} />
              </div>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-medium text-neutral-500 uppercase">Customer Information</h5>
                  <div className="mt-1 text-sm">
                    <p className="font-medium text-neutral-800">{claim.customerName}</p>
                    <p className="text-neutral-600">{claim.contactPerson}</p>
                    <p className="text-neutral-600">{claim.email}</p>
                    <p className="text-neutral-600">{claim.phone}</p>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-neutral-500 uppercase">Claim Information</h5>
                  <div className="mt-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Date Submitted:</span>
                      <span className="font-medium text-neutral-800">{formatDate(claim.dateSubmitted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Order Number:</span>
                      <span className="font-medium text-neutral-800">{claim.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Claim Amount:</span>
                      <span className="font-medium text-neutral-800">{claim.claimAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Claim Type:</span>
                      <span className="font-medium text-neutral-800">{claim.claimType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Assigned To:</span>
                      <span className="font-medium text-neutral-800">{claim.assignedTo || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                
                {claim.missingInformation && (claim.missingInformation as string[]).length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-neutral-500 uppercase">Missing Information</h5>
                    <div className="mt-1 space-y-2 text-sm">
                      {(claim.missingInformation as string[]).map((item, index) => (
                        <div key={index} className="flex items-start">
                          <span className="material-icons text-error mr-2 text-sm">error</span>
                          <span className="text-neutral-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h5 className="text-xs font-medium text-neutral-500 uppercase">Actions</h5>
                  <div className="mt-2 space-y-2">
                    <Button 
                      onClick={sendFollowUpEmail}
                      className="w-full py-2 px-3 bg-primary text-white rounded text-sm flex justify-center items-center"
                      disabled={claim.status !== 'missing_info' || (claim.missingInformation as string[]).length === 0}
                    >
                      <span className="material-icons mr-1 text-sm">email</span>
                      Send Follow-up Email
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full py-2 px-3 border border-neutral-300 text-neutral-800 rounded text-sm flex justify-center items-center"
                    >
                      <span className="material-icons mr-1 text-sm">phone</span>
                      Log Phone Call
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Simple status rotation for demo
                        const statusOrder = ['new', 'missing_info', 'in_review', 'follow_up', 'completed'];
                        const currentIndex = statusOrder.indexOf(claim.status);
                        const nextIndex = (currentIndex + 1) % statusOrder.length;
                        updateClaimStatus(statusOrder[nextIndex]);
                      }}
                      className="w-full py-2 px-3 border border-neutral-300 text-neutral-800 rounded text-sm flex justify-center items-center"
                    >
                      <span className="material-icons mr-1 text-sm">update</span>
                      Update Status
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full py-2 px-3 border border-neutral-300 text-neutral-800 rounded text-sm flex justify-center items-center"
                    >
                      <span className="material-icons mr-1 text-sm">print</span>
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-red-600">
              Error loading claim details
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
