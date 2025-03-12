import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Claim } from "@shared/schema";

// Schema that matches the PDF form
const claimFormSchema = z.object({
  // Customer Information
  customerName: z.string().min(1, "Customer name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  
  // Address Information
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip/Postal code is required"),
  country: z.string().min(1, "Country is required"),
  
  // Order Information
  orderNumber: z.string().min(1, "Order number is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  productName: z.string().min(1, "Product name is required"),
  productSku: z.string().optional(),
  productQuantity: z.string().optional(),
  
  // Claim Information
  claimAmount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"),
  description: z.string().min(1, "Claim description is required"),
  damageDescription: z.string().min(1, "Damage description is required"),
  dateOfIncident: z.string().min(1, "Date of incident is required"),
  preferredResolution: z.string().min(1, "Preferred resolution is required"),
  
  // Additional fields
  signature: z.string().optional(),
  attachments: z.string().optional(),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

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
  const [activeTab, setActiveTab] = useState<"customerInfo" | "claimDetails">("customerInfo");
  
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      customerName: initialData.customerName || "",
      contactPerson: initialData.contactPerson || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      addressLine1: initialData.addressLine1 || "",
      addressLine2: initialData.addressLine2 || "",
      city: initialData.city || "",
      state: initialData.state || "",
      zipCode: initialData.zipCode || "",
      country: initialData.country || "",
      orderNumber: initialData.orderNumber || "",
      purchaseDate: initialData.purchaseDate || "",
      productName: initialData.productName || "",
      productSku: initialData.productSku || "",
      productQuantity: initialData.productQuantity || "",
      claimAmount: initialData.claimAmount || "",
      claimType: initialData.claimType || "",
      description: initialData.description || "",
      damageDescription: initialData.damageDescription || "",
      dateOfIncident: initialData.dateOfIncident || "",
      preferredResolution: initialData.preferredResolution || "",
      signature: initialData.signature || "",
      attachments: initialData.attachments || "",
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
          <h1 className="text-2xl font-bold text-primary">Boon AI Claims Processing</h1>
          <p className="text-muted-foreground">Customer Claim Form</p>
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
      
      {/* Tab navigation */}
      <div className="flex mb-6 border-b">
        <button
          type="button"
          className={cn(
            "px-4 py-2 font-medium text-sm",
            activeTab === "customerInfo" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("customerInfo")}
        >
          Customer Information
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-2 font-medium text-sm", 
            activeTab === "claimDetails" 
              ? "border-b-2 border-primary text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("claimDetails")}
        >
          Claim Details
        </button>
      </div>
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {activeTab === "customerInfo" && (
          <div className="space-y-8">
            {/* Customer Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customerName" className={cn(
                    isMissing("customerName") && "text-red-500 font-medium"
                  )}>
                    Company/Customer Name {isMissing("customerName") && "*"}
                  </Label>
                  <Input
                    id="customerName"
                    {...form.register("customerName")}
                    className={cn(
                      isMissing("customerName") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.customerName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.customerName.message}</p>
                  )}
                </div>
                
                {/* Contact Person */}
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
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className={cn(
                    isMissing("email") && "text-red-500 font-medium"
                  )}>
                    Email Address {isMissing("email") && "*"}
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
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className={cn(
                    isMissing("phone") && "text-red-500 font-medium"
                  )}>
                    Phone Number {isMissing("phone") && "*"}
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
              </div>
            </div>
            
            {/* Address Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Address</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Address Line 1 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine1" className={cn(
                    isMissing("addressLine1") && "text-red-500 font-medium"
                  )}>
                    Address Line 1 {isMissing("addressLine1") && "*"}
                  </Label>
                  <Input
                    id="addressLine1"
                    {...form.register("addressLine1")}
                    className={cn(
                      isMissing("addressLine1") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.addressLine1 && (
                    <p className="text-red-500 text-sm">{form.formState.errors.addressLine1.message}</p>
                  )}
                </div>
                
                {/* Address Line 2 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">
                    Address Line 2 (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    {...form.register("addressLine2")}
                  />
                </div>
                
                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className={cn(
                    isMissing("city") && "text-red-500 font-medium"
                  )}>
                    City {isMissing("city") && "*"}
                  </Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    className={cn(
                      isMissing("city") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.city && (
                    <p className="text-red-500 text-sm">{form.formState.errors.city.message}</p>
                  )}
                </div>
                
                {/* State/Province */}
                <div className="space-y-2">
                  <Label htmlFor="state" className={cn(
                    isMissing("state") && "text-red-500 font-medium"
                  )}>
                    State/Province {isMissing("state") && "*"}
                  </Label>
                  <Input
                    id="state"
                    {...form.register("state")}
                    className={cn(
                      isMissing("state") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.state && (
                    <p className="text-red-500 text-sm">{form.formState.errors.state.message}</p>
                  )}
                </div>
                
                {/* Zip/Postal Code */}
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className={cn(
                    isMissing("zipCode") && "text-red-500 font-medium"
                  )}>
                    ZIP/Postal Code {isMissing("zipCode") && "*"}
                  </Label>
                  <Input
                    id="zipCode"
                    {...form.register("zipCode")}
                    className={cn(
                      isMissing("zipCode") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.zipCode && (
                    <p className="text-red-500 text-sm">{form.formState.errors.zipCode.message}</p>
                  )}
                </div>
                
                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className={cn(
                    isMissing("country") && "text-red-500 font-medium"
                  )}>
                    Country {isMissing("country") && "*"}
                  </Label>
                  <Input
                    id="country"
                    {...form.register("country")}
                    className={cn(
                      isMissing("country") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.country && (
                    <p className="text-red-500 text-sm">{form.formState.errors.country.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Order Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Order Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Order Number */}
                <div className="space-y-2">
                  <Label htmlFor="orderNumber" className={cn(
                    isMissing("orderNumber") && "text-red-500 font-medium"
                  )}>
                    Order/Invoice Number {isMissing("orderNumber") && "*"}
                  </Label>
                  <Input
                    id="orderNumber"
                    {...form.register("orderNumber")}
                    className={cn(
                      isMissing("orderNumber") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.orderNumber && (
                    <p className="text-red-500 text-sm">{form.formState.errors.orderNumber.message}</p>
                  )}
                </div>
                
                {/* Purchase Date */}
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate" className={cn(
                    isMissing("purchaseDate") && "text-red-500 font-medium"
                  )}>
                    Purchase Date {isMissing("purchaseDate") && "*"}
                  </Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    {...form.register("purchaseDate")}
                    className={cn(
                      isMissing("purchaseDate") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.purchaseDate && (
                    <p className="text-red-500 text-sm">{form.formState.errors.purchaseDate.message}</p>
                  )}
                </div>
                
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="productName" className={cn(
                    isMissing("productName") && "text-red-500 font-medium"
                  )}>
                    Product Name {isMissing("productName") && "*"}
                  </Label>
                  <Input
                    id="productName"
                    {...form.register("productName")}
                    className={cn(
                      isMissing("productName") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.productName && (
                    <p className="text-red-500 text-sm">{form.formState.errors.productName.message}</p>
                  )}
                </div>
                
                {/* Product SKU */}
                <div className="space-y-2">
                  <Label htmlFor="productSku" className={cn(
                    isMissing("productSku") && "text-red-500 font-medium"
                  )}>
                    Product SKU/ID {isMissing("productSku") && "*"}
                  </Label>
                  <Input
                    id="productSku"
                    {...form.register("productSku")}
                    className={cn(
                      isMissing("productSku") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
                
                {/* Product Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="productQuantity" className={cn(
                    isMissing("productQuantity") && "text-red-500 font-medium"
                  )}>
                    Quantity {isMissing("productQuantity") && "*"}
                  </Label>
                  <Input
                    id="productQuantity"
                    type="number"
                    min="1"
                    {...form.register("productQuantity")}
                    className={cn(
                      isMissing("productQuantity") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={() => setActiveTab("claimDetails")}>
                Next: Claim Details
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === "claimDetails" && (
          <div className="space-y-8">
            {/* Claim Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Claim Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Claim Amount */}
                <div className="space-y-2">
                  <Label htmlFor="claimAmount" className={cn(
                    isMissing("claimAmount") && "text-red-500 font-medium"
                  )}>
                    Claim Amount ($) {isMissing("claimAmount") && "*"}
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
                      <SelectItem value="Damaged Product">Damaged Product</SelectItem>
                      <SelectItem value="Missing Item">Missing Item</SelectItem>
                      <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                      <SelectItem value="Quality Issue">Quality Issue</SelectItem>
                      <SelectItem value="Warranty Claim">Warranty Claim</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.claimType && (
                    <p className="text-red-500 text-sm">{form.formState.errors.claimType.message}</p>
                  )}
                </div>
                
                {/* Date of Incident */}
                <div className="space-y-2">
                  <Label htmlFor="dateOfIncident" className={cn(
                    isMissing("dateOfIncident") && "text-red-500 font-medium"
                  )}>
                    Date of Incident {isMissing("dateOfIncident") && "*"}
                  </Label>
                  <Input
                    id="dateOfIncident"
                    type="date"
                    {...form.register("dateOfIncident")}
                    className={cn(
                      isMissing("dateOfIncident") && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {form.formState.errors.dateOfIncident && (
                    <p className="text-red-500 text-sm">{form.formState.errors.dateOfIncident.message}</p>
                  )}
                </div>
                
                {/* Preferred Resolution */}
                <div className="space-y-2">
                  <Label htmlFor="preferredResolution" className={cn(
                    isMissing("preferredResolution") && "text-red-500 font-medium"
                  )}>
                    Preferred Resolution {isMissing("preferredResolution") && "*"}
                  </Label>
                  <Select
                    onValueChange={(value) => form.setValue("preferredResolution", value)}
                    defaultValue={form.getValues("preferredResolution")}
                  >
                    <SelectTrigger className={cn(
                      isMissing("preferredResolution") && "border-red-500 focus-visible:ring-red-500"
                    )}>
                      <SelectValue placeholder="Select preferred resolution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Refund">Full Refund</SelectItem>
                      <SelectItem value="Replacement">Replacement</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Partial Refund">Partial Refund</SelectItem>
                      <SelectItem value="Exchange">Exchange</SelectItem>
                      <SelectItem value="Credit">Store Credit</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.preferredResolution && (
                    <p className="text-red-500 text-sm">{form.formState.errors.preferredResolution.message}</p>
                  )}
                </div>
              </div>
              
              {/* Claim Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className={cn(
                  isMissing("description") && "text-red-500 font-medium"
                )}>
                  Claim Description {isMissing("description") && "*"}
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  {...form.register("description")}
                  className={cn(
                    isMissing("description") && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Please provide a detailed description of the claim..."
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>
                )}
              </div>
              
              {/* Damage Description */}
              <div className="space-y-2">
                <Label htmlFor="damageDescription" className={cn(
                  isMissing("damageDescription") && "text-red-500 font-medium"
                )}>
                  Damage/Issue Description {isMissing("damageDescription") && "*"}
                </Label>
                <Textarea
                  id="damageDescription"
                  rows={3}
                  {...form.register("damageDescription")}
                  className={cn(
                    isMissing("damageDescription") && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Please describe the damage or issue in detail..."
                />
                {form.formState.errors.damageDescription && (
                  <p className="text-red-500 text-sm">{form.formState.errors.damageDescription.message}</p>
                )}
              </div>
              
              {/* Signature */}
              <div className="space-y-2">
                <Label htmlFor="signature" className={cn(
                  isMissing("signature") && "text-red-500 font-medium"
                )}>
                  Electronic Signature {isMissing("signature") && "*"}
                </Label>
                <Input
                  id="signature"
                  {...form.register("signature")}
                  className={cn(
                    isMissing("signature") && "border-red-500 focus-visible:ring-red-500"
                  )}
                  placeholder="Type your full name to sign"
                />
                <p className="text-xs text-muted-foreground">
                  By typing your name above, you certify that all information provided is true and accurate to the best of your knowledge.
                </p>
              </div>
              
              {/* Attachments */}
              <div className="space-y-2">
                <Label htmlFor="attachments" className={cn(
                  isMissing("attachments") && "text-red-500 font-medium"
                )}>
                  Supporting Documents {isMissing("attachments") && "*"}
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Please upload any supporting documents such as photos, receipts, or invoices.
                </p>
                <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Document upload functionality is handled separately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab("customerInfo")}>
                Back: Customer Information
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit Claim"}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}