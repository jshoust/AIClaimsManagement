import { Claim } from "@shared/schema";
import { useState } from "react";
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
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Claim</h2>
          <p className="text-muted-foreground">
            Claim #{claim?.claimNumber || ""} | Submitted: {claim?.dateSubmitted ? formatDate(claim.dateSubmitted) : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={(claim?.status || "new") as any} />
        </div>
      </div>
      
      {/* Missing information alert - this is kept outside the ClaimForm to 
          show at the top level for admin users */}
      {claim?.missingInformation && Array.isArray(claim.missingInformation) && claim.missingInformation.length > 0 && (
        <Card className="mb-6 border-amber-500 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-amber-800">Missing Information</h3>
                <ul className="mt-1 pl-5 list-disc text-sm text-amber-700">
                  {claim.missingInformation.map((item: string, index: number) => (
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
        initialData={claim ? {
          id: claim.id,
          
          // Basic Ward form fields
          claimNumber: claim.claimNumber || "",
          wardProNumber: claim.wardProNumber || "",
          todaysDate: new Date().toISOString().split('T')[0], // Today's date
          freightBillDate: claim.freightBillDate || "",
          claimantsRefNumber: claim.claimantsRefNumber || "",
          
          // Claim type and amount
          claimAmount: claim.claimAmount || "",
          claimType: claim.claimType || "damage",
          
          // Shipper information
          shipperName: claim.shipperName || "",
          shipperAddress: claim.shipperAddress || "",  
          shipperPhone: claim.shipperPhone || "",
          
          // Consignee information
          consigneeName: claim.consigneeName || "",
          consigneeAddress: claim.consigneeAddress || "",
          consigneePhone: claim.consigneePhone || "",
          
          // Claim details - handle both new and old field names
          claimDescription: claim.claimDescription || "",
          
          // Supporting documents
          originalBillOfLading: claim.originalBillOfLading || false,
          originalFreightBill: claim.originalFreightBill || false,
          originalInvoice: claim.originalInvoice || false,
          
          // Additional information
          isRepairable: claim.isRepairable || "",
          repairCost: claim.repairCost || "",
          
          // Claimant information
          companyName: claim.companyName || "",
          address: claim.address || "",
          contactPerson: claim.contactPerson || "",
          email: claim.email || "",
          phone: claim.phone || "",
          fax: claim.fax || "",
          
          // System fields
          status: claim.status || "new",
          dateSubmitted: claim.dateSubmitted || new Date().toISOString(),
          signature: claim.signature || "",
          
          // Save existing missing information
          missingInformation: claim.missingInformation || []
        } : {}}
        onSubmit={handleSubmit}
        onCancel={onClose}
        missingFields={claim?.missingInformation && Array.isArray(claim.missingInformation) ? claim.missingInformation : []}
        isLoading={isLoading}
      />
    </div>
  );
}