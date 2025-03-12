import { Claim } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/format-date";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ClaimForm } from "./claim-form";

interface EditClaimFormProps {
  claim: Claim;
  onClose: () => void;
}

export default function EditClaimForm({ claim, onClose }: EditClaimFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [claimData, setClaimData] = useState<Claim | null>(null);
  
  // Fetch the latest claim data when component mounts or claim ID changes
  useEffect(() => {
    const fetchClaimData = async () => {
      try {
        if (claim?.id) {
          const data = await apiRequest<Claim>('GET', `/api/claims/${claim.id}`);
          if (data) {
            setClaimData(data);
            console.log("Fetched claim data:", data);
          }
        }
      } catch (error) {
        console.error("Error fetching claim data:", error);
        setClaimData(claim || null);
      }
    };
    
    fetchClaimData();
  }, [claim?.id]);
  
  // Submit form to update claim
  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    
    try {
      // Update the claim while preserving the status
      await apiRequest('PATCH', `/api/claims/${claim.id}`, {
        ...formData,
        status: claim.status
      });
      
      toast({
        title: "Claim Updated",
        description: `Claim #${claim.claimNumber} has been updated successfully.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', claim.id] });
      
      // Create activity log for the update
      await apiRequest('POST', '/api/activities', {
        claimId: claim.id,
        type: 'update',
        description: 'Claim information updated',
        createdBy: 'System',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Close form
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claim",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Use the fetched data if available, otherwise use the passed claim prop
  const displayClaim = claimData || claim;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Claim</h2>
          <p className="text-muted-foreground">
            Claim #{displayClaim?.claimNumber || ""} | Submitted: {displayClaim?.dateSubmitted ? formatDate(displayClaim.dateSubmitted) : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={(displayClaim?.status || "new") as any} />
        </div>
      </div>
      
      {/* Missing information alert - this is kept outside the ClaimForm to 
          show at the top level for admin users */}
      {displayClaim?.missingInformation && Array.isArray(displayClaim.missingInformation) && displayClaim.missingInformation.length > 0 && (
        <Card className="mb-6 border-amber-500 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-amber-800">Missing Information</h3>
                <ul className="mt-1 pl-5 list-disc text-sm text-amber-700">
                  {displayClaim.missingInformation.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* The new claim form component that exactly matches the PDF structure */}
      <ClaimForm
        initialData={displayClaim ? {
          id: displayClaim.id,
          
          // Basic Ward form fields
          claimNumber: displayClaim.claimNumber || "",
          wardProNumber: displayClaim.wardProNumber || "",
          todaysDate: displayClaim.todaysDate || new Date().toISOString().split('T')[0], // Use existing date or today
          freightBillDate: displayClaim.freightBillDate || "",
          claimantsRefNumber: displayClaim.claimantsRefNumber || "",
          
          // Claim type and amount
          claimAmount: displayClaim.claimAmount || "",
          claimType: displayClaim.claimType || "damage",
          
          // Shipper information
          shipperName: displayClaim.shipperName || "",
          shipperAddress: displayClaim.shipperAddress || "",  
          shipperPhone: displayClaim.shipperPhone || "",
          
          // Consignee information
          consigneeName: displayClaim.consigneeName || "",
          consigneeAddress: displayClaim.consigneeAddress || "",
          consigneePhone: displayClaim.consigneePhone || "",
          
          // Claim details - handle both new and old field names
          claimDescription: displayClaim.claimDescription || "",
          
          // Supporting documents
          originalBillOfLading: displayClaim.originalBillOfLading || false,
          originalFreightBill: displayClaim.originalFreightBill || false,
          originalInvoice: displayClaim.originalInvoice || false,
          
          // Additional information
          isRepairable: displayClaim.isRepairable || "",
          repairCost: displayClaim.repairCost || "",
          
          // Claimant information
          companyName: displayClaim.companyName || "",
          address: displayClaim.address || "",
          contactPerson: displayClaim.contactPerson || "",
          email: displayClaim.email || "",
          phone: displayClaim.phone || "",
          fax: displayClaim.fax || "",
          
          // System fields
          status: displayClaim.status || "new",
          dateSubmitted: displayClaim.dateSubmitted || new Date().toISOString(),
          signature: displayClaim.signature || "",
          
          // Save existing missing information
          missingInformation: displayClaim.missingInformation || []
        } : {}}
        onSubmit={handleSubmit}
        onCancel={onClose}
        missingFields={displayClaim?.missingInformation && Array.isArray(displayClaim.missingInformation) ? displayClaim.missingInformation : []}
        isLoading={isLoading}
      />
    </div>
  );
}