import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Claim } from "@shared/schema";

// Ward claim form validation schema
const wardClaimFormSchema = z.object({
  // Ward specific required fields
  wardProNumber: z.string().min(1, "Ward PRO# is required"),
  todaysDate: z.string().min(1, "Today's date is required"),
  freightBillDate: z.string().min(1, "Freight bill date is required"),
  claimantsRefNumber: z.string().min(1, "Claimant's ref number is required"),
  
  // Claim amount and type
  claimAmount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"),
  
  // Shipper information
  shipperName: z.string().min(1, "Shipper name is required"),
  shipperAddress: z.string().min(1, "Shipper address is required"),
  shipperPhone: z.string().min(1, "Shipper phone is required"),
  
  // Consignee information
  consigneeName: z.string().min(1, "Consignee name is required"),
  consigneeAddress: z.string().min(1, "Consignee address is required"),
  consigneePhone: z.string().min(1, "Consignee phone is required"),
  
  // Claim details
  detailedStatement: z.string().min(10, "A detailed statement is required (min 10 characters)"),
  
  // Company and contact info
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  emailAddress: z.string().email("Invalid email address").min(1, "Email is required"),
  phone: z.string().min(10, "Phone number is required (min 10 digits)"),
  
  // Supporting documents
  originalBillOfLading: z.boolean().optional(),
  originalFreightBill: z.boolean().optional(),
  originalInvoice: z.boolean().optional(),
  
  // Merchandise status
  merchandiseRepairable: z.string().optional(),
  repairCost: z.string().optional(),
  
  // Signature
  signature: z.string().min(1, "Signature is required")
});

type WardClaimFormValues = z.infer<typeof wardClaimFormSchema>;

interface WardClaimFormProps {
  initialData?: Partial<Claim>;
  onSubmit: (data: WardClaimFormValues) => void;
  onCancel: () => void;
  missingFields?: string[];
  isLoading?: boolean;
}

export function WardClaimForm({
  initialData = {},
  onSubmit,
  onCancel,
  missingFields = [],
  isLoading = false
}: WardClaimFormProps) {
  // Current date for default values
  const today = new Date().toISOString().split('T')[0];
  
  // Form definition
  const form = useForm<WardClaimFormValues>({
    resolver: zodResolver(wardClaimFormSchema),
    defaultValues: {
      // Ward specific fields
      wardProNumber: initialData.wardProNumber || "",
      todaysDate: initialData.todaysDate || today,
      freightBillDate: initialData.freightBillDate || "",
      claimantsRefNumber: initialData.claimantsRefNumber || "",
      
      // Claim amount and type
      claimAmount: initialData.claimAmount || "",
      claimType: initialData.claimType || "",
      
      // Shipper information
      shipperName: initialData.shipperName || "",
      shipperAddress: initialData.shipperAddress || "",
      shipperPhone: initialData.shipperPhone || "",
      
      // Consignee information
      consigneeName: initialData.consigneeName || "",
      consigneeAddress: initialData.consigneeAddress || "",
      consigneePhone: initialData.consigneePhone || "",
      
      // Claim details
      detailedStatement: initialData.detailedStatement || "",
      
      // Company and contact info
      companyName: initialData.companyName || "",
      companyAddress: initialData.companyAddress || "",
      contactPerson: initialData.contactPerson || "",
      emailAddress: initialData.email || "",
      phone: initialData.phone || "",
      
      // Supporting documents
      originalBillOfLading: initialData.originalBillOfLading === "true" || false,
      originalFreightBill: initialData.originalFreightBill === "true" || false,
      originalInvoice: initialData.originalInvoice === "true" || false,
      
      // Merchandise status
      merchandiseRepairable: initialData.merchandiseRepairable || "",
      repairCost: initialData.repairCost || "",
      
      // Signature
      signature: initialData.signature || ""
    }
  });
  
  const [claimTypeValue, setClaimTypeValue] = useState(initialData.claimType || "");
  const [isRepairable, setIsRepairable] = useState(initialData.merchandiseRepairable === "Yes");
  
  const handleSubmit = (data: WardClaimFormValues) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header with Ward logo */}
        <div className="bg-green-800 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">TO: WARD TRUCKING CORP</h1>
            <img 
              src="/client/public/ward-logo.png" 
              alt="Ward Trucking Logo" 
              className="h-8" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
          </div>
        </div>
        
        {/* Claim Identifier Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <FormField
            control={form.control}
            name="wardProNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">WARD PRO#</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Ward PRO number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="todaysDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">TODAY'S DATE</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="freightBillDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">FREIGHT BILL DATE</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="claimantsRefNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">CLAIMANT'S REF #</FormLabel>
                <FormControl>
                  <Input placeholder="Enter reference number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Claim Amount and Type */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">CLAIM AMOUNT AND TYPE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="claimAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Amount ($)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter dollar amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="claimType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Type</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setClaimTypeValue(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Shortage">Shortage</SelectItem>
                      <SelectItem value="Damage">Damage</SelectItem>
                      <SelectItem value="Loss">Loss</SelectItem>
                      <SelectItem value="Delay">Delay</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Shipper Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">SHIPPER INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shipperName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipper Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shipper name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shipperPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipper Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter shipper phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="shipperAddress"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Shipper Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter shipper address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Consignee Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">CONSIGNEE INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="consigneeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consignee Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter consignee name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="consigneePhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consignee Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter consignee phone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="consigneeAddress"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Consignee Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter consignee address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Detailed Claim Statement */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">DETAILED STATEMENT</h2>
          <FormField
            control={form.control}
            name="detailedStatement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed description of claim:</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter a detailed description of your claim including all relevant information" 
                    className="h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Supporting Documents */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">SUPPORTING DOCUMENTS</h2>
          <p className="mb-4 text-sm text-gray-600">The following documents are required to process your claim. Please check which ones are attached:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="originalBillOfLading"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Original Bill of Lading
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="originalFreightBill"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Original Freight Bill
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="originalInvoice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Original Invoice
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-4 p-4 border rounded-md bg-blue-50">
            <p className="text-sm">
              <span className="font-bold">Upload Documents: </span>
              Use the document upload feature to attach digital copies of supporting documents.
            </p>
          </div>
        </div>
        
        {/* Merchandise Repairable Section - show only for damage claims */}
        {claimTypeValue === "Damage" && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-green-800">DAMAGED MERCHANDISE</h2>
            
            <FormField
              control={form.control}
              name="merchandiseRepairable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Is the merchandise repairable?</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setIsRepairable(value === "Yes");
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isRepairable && (
              <FormField
                control={form.control}
                name="repairCost"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Repair Cost ($)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter repair cost" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
        
        {/* Claimant Information */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">CLAIMANT INFORMATION</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Company Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter company address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Signature */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-green-800">VERIFICATION</h2>
          <p className="mb-4 text-sm text-gray-600">I certify that the above statements are true and correct.</p>
          
          <FormField
            control={form.control}
            name="signature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Signature (Type your full name)</FormLabel>
                <FormControl>
                  <Input placeholder="Type your full name as signature" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Submit and Cancel Buttons */}
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Processing...</span>
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-white" />
              </>
            ) : 'Submit Claim'}
          </Button>
        </div>
      </form>
    </Form>
  );
}