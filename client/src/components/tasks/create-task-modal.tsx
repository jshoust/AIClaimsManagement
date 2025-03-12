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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClaimId?: number | null;
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  claimId: z.number().nullable(),
  assignedTo: z.string().nullable(),
  status: z.string().default("pending")
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

export function CreateTaskModal({ isOpen, onClose, initialClaimId = null }: CreateTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch claims for the dropdown
  const { data: claims = [] } = useQuery<any[]>({
    queryKey: ['/api/claims'],
  });
  
  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default due date: 1 week from now
      claimId: initialClaimId,
      assignedTo: null,
      status: "pending"
    }
  });
  
  const onSubmit = async (data: CreateTaskFormValues) => {
    try {
      await apiRequest('POST', '/api/tasks', data);
      
      toast({
        title: "Task Created",
        description: "The new task has been created successfully",
      });
      
      // Reset form
      form.reset();
      
      // Close modal
      onClose();
      
      // Invalidate tasks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // If the task is associated with a claim, invalidate the claim's tasks as well
      if (data.claimId) {
        queryClient.invalidateQueries({ queryKey: ['/api/claims', data.claimId, 'tasks'] });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Create New Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      placeholder="Enter task description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                      onValueChange={(value) => {
                        // If "unassigned" was selected, set to null, otherwise use the value
                        field.onChange(value === "unassigned" ? null : value);
                      }} 
                      value={field.value || "unassigned"} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
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
              name="claimId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Claim</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      // If "none" was selected, set to null, otherwise convert to number
                      field.onChange(value === "none" ? null : Number(value));
                    }} 
                    value={field.value?.toString() || "none"} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a claim" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No associated claim</SelectItem>
                      {claims.map((claim: any) => (
                        <SelectItem key={claim.id} value={claim.id.toString()}>
                          {claim.claimNumber} - {claim.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                type="submit" 
                className="bg-[hsl(155,45%,35%)] hover:bg-[hsl(155,45%,30%)]"
              >
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}