import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const createClaimSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  orderNumber: z.string().min(1, "Order number is required"),
  claimAmount: z.string().min(1, "Claim amount is required"),
  claimType: z.string().min(1, "Claim type is required"),
  assignedTo: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters")
});

type CreateClaimFormValues = z.infer<typeof createClaimSchema>;

export function CreateClaimModal({ isOpen, onClose }: CreateClaimModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateClaimFormValues>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: {
      customerName: "",
      contactPerson: "",
      email: "",
      phone: "",
      orderNumber: "",
      claimAmount: "",
      claimType: "",
      assignedTo: "",
      description: ""
    }
  });
  
  const onSubmit = async (data: CreateClaimFormValues) => {
    try {
      await apiRequest('POST', '/api/claims', data);
      
      toast({
        title: "Claim Created",
        description: "The new claim has been created successfully",
      });
      
      // Reset form
      form.reset();
      
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
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Create New Claim</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
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
                      <Input placeholder="Enter contact person" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter order number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="claimAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter claim amount" {...field} />
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
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select claim type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                        <SelectItem value="Lost Shipment">Lost Shipment</SelectItem>
                        <SelectItem value="Shortage">Shortage</SelectItem>
                        <SelectItem value="Delivery Delay">Delivery Delay</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Select team member</SelectItem>
                        <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                        <SelectItem value="Mike Thompson">Mike Thompson</SelectItem>
                        <SelectItem value="Jessica Williams">Jessica Williams</SelectItem>
                        <SelectItem value="David Brown">David Brown</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claim Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4} 
                      placeholder="Enter detailed description of the claim"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <Label>Upload Documents</Label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <span className="material-icons text-neutral-400 text-3xl">cloud_upload</span>
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Create Claim</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
