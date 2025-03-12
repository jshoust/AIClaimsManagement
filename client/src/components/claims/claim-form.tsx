import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Claim } from "@shared/schema";

// Schema that matches the Ward Trucking claim form
const claimFormSchema = z.object({
  // Ward Trucking specific fields
  wardProNumber: z.string().optional(),
  todaysDate: z.string().optional(),
  freightBillDate: z.string().optional(),
  claimantsRefNumber: z.string().optional(),
  claimAmount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"), // shortage or damage
  
  // Shipper information
  shipperName: z.string().min(1, "Shipper name is required"), 
  shipperAddress: z.string().min(1, "Shipper address is required"),
  shipperPhone: z.string().min(1, "Shipper phone is required"),
  
  // Consignee information
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeAddress: z.string().min(1, "Consignee address is required"),
  consigneePhone: z.string().min(1, "Consignee phone is required"),
  
  // Claim details
  claimDescription: z.string().min(1, "Detailed claim statement is required"),
  
  // Supporting documents
  originalBillOfLading: z.boolean().optional().default(false),
  originalFreightBill: z.boolean().optional().default(false),
  originalInvoice: z.boolean().optional().default(false),
  
  // Additional information
  isRepairable: z.string().optional(),
  repairCost: z.string().optional(),
  
  // Claimant information
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  fax: z.string().optional(),
  
  // Additional fields
  signature: z.string().optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimFormProps {
  initialData?: Partial<Claim>;
  onSubmit: (data: ClaimFormValues) => void;
  onCancel: () => void;
  missingFields?: string[];
  isLoading?: boolean;
}

export function ClaimForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel, 
  missingFields = [],
  isLoading = false 
}: ClaimFormProps) {
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      // Ward Trucking specific fields
      wardProNumber: initialData.wardProNumber || "",
      todaysDate: initialData.todaysDate || new Date().toISOString().split('T')[0],
      freightBillDate: initialData.freightBillDate || "",
      claimantsRefNumber: initialData.claimantsRefNumber || "",
      claimAmount: initialData.claimAmount || "",
      claimType: initialData.claimType || "Damage",
      
      // Shipper information
      shipperName: initialData.shipperName || "", 
      shipperAddress: initialData.shipperAddress || "",
      shipperPhone: initialData.shipperPhone || "",
      
      // Consignee information
      consigneeName: initialData.consigneeName || "",
      consigneeAddress: initialData.consigneeAddress || "",
      consigneePhone: initialData.consigneePhone || "",
      
      // Claim details
      claimDescription: initialData.claimDescription || "",
      
      // Supporting documents - these would be checkboxes
      originalBillOfLading: initialData.originalBillOfLading || false,
      originalFreightBill: initialData.originalFreightBill || false,
      originalInvoice: initialData.originalInvoice || false,
      
      // Additional information
      isRepairable: initialData.isRepairable || "No",
      repairCost: initialData.repairCost || "",
      
      // Claimant information
      companyName: initialData.companyName || "Ward Trucking Corp",
      address: initialData.address || "",
      contactPerson: initialData.contactPerson || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      fax: initialData.fax || "",
      
      signature: initialData.signature || "",
    },
  });
  
  const handleSubmit = (data: ClaimFormValues) => {
    onSubmit(data);
  };
  
  // Check if a field is missing
  const isMissing = (fieldName: string): boolean => {
    return missingFields.some(field => {
      // Handle field name variations (camelCase vs. spaces)
      const normalizedField = field.toLowerCase().replace(/\s+/g, "");
      const normalizedFieldName = fieldName.toLowerCase();
      return normalizedField.includes(normalizedFieldName) || normalizedFieldName.includes(normalizedField);
    });
  };
  
  return (
    <div className="flex flex-col w-full">
      {/* Header with logo and form title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Ward Trucking Corp</h1>
          <p className="text-muted-foreground">Freight Claim Form</p>
        </div>
        <img src="/assets/logo.png" alt="Boon Logo" className="h-16 w-auto" />
      </div>
      
      {/* Missing information alert */}
      {missingFields.length > 0 && (
        <Card className="mb-6 border-amber-500 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <CardTitle className="text-amber-700 text-lg">Missing Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-700">
              The following information is missing from the claim:
            </CardDescription>
            <ul className="mt-2 pl-6 list-disc">
              {missingFields.map((field, index) => (
                <li key={index} className="text-amber-700">{field}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Form header */}
      <div className="flex mb-6 border-b">
        <h2 className="px-4 py-2 font-medium text-lg text-primary border-b-2 border-primary">
          Ward Trucking Loss and Damage Claim Form
        </h2>
      </div>
      
      {/* Main Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-8">
          {/* Ward Pro Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Claim Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ward Pro Number */}
              <div className="space-y-2">
                <Label htmlFor="wardProNumber" className={cn(
                  isMissing("wardProNumber") && "text-red-500 font-medium"
                )}>
                  Ward Pro Number {isMissing("wardProNumber") && "*"}
                </Label>
                <Input
                  id="wardProNumber"
                  {...form.register("wardProNumber")}
                  className={cn(
                    isMissing("wardProNumber") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.wardProNumber && (
                  <p className="text-red-500 text-sm">{form.formState.errors.wardProNumber.message}</p>
                )}
              </div>
              
              {/* Today's Date */}
              <div className="space-y-2">
                <Label htmlFor="todaysDate" className={cn(
                  isMissing("todaysDate") && "text-red-500 font-medium"
                )}>
                  Today's Date {isMissing("todaysDate") && "*"}
                </Label>
                <Input
                  id="todaysDate"
                  type="date"
                  {...form.register("todaysDate")}
                  className={cn(
                    isMissing("todaysDate") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.todaysDate && (
                  <p className="text-red-500 text-sm">{form.formState.errors.todaysDate.message}</p>
                )}
              </div>
              
              {/* Freight Bill Date */}
              <div className="space-y-2">
                <Label htmlFor="freightBillDate" className={cn(
                  isMissing("freightBillDate") && "text-red-500 font-medium"
                )}>
                  Freight Bill Date {isMissing("freightBillDate") && "*"}
                </Label>
                <Input
                  id="freightBillDate"
                  type="date"
                  {...form.register("freightBillDate")}
                  className={cn(
                    isMissing("freightBillDate") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.freightBillDate && (
                  <p className="text-red-500 text-sm">{form.formState.errors.freightBillDate.message}</p>
                )}
              </div>
              
              {/* Claimant's Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="claimantsRefNumber" className={cn(
                  isMissing("claimantsRefNumber") && "text-red-500 font-medium"
                )}>
                  Claimant's Reference Number {isMissing("claimantsRefNumber") && "*"}
                </Label>
                <Input
                  id="claimantsRefNumber"
                  {...form.register("claimantsRefNumber")}
                  className={cn(
                    isMissing("claimantsRefNumber") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.claimantsRefNumber && (
                  <p className="text-red-500 text-sm">{form.formState.errors.claimantsRefNumber.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Claim Amount Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Claim Amount</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Claim Amount */}
              <div className="space-y-2">
                <Label htmlFor="claimAmount" className={cn(
                  isMissing("claimAmount") && "text-red-500 font-medium"
                )}>
                  Amount ($) {isMissing("claimAmount") && "*"}
                </Label>
                <Input
                  id="claimAmount"
                  {...form.register("claimAmount")}
                  className={cn(
                    isMissing("claimAmount") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.claimAmount && (
                  <p className="text-red-500 text-sm">{form.formState.errors.claimAmount.message}</p>
                )}
              </div>
              
              {/* Claim Type */}
              <div className="space-y-2">
                <Label htmlFor="claimType" className={cn(
                  isMissing("claimType") && "text-red-500 font-medium"
                )}>
                  Claim Type {isMissing("claimType") && "*"}
                </Label>
                <Select 
                  onValueChange={(value) => form.setValue("claimType", value)} 
                  defaultValue={form.getValues("claimType")}
                >
                  <SelectTrigger className={cn(
                    isMissing("claimType") && "border-red-500 focus-visible:ring-red-500"
                  )}>
                    <SelectValue placeholder="Select claim type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shortage">Shortage</SelectItem>
                    <SelectItem value="Damage">Damage</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.claimType && (
                  <p className="text-red-500 text-sm">{form.formState.errors.claimType.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Shipper Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Shipper Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shipper Name */}
              <div className="space-y-2">
                <Label htmlFor="shipperName" className={cn(
                  isMissing("shipperName") && "text-red-500 font-medium"
                )}>
                  Shipper Name {isMissing("shipperName") && "*"}
                </Label>
                <Input
                  id="shipperName"
                  {...form.register("shipperName")}
                  className={cn(
                    isMissing("shipperName") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.shipperName && (
                  <p className="text-red-500 text-sm">{form.formState.errors.shipperName.message}</p>
                )}
              </div>
              
              {/* Shipper Address */}
              <div className="space-y-2">
                <Label htmlFor="shipperAddress" className={cn(
                  isMissing("shipperAddress") && "text-red-500 font-medium"
                )}>
                  Shipper Address {isMissing("shipperAddress") && "*"}
                </Label>
                <Input
                  id="shipperAddress"
                  {...form.register("shipperAddress")}
                  className={cn(
                    isMissing("shipperAddress") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.shipperAddress && (
                  <p className="text-red-500 text-sm">{form.formState.errors.shipperAddress.message}</p>
                )}
              </div>
              
              {/* Shipper Phone */}
              <div className="space-y-2">
                <Label htmlFor="shipperPhone" className={cn(
                  isMissing("shipperPhone") && "text-red-500 font-medium"
                )}>
                  Shipper Phone {isMissing("shipperPhone") && "*"}
                </Label>
                <Input
                  id="shipperPhone"
                  {...form.register("shipperPhone")}
                  className={cn(
                    isMissing("shipperPhone") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.shipperPhone && (
                  <p className="text-red-500 text-sm">{form.formState.errors.shipperPhone.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Consignee Information Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Consignee Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Consignee Name */}
              <div className="space-y-2">
                <Label htmlFor="consigneeName" className={cn(
                  isMissing("consigneeName") && "text-red-500 font-medium"
                )}>
                  Consignee Name {isMissing("consigneeName") && "*"}
                </Label>
                <Input
                  id="consigneeName"
                  {...form.register("consigneeName")}
                  className={cn(
                    isMissing("consigneeName") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.consigneeName && (
                  <p className="text-red-500 text-sm">{form.formState.errors.consigneeName.message}</p>
                )}
              </div>
              
              {/* Consignee Address */}
              <div className="space-y-2">
                <Label htmlFor="consigneeAddress" className={cn(
                  isMissing("consigneeAddress") && "text-red-500 font-medium"
                )}>
                  Consignee Address {isMissing("consigneeAddress") && "*"}
                </Label>
                <Input
                  id="consigneeAddress"
                  {...form.register("consigneeAddress")}
                  className={cn(
                    isMissing("consigneeAddress") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.consigneeAddress && (
                  <p className="text-red-500 text-sm">{form.formState.errors.consigneeAddress.message}</p>
                )}
              </div>
              
              {/* Consignee Phone */}
              <div className="space-y-2">
                <Label htmlFor="consigneePhone" className={cn(
                  isMissing("consigneePhone") && "text-red-500 font-medium"
                )}>
                  Consignee Phone {isMissing("consigneePhone") && "*"}
                </Label>
                <Input
                  id="consigneePhone"
                  {...form.register("consigneePhone")}
                  className={cn(
                    isMissing("consigneePhone") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.consigneePhone && (
                  <p className="text-red-500 text-sm">{form.formState.errors.consigneePhone.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Detailed Statement Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Detailed Statement</h2>
            
            <div className="space-y-4">
              {/* Claim Description */}
              <div className="space-y-2">
                <Label htmlFor="claimDescription" className={cn(
                  isMissing("claimDescription") && "text-red-500 font-medium"
                )}>
                  Detailed Statement of Claim {isMissing("claimDescription") && "*"}
                </Label>
                <Textarea
                  id="claimDescription"
                  rows={5}
                  {...form.register("claimDescription")}
                  className={cn(
                    isMissing("claimDescription") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.claimDescription && (
                  <p className="text-red-500 text-sm">{form.formState.errors.claimDescription.message}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Supporting Documents */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">The Following Documents Are Submitted In Support Of This Claim</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="originalBillOfLading" 
                  checked={form.watch("originalBillOfLading")}
                  onCheckedChange={(checked) => 
                    form.setValue("originalBillOfLading", checked as boolean)
                  }
                />
                <Label htmlFor="originalBillOfLading" className="font-normal">
                  Original Bill of Lading
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="originalFreightBill" 
                  checked={form.watch("originalFreightBill")}
                  onCheckedChange={(checked) => 
                    form.setValue("originalFreightBill", checked as boolean)
                  }
                />
                <Label htmlFor="originalFreightBill" className="font-normal">
                  Original Freight Bill
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="originalInvoice" 
                  checked={form.watch("originalInvoice")}
                  onCheckedChange={(checked) => 
                    form.setValue("originalInvoice", checked as boolean)
                  }
                />
                <Label htmlFor="originalInvoice" className="font-normal">
                  Original Invoice
                </Label>
              </div>
            </div>
          </div>
          
          {/* Is Merchandise Repairable */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isRepairable" className={cn(
                  isMissing("isRepairable") && "text-red-500 font-medium"
                )}>
                  Is Merchandise Repairable? {isMissing("isRepairable") && "*"}
                </Label>
                <Select 
                  onValueChange={(value) => form.setValue("isRepairable", value)} 
                  defaultValue={form.getValues("isRepairable")}
                >
                  <SelectTrigger className={cn(
                    isMissing("isRepairable") && "border-red-500 focus-visible:ring-red-500"
                  )}>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.isRepairable && (
                  <p className="text-red-500 text-sm">{form.formState.errors.isRepairable.message}</p>
                )}
              </div>
              
              {form.watch("isRepairable") === "Yes" && (
                <div className="space-y-2">
                  <Label htmlFor="repairCost" className={cn(
                    isMissing("repairCost") && "text-red-500 font-medium"
                  )}>
                    Repair Cost ($) {isMissing("repairCost") && "*"}
                  </Label>
                  <Input
                    id="repairCost"
                    {...form.register("repairCost")}
                    className={cn(
                      isMissing("repairCost") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.repairCost && (
                    <p className="text-red-500 text-sm">{form.formState.errors.repairCost.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Claimant Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Claimant Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className={cn(
                  isMissing("companyName") && "text-red-500 font-medium"
                )}>
                  Company Name {isMissing("companyName") && "*"}
                </Label>
                <Input
                  id="companyName"
                  {...form.register("companyName")}
                  className={cn(
                    isMissing("companyName") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.companyName && (
                  <p className="text-red-500 text-sm">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className={cn(
                  isMissing("address") && "text-red-500 font-medium"
                )}>
                  Address {isMissing("address") && "*"}
                </Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  className={cn(
                    isMissing("address") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.address && (
                  <p className="text-red-500 text-sm">{form.formState.errors.address.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className={cn(
                  isMissing("contactPerson") && "text-red-500 font-medium"
                )}>
                  Contact Person {isMissing("contactPerson") && "*"}
                </Label>
                <Input
                  id="contactPerson"
                  {...form.register("contactPerson")}
                  className={cn(
                    isMissing("contactPerson") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.contactPerson && (
                  <p className="text-red-500 text-sm">{form.formState.errors.contactPerson.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className={cn(
                  isMissing("email") && "text-red-500 font-medium"
                )}>
                  Email {isMissing("email") && "*"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className={cn(
                    isMissing("email") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className={cn(
                  isMissing("phone") && "text-red-500 font-medium"
                )}>
                  Phone {isMissing("phone") && "*"}
                </Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  className={cn(
                    isMissing("phone") && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fax">
                  Fax (Optional)
                </Label>
                <Input
                  id="fax"
                  {...form.register("fax")}
                  placeholder="Fax number"
                />
              </div>
            </div>
          </div>
          
          {/* Verification Statement */}
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <p className="text-sm">
              I certify that the foregoing statement of facts is true and correct, and acknowledge that the submission of a fraudulent claim may subject the claimant to legal action.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="signature" className={cn(
                isMissing("signature") && "text-red-500 font-medium"
              )}>
                Authorized Signature {isMissing("signature") && "*"}
              </Label>
              <Input
                id="signature"
                {...form.register("signature")}
                className={cn(
                  isMissing("signature") && "border-red-500 focus-visible:ring-red-500"
                )}
                placeholder="Type full name to sign"
              />
              {form.formState.errors.signature && (
                <p className="text-red-500 text-sm">{form.formState.errors.signature.message}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button type="button" variant="outline" className="text-sm">
                Print Form
              </Button>
            </div>
          </div>
          
          {/* Form Footer */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}