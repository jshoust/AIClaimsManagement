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
    customerName: claim.customerName || "",
    contactPerson: claim.contactPerson || "",
    email: claim.email || "",
    phone: claim.phone || "",
    orderNumber: claim.orderNumber || "",
    claimAmount: claim.claimAmount || "",
    claimType: claim.claimType || "",
    description: claim.description || "",
    status: claim.status,
    assignedTo: claim.assignedTo || "",
    addressLine1: claim.addressLine1 || "",
    addressLine2: claim.addressLine2 || "",
    city: claim.city || "",
    state: claim.state || "",
    zipCode: claim.zipCode || "",
    country: claim.country || "",
    purchaseDate: claim.purchaseDate || "",
    productName: claim.productName || "",
    productSku: claim.productSku || "",
    productQuantity: claim.productQuantity || "",
    damageDescription: claim.damageDescription || "",
    preferredResolution: claim.preferredResolution || "",
    attachments: claim.attachments || "",
    signature: claim.signature || "",
    dateOfIncident: claim.dateOfIncident || ""
  });
  
  // Is the form in edit mode or view mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Update form state when selected claim changes
  useEffect(() => {
    setFormData({
      customerName: claim.customerName || "",
      contactPerson: claim.contactPerson || "",
      email: claim.email || "",
      phone: claim.phone || "",
      orderNumber: claim.orderNumber || "",
      claimAmount: claim.claimAmount || "",
      claimType: claim.claimType || "",
      description: claim.description || "",
      status: claim.status,
      assignedTo: claim.assignedTo || "",
      addressLine1: claim.addressLine1 || "",
      addressLine2: claim.addressLine2 || "",
      city: claim.city || "",
      state: claim.state || "",
      zipCode: claim.zipCode || "",
      country: claim.country || "",
      purchaseDate: claim.purchaseDate || "",
      productName: claim.productName || "",
      productSku: claim.productSku || "",
      productQuantity: claim.productQuantity || "",
      damageDescription: claim.damageDescription || "",
      preferredResolution: claim.preferredResolution || "",
      attachments: claim.attachments || "",
      signature: claim.signature || "",
      dateOfIncident: claim.dateOfIncident || ""
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
        createdBy: 'System',
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
      // Convert field names to match form data properties
      let fieldName = field.toLowerCase().replace(/\s+/g, '');
      
      // Handle special cases for field name mapping
      if (field.includes("Address")) fieldName = "addressLine1";
      if (field.includes("Purchase Date")) fieldName = "purchaseDate";
      if (field.includes("Product Name")) fieldName = "productName";
      if (field.includes("Damage Description")) fieldName = "damageDescription";
      if (field.includes("Preferred Resolution")) fieldName = "preferredResolution";
      if (field.includes("Incident Date")) fieldName = "dateOfIncident";
      
      // Check if the field is no longer empty in the form data
      if (formData[fieldName as keyof typeof formData] && 
          (!claim[fieldName as keyof typeof claim] || 
           formData[fieldName as keyof typeof formData] !== claim[fieldName as keyof typeof claim])) {
        resolved++;
      }
    });
    
    return resolved;
  };
  
  // Helper to check if field is missing
  const isFieldMissing = (fieldName: string): boolean => {
    if (!claim.missingInformation) return false;
    
    const missingArray = claim.missingInformation as string[];
    return missingArray.some(item => 
      item.toLowerCase().includes(fieldName.toLowerCase()) || 
      (fieldName === "addressLine1" && item.toLowerCase().includes("address")) ||
      (fieldName === "purchaseDate" && item.toLowerCase().includes("purchase date")) ||
      (fieldName === "productName" && item.toLowerCase().includes("product name")) ||
      (fieldName === "damageDescription" && item.toLowerCase().includes("damage description")) ||
      (fieldName === "preferredResolution" && item.toLowerCase().includes("preferred resolution")) ||
      (fieldName === "dateOfIncident" && item.toLowerCase().includes("incident date"))
    );
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
      
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-neutral-200 p-6">
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <p className="text-sm text-green-800">
            <span className="font-bold">Claim Form</span>: Fill in all required fields marked with a red border. Fields with data already extracted from the PDF are pre-filled.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1: Claimant Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase border-b pb-2">Claimant Information</h3>
            
            {/* Customer Name Field */}
            <div>
              <Label htmlFor="customerName" className="flex justify-between">
                <span>Company/Customer Name</span>
                {isFieldMissing('customerName') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('customerName') ? 'border-red-500' : ''}
                placeholder="Enter company or customer name"
              />
            </div>
            
            {/* Contact Person Field */}
            <div>
              <Label htmlFor="contactPerson" className="flex justify-between">
                <span>Contact Person</span>
                {isFieldMissing('contactPerson') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('contactPerson') ? 'border-red-500' : ''}
                placeholder="Enter primary contact name"
              />
            </div>
            
            {/* Address Line 1 Field */}
            <div>
              <Label htmlFor="addressLine1" className="flex justify-between">
                <span>Address Line 1</span>
                {isFieldMissing('addressLine1') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('addressLine1') ? 'border-red-500' : ''}
                placeholder="Street address"
              />
            </div>
            
            {/* Address Line 2 Field */}
            <div>
              <Label htmlFor="addressLine2">
                <span>Address Line 2</span> <span className="text-neutral-400">(Optional)</span>
              </Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Apt, Suite, Building (optional)"
              />
            </div>
            
            {/* City, State, Zip Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="flex justify-between">
                  <span>City</span>
                  {isFieldMissing('city') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('city') ? 'border-red-500' : ''}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state" className="flex justify-between">
                  <span>State</span>
                  {isFieldMissing('state') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('state') ? 'border-red-500' : ''}
                  placeholder="State/Province"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode" className="flex justify-between">
                  <span>Zip/Postal Code</span>
                  {isFieldMissing('zipCode') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('zipCode') ? 'border-red-500' : ''}
                  placeholder="Zip/Postal code"
                />
              </div>
              <div>
                <Label htmlFor="country" className="flex justify-between">
                  <span>Country</span>
                  {isFieldMissing('country') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('country') ? 'border-red-500' : ''}
                  placeholder="Country"
                />
              </div>
            </div>
            
            {/* Contact Information */}
            <div>
              <Label htmlFor="email" className="flex justify-between">
                <span>Email Address</span>
                {isFieldMissing('email') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('email') ? 'border-red-500' : ''}
                placeholder="example@company.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="flex justify-between">
                <span>Phone Number</span>
                {isFieldMissing('phone') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('phone') ? 'border-red-500' : ''}
                placeholder="Phone number with area code"
              />
            </div>
          </div>
          
          {/* SECTION 2: Order & Product Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-neutral-500 uppercase border-b pb-2">Order & Product Information</h3>
            
            <div>
              <Label htmlFor="orderNumber" className="flex justify-between">
                <span>Order Number</span>
                {isFieldMissing('orderNumber') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                value={formData.orderNumber}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('orderNumber') ? 'border-red-500' : ''}
                placeholder="Order Number/Invoice ID"
              />
            </div>
            
            <div>
              <Label htmlFor="purchaseDate" className="flex justify-between">
                <span>Purchase Date</span>
                {isFieldMissing('purchaseDate') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('purchaseDate') ? 'border-red-500' : ''}
                placeholder="MM/DD/YYYY"
              />
            </div>
            
            <div>
              <Label htmlFor="productName" className="flex justify-between">
                <span>Product Name/Model</span>
                {isFieldMissing('productName') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('productName') ? 'border-red-500' : ''}
                placeholder="Product name or model"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productSku" className="flex justify-between">
                  <span>Product SKU</span>
                  {isFieldMissing('productSku') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="productSku"
                  name="productSku"
                  value={formData.productSku}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('productSku') ? 'border-red-500' : ''}
                  placeholder="Product SKU/ID"
                />
              </div>
              <div>
                <Label htmlFor="productQuantity" className="flex justify-between">
                  <span>Quantity</span>
                  {isFieldMissing('productQuantity') && <span className="text-red-500">*Required</span>}
                </Label>
                <Input
                  id="productQuantity"
                  name="productQuantity"
                  value={formData.productQuantity}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={isFieldMissing('productQuantity') ? 'border-red-500' : ''}
                  placeholder="Quantity"
                />
              </div>
            </div>
              
            <div>
              <Label htmlFor="claimAmount" className="flex justify-between">
                <span>Claim Amount ($)</span>
                {isFieldMissing('claimAmount') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="claimAmount"
                name="claimAmount"
                value={formData.claimAmount}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('claimAmount') ? 'border-red-500' : ''}
                placeholder="Dollar amount of claim"
              />
            </div>
            
            <div>
              <Label htmlFor="claimType" className="flex justify-between">
                <span>Claim Type</span>
                {isFieldMissing('claimType') && <span className="text-red-500">*Required</span>}
              </Label>
              {isEditing ? (
                <Select 
                  value={formData.claimType} 
                  onValueChange={(value) => handleSelectChange('claimType', value)}
                >
                  <SelectTrigger className={isFieldMissing('claimType') ? 'border-red-500' : ''}>
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
                  className={isFieldMissing('claimType') ? 'border-red-500' : ''}
                  placeholder="Claim type (empty)"
                />
              )}
            </div>
            
            <div>
              <Label htmlFor="dateOfIncident" className="flex justify-between">
                <span>Date of Incident</span>
                {isFieldMissing('dateOfIncident') && <span className="text-red-500">*Required</span>}
              </Label>
              <Input
                id="dateOfIncident"
                name="dateOfIncident"
                type="date"
                value={formData.dateOfIncident}
                onChange={handleChange}
                disabled={!isEditing}
                className={isFieldMissing('dateOfIncident') ? 'border-red-500' : ''}
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>
        </div>
        
        {/* SECTION 3: Claim Details & Description */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-medium text-neutral-500 uppercase border-b pb-2">Claim Details</h3>
          
          <div>
            <Label htmlFor="damageDescription" className="flex justify-between">
              <span>Damage/Issue Description</span>
              {isFieldMissing('damageDescription') && <span className="text-red-500">*Required</span>}
            </Label>
            <Textarea
              id="damageDescription"
              name="damageDescription"
              value={formData.damageDescription}
              onChange={handleChange}
              disabled={!isEditing}
              rows={3}
              className={isFieldMissing('damageDescription') ? 'border-red-500' : ''}
              placeholder="Detailed description of the damage or issue"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="flex justify-between">
              <span>Additional Notes</span>
              {isFieldMissing('description') && <span className="text-red-500">*Required</span>}
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={!isEditing}
              rows={3}
              className={isFieldMissing('description') ? 'border-red-500' : ''}
              placeholder="Any additional information or notes"
            />
          </div>
          
          <div>
            <Label htmlFor="preferredResolution" className="flex justify-between">
              <span>Preferred Resolution</span>
              {isFieldMissing('preferredResolution') && <span className="text-red-500">*Required</span>}
            </Label>
            {isEditing ? (
              <Select 
                value={formData.preferredResolution} 
                onValueChange={(value) => handleSelectChange('preferredResolution', value)}
              >
                <SelectTrigger className={isFieldMissing('preferredResolution') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select preferred resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="Replacement">Replacement</SelectItem>
                  <SelectItem value="Credit">Store Credit</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="preferredResolution"
                name="preferredResolution"
                value={formData.preferredResolution}
                disabled
                className={isFieldMissing('preferredResolution') ? 'border-red-500' : ''}
                placeholder="Preferred resolution (empty)"
              />
            )}
          </div>
          
          {/* Attachments Section */}
          <div>
            <Label htmlFor="attachments" className="flex justify-between">
              <span>Attached Documents</span>
              <span className="text-neutral-400">(System Managed)</span>
            </Label>
            <Input
              id="attachments"
              name="attachments"
              value={formData.attachments || "Documents attached to this claim will appear here"}
              disabled
              className="bg-neutral-50"
            />
          </div>
          
          {/* Claim Status (Admin Only) */}
          <div>
            <Label htmlFor="status" className="flex justify-between">
              <span>Claim Status</span>
              <span className="text-neutral-400">(Admin Only)</span>
            </Label>
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
        
        {/* Submission Section */}
        {isEditing && (
          <div className="flex justify-end gap-2 mt-8 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-1">
              <span className="material-icons text-sm">save</span> Update Claim
            </Button>
          </div>
        )}
      </form>
      
      {/* Missing Information Alert */}
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
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}