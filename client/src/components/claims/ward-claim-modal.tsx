import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { WardClaimForm } from "./ward-claim-form";

interface WardClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WardClaimModal({ isOpen, onClose }: WardClaimModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handleSubmit = async (data: any) => {
    try {
      // Transform data to match API expectations
      const apiPayload = {
        // Required fields
        claimAmount: data.claimAmount,
        claimType: data.claimType,
        
        // Ward specific fields
        wardProNumber: data.wardProNumber,
        todaysDate: data.todaysDate,
        freightBillDate: data.freightBillDate,
        claimantsRefNumber: data.claimantsRefNumber,
        
        // Shipper and consignee
        shipperName: data.shipperName,
        shipperAddress: data.shipperAddress,
        shipperPhone: data.shipperPhone,
        consigneeName: data.consigneeName,
        consigneeAddress: data.consigneeAddress,
        consigneePhone: data.consigneePhone,
        
        // Claim details
        detailedStatement: data.detailedStatement,
        
        // Company and contact info
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        contactPerson: data.contactPerson,
        email: data.emailAddress,
        phone: data.phone,
        
        // Metadata
        originalBillOfLading: data.originalBillOfLading,
        originalFreightBill: data.originalFreightBill,
        originalInvoice: data.originalInvoice,
        merchandiseRepairable: data.merchandiseRepairable,
        repairCost: data.repairCost,
        
        // Form signature
        signature: data.signature,
        
        // Status
        status: "New"
      };
      
      await apiRequest('POST', '/api/claims', apiPayload);
      
      toast({
        title: "Claim Created",
        description: "The new claim has been created successfully",
      });
      
      // Close modal
      onClose();
      
      // Invalidate claims query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/claims'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create claim. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCancel = () => {
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-green-800">
            Ward Trucking Claim Form
          </DialogTitle>
        </DialogHeader>
        
        <WardClaimForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={false}
        />
      </DialogContent>
    </Dialog>
  );
}