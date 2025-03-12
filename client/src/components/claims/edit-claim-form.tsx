import { Claim, ClaimStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format-date";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface EditClaimFormProps {
  claim: Claim;
  onClose: () => void;
}

export default function EditClaimForm({ claim, onClose }: EditClaimFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: claim.customerName,
    contactPerson: claim.contactPerson,
    email: claim.email,
    phone: claim.phone,
    orderNumber: claim.orderNumber,
    claimAmount: claim.claimAmount,
    claimType: claim.claimType,
    description: claim.description,
    status: claim.status,
    assignedTo: claim.assignedTo || "",
  });
  
  // Is the form in edit mode or view mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Update form state when selected claim changes
  useEffect(() => {
    setFormData({
      customerName: claim.customerName,
      contactPerson: claim.contactPerson,
      email: claim.email,
      phone: claim.phone,
      orderNumber: claim.orderNumber,
      claimAmount: claim.claimAmount,
      claimType: claim.claimType,
      description: claim.description,
      status: claim.status,
      assignedTo: claim.assignedTo || "",
    });
    setIsEditing(false);
  }, [claim]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle select input changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit form to update claim
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await apiRequest('PATCH', `/api/claims/${claim.id}`, formData);
      
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
        createdBy: 'John Doe',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Exit edit mode after successful update
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update claim",
        variant: "destructive"
      });
    }
  };
  
  // Determine if any missing fields have been filled
  const getMissingFieldsResolved = () => {
    const missingFields = claim.missingInformation as string[] || [];
    let resolved = 0;
    
    missingFields.forEach(field => {
      const fieldName = field.toLowerCase().replace(/\s+/g, '');
      // Check if the field is no longer empty in the form data
      if (formData[fieldName as keyof typeof formData] && 
          formData[fieldName as keyof typeof formData] !== claim[fieldName as keyof typeof claim]) {
        resolved++;
      }
    });
    
    return resolved;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium text-neutral-800">Claim #{claim.claimNumber}</h2>
          <p className="text-sm text-neutral-500">Submitted on {formatDate(claim.dateSubmitted)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={claim.status as any} />
          {!isEditing ? (
            <Button 
              onClick={() => setIsEditing(true)} 
              variant="outline" 
              className="flex items-center gap-1"
            >
              <span className="material-icons text-sm">edit</span> Edit
            </Button>
          ) : (
            <Button 
              onClick={() => setIsEditing(false)} 
              variant="outline" 
              className="flex items-center gap-1"
            >
              <span className="material-icons text-sm">cancel</span> Cancel
            </Button>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase">Customer Information</h3>
            
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Customer Name') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Customer Name') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Contact Person') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Contact Person') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Email') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Email') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Phone') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Phone') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase">Claim Details</h3>
            
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Order Number') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Order Number') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="claimAmount">Claim Amount</Label>
              <Input
                id="claimAmount"
                name="claimAmount"
                value={formData.claimAmount}
                onChange={handleChange}
                disabled={!isEditing}
                className={claim.missingInformation && (claim.missingInformation as string[]).includes('Claim Amount') 
                  ? 'border-orange-500' 
                  : ''}
              />
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Claim Amount') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="claimType">Claim Type</Label>
              {isEditing ? (
                <Select 
                  value={formData.claimType} 
                  onValueChange={(value) => handleSelectChange('claimType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged Product">Damaged Product</SelectItem>
                    <SelectItem value="Missing Items">Missing Items</SelectItem>
                    <SelectItem value="Wrong Product">Wrong Product</SelectItem>
                    <SelectItem value="Late Delivery">Late Delivery</SelectItem>
                    <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="claimType"
                  name="claimType"
                  value={formData.claimType}
                  disabled
                  className={claim.missingInformation && (claim.missingInformation as string[]).includes('Claim Type') 
                    ? 'border-orange-500' 
                    : ''}
                />
              )}
              {claim.missingInformation && (claim.missingInformation as string[]).includes('Claim Type') && (
                <p className="text-xs text-orange-500 mt-1 flex items-center">
                  <span className="material-icons text-xs mr-1">warning</span>
                  Required information missing
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              {isEditing ? (
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClaimStatus.NEW}>New</SelectItem>
                    <SelectItem value={ClaimStatus.MISSING_INFO}>Missing Information</SelectItem>
                    <SelectItem value={ClaimStatus.IN_REVIEW}>In Review</SelectItem>
                    <SelectItem value={ClaimStatus.FOLLOW_UP}>Follow Up</SelectItem>
                    <SelectItem value={ClaimStatus.COMPLETED}>Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={formData.status as any} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={!isEditing}
            rows={5}
            className={claim.missingInformation && (claim.missingInformation as string[]).includes('Description') 
              ? 'border-orange-500' 
              : ''}
          />
          {claim.missingInformation && (claim.missingInformation as string[]).includes('Description') && (
            <p className="text-xs text-orange-500 mt-1 flex items-center">
              <span className="material-icons text-xs mr-1">warning</span>
              Required information missing
            </p>
          )}
        </div>
        
        {isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-1">
              <span className="material-icons text-sm">save</span> Save Changes
            </Button>
          </div>
        )}
      </form>
      
      {claim.missingInformation && (claim.missingInformation as string[]).length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h3 className="text-sm font-medium text-orange-800 flex items-center">
            <span className="material-icons text-sm mr-1">warning</span>
            Missing Information
          </h3>
          <p className="text-xs text-orange-700 mt-1">
            This claim is missing {(claim.missingInformation as string[]).length} required fields. 
            {isEditing && getMissingFieldsResolved() > 0 && (
              <span className="font-medium"> You've filled in {getMissingFieldsResolved()} of these fields.</span>
            )}
          </p>
          <ul className="mt-2 space-y-1">
            {(claim.missingInformation as string[]).map((item, index) => (
              <li key={index} className="text-sm text-orange-700 flex items-start">
                <span className="material-icons text-orange-500 mr-2 text-sm">error</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {claim.status === ClaimStatus.MISSING_INFO && (claim.missingInformation as string[]).length > 0 && (
          <Button className="flex items-center gap-1">
            <span className="material-icons text-sm">email</span>
            Send Follow-up Email
          </Button>
        )}
      </div>
    </div>
  );
}