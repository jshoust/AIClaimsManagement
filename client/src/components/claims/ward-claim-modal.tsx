import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { WardClaimForm, WardClaimFormValues } from "./ward-claim-form";
import { useClaims } from "@/hooks/use-claims";
import { useToast } from "@/hooks/use-toast";

interface WardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WardClaimModal({ isOpen, onClose }: WardClaimModalProps) {
  const { toast } = useToast();
  const claims = useClaims();
  const [missingFields, setMissingFields] = useState<string[]>([]);
  
  const handleSubmit = async (formData: WardClaimFormValues) => {
    try {
      // Reset missing fields
      setMissingFields([]);
      
      // Create claim data object
      const claimData = {
        // System fields
        claimNumber: `CLM-${Math.floor(Math.random() * 90000) + 10000}`, // Generate a random claim number
        dateSubmitted: new Date().toISOString(), // Add submission date
        
        // Ward Trucking specific fields
        wardProNumber: formData.wardProNumber,
        todaysDate: formData.todaysDate,
        freightBillDate: formData.freightBillDate,
        claimantsRefNumber: formData.claimantsRefNumber || null,
        claimAmount: formData.claimAmount,
        claimType: formData.claimType,
        
        // Shipper information
        shipperName: formData.shipperName,
        shipperAddress: formData.shipperAddress,
        shipperPhone: formData.shipperPhone,
        
        // Consignee information
        consigneeName: formData.consigneeName,
        consigneeAddress: formData.consigneeAddress,
        consigneePhone: formData.consigneePhone,
        
        // Claim description
        claimDescription: formData.claimDescription,
        
        // Supporting documents
        originalBillOfLading: formData.originalBillOfLading,
        originalFreightBill: formData.originalFreightBill,
        originalInvoice: formData.originalInvoice,
        
        // Additional information
        isRepairable: formData.isRepairable,
        repairCost: formData.repairCost || null,
        
        // Claimant information
        companyName: formData.companyName,
        address: formData.address,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        fax: formData.fax || null,
        
        // Signature
        signature: formData.signature || null,
        
        // Set status to new
        status: "new",
        
        // Empty fields that will be filled later
        assignedTo: null,
      };
      
      // Submit claim to server
      await claims.createClaim.mutate(claimData);
      
      toast({
        title: "Claim submitted successfully",
        description: "Your claim has been submitted and is pending review",
      });
      
      // Close the modal
      onClose();
    } catch (error: any) {
      console.error("Error submitting claim:", error);
      
      // Check if the error has a response with missing fields
      if (error.response?.data?.missingFields) {
        setMissingFields(error.response.data.missingFields);
        
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error submitting claim",
          description: "There was an error submitting your claim. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Submit a New Claim</DialogTitle>
        </DialogHeader>
        
        {missingFields.length > 0 && (
          <Card className="border-red-200 bg-red-50 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <CardDescription className="text-red-700 font-medium">
                  Missing Required Information
                </CardDescription>
              </div>
              <p className="text-sm text-red-700">
                Please fill in all required fields to submit your claim.
              </p>
            </CardContent>
          </Card>
        )}
        
        <WardClaimForm 
          onSubmit={handleSubmit} 
          onCancel={onClose} 
          missingFields={missingFields}
          isLoading={claims.createClaim.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}