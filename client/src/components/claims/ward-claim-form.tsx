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
        <div className="bg-white p-4 rounded-t-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex-shrink-0">
              <img 
                src="/images/ward-claim-form.png" 
                alt="Ward Trucking Logo" 
                className="w-64 object-contain" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parentDiv = e.currentTarget.parentElement;
                  if (parentDiv) {
                    const textElement = document.createElement('div');
                    textElement.className = "text-green-800 font-bold text-2xl";
                    textElement.innerText = "WARD TRUCKING";
                    parentDiv.appendChild(textElement);
                  }
                }}
              />
            </div>
            <div className="font-bold text-sm text-gray-700">
              <div>P.O Box 1553</div>
              <div>Altoona, PA 16603-1553</div>
              <div>814-944-0803 FAX 814-944-2369</div>
            </div>
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
        
        {/* Claim Amount and Type Section */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="mb-4">
            <p className="text-sm font-medium">This claim for $
              <FormField
                control={form.control}
                name="claimAmount"
                render={({ field }) => (
                  <span className="inline-block">
                    <FormControl>
                      <Input 
                        placeholder="Amount" 
                        className="w-32 inline mx-2" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="block text-xs mt-1" />
                  </span>
                )}
              />
              is made against Ward in connection with the following described shipment:
            </p>
          </div>
          
          <div className="flex items-center gap-4 ml-8 mb-2">
            <FormField
              control={form.control}
              name="claimType"
              render={({ field }) => (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value === "Shortage"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange("Shortage");
                          setClaimTypeValue("Shortage");
                        }
                      }}
                      id="shortage-checkbox"
                    />
                    <label
                      htmlFor="shortage-checkbox"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      shortage
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={field.value === "Damage"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange("Damage");
                          setClaimTypeValue("Damage");
                        }
                      }}
                      id="damage-checkbox"
                    />
                    <label
                      htmlFor="damage-checkbox"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      damage
                    </label>
                  </div>
                </div>
              )}
            />
          </div>
          <FormMessage className="ml-8 text-xs" />
        </div>
        
        {/* Shipper and Consignee Information - Side by Side */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shipper Information */}
            <div>
              <h2 className="font-bold mb-4 text-gray-800 text-sm underline">Shipper:</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="shipperName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Name:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter shipper name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shipperAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Address:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter shipper address" 
                          className="resize-none min-h-[80px]"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm">Phone:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter shipper phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Consignee Information */}
            <div>
              <h2 className="font-bold mb-4 text-gray-800 text-sm underline">Consignee:</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="consigneeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Name:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter consignee name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="consigneeAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Address:</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter consignee address" 
                          className="resize-none min-h-[80px]"
                          {...field} 
                        />
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
                      <FormLabel className="text-sm">Phone:</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter consignee phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Detailed Claim Statement */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h2 className="text-center font-bold mb-1 text-gray-800 text-sm">Detailed Statement Showing How Amount Claimed Was Determined</h2>
          <p className="text-xs text-gray-600 mb-4 italic">
            (Number and description of articles, nature and extent of shortage or damage, invoice price of articles, amount of claim, etc. All discount and allowances must be shown. Use an additional sheet as needed.)
          </p>
          
          <FormField
            control={form.control}
            name="detailedStatement"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="border border-gray-300 rounded-md">
                    <div className="grid grid-cols-5 border-b">
                      <div className="col-span-4 border-r py-2 px-4 bg-gray-100">
                        <span className="text-sm font-medium">Item Details</span>
                      </div>
                      <div className="col-span-1 py-2 px-4 bg-gray-100">
                        <span className="text-sm font-medium">Amount</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 border-b">
                      <div className="col-span-4 border-r p-2">
                        <Textarea 
                          placeholder="Enter article details and description" 
                          className="border-0 focus-visible:ring-0 resize-none min-h-[120px]"
                          {...field}
                        />
                      </div>
                      <div className="col-span-1 p-2">
                        <Input 
                          type="text"
                          className="h-full border-0 focus-visible:ring-0"
                          placeholder="$0.00"
                          value={form.watch('claimAmount')} 
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-5 border-b">
                      <div className="col-span-4 border-r p-2 text-right">
                        <span className="font-bold">Total Amount Claimed:</span>
                      </div>
                      <div className="col-span-1 p-2">
                        <Input 
                          type="text"
                          className="border-0 focus-visible:ring-0 font-bold"
                          value={form.watch('claimAmount') ? `$${form.watch('claimAmount')}` : '$0.00'} 
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Supporting Documents */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="mb-2 text-sm text-gray-800">The following documents are submitted in support of this claim:</p>
          
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="originalBillOfLading"
              render={({ field }) => (
                <div className="flex items-center">
                  <FormControl>
                    <Checkbox
                      id="bill-of-lading"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mr-2"
                    />
                  </FormControl>
                  <label htmlFor="bill-of-lading" className="text-sm cursor-pointer">
                    Original Bill of Lading *
                  </label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="originalFreightBill"
              render={({ field }) => (
                <div className="flex items-start">
                  <FormControl>
                    <Checkbox
                      id="freight-bill"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mr-2 mt-1"
                    />
                  </FormControl>
                  <label htmlFor="freight-bill" className="text-sm cursor-pointer">
                    Original paid freight bill or other carrier document bearing notation of shortage or damage
                    <br />
                    <span className="text-xs ml-4">if not shown on freight bill *</span>
                  </label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="originalInvoice"
              render={({ field }) => (
                <div className="flex items-center">
                  <FormControl>
                    <Checkbox
                      id="invoice"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mr-2"
                    />
                  </FormControl>
                  <label htmlFor="invoice" className="text-sm cursor-pointer">
                    Original invoice or certified copy as billed by seller *
                  </label>
                </div>
              )}
            />
            
            {claimTypeValue === "Damage" && (
              <div className="flex items-center pt-2">
                <span className="text-sm mr-2">Is merchandise repairable?</span>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="merchandiseRepairable"
                    render={({ field }) => (
                      <div className="flex items-center space-x-8">
                        <div className="flex items-center">
                          <FormControl>
                            <Checkbox
                              id="repairable-yes"
                              checked={field.value === "Yes"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange("Yes");
                                  setIsRepairable(true);
                                }
                              }}
                              className="mr-1"
                            />
                          </FormControl>
                          <label htmlFor="repairable-yes" className="text-sm cursor-pointer">
                            Yes
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <FormControl>
                            <Checkbox
                              id="repairable-no"
                              checked={field.value === "No"}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange("No");
                                  setIsRepairable(false);
                                }
                              }}
                              className="mr-1"
                            />
                          </FormControl>
                          <label htmlFor="repairable-no" className="text-sm cursor-pointer">
                            No
                          </label>
                        </div>
                        
                        {isRepairable && (
                          <div className="flex items-center">
                            <span className="text-sm">Estimated cost to repair</span>
                            <FormField
                              control={form.control}
                              name="repairCost"
                              render={({ field }) => (
                                <FormControl>
                                  <Input
                                    placeholder="$0.00"
                                    className="w-24 h-8 ml-2"
                                    {...field}
                                  />
                                </FormControl>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm italic">
            <p>Note: Please retain salvage until claim has been resolved.</p>
          </div>
          
          <div className="mt-4 p-4 border rounded-md bg-blue-50">
            <p className="text-sm">
              <span className="font-bold">Upload Documents: </span>
              Use the document upload feature to attach digital copies of supporting documents.
            </p>
          </div>
        </div>
        

        
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