import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useTasks() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all tasks
  const getTasks = () => {
    return useQuery<Task[]>({
      queryKey: ['/api/tasks'],
    });
  };
  
  // Get tasks for a specific claim
  const getTasksByClaim = (claimId: number | null) => {
    return useQuery<Task[]>({
      queryKey: ['/api/claims', claimId, 'tasks'],
      enabled: !!claimId,
    });
  };
  
  // Get a single task by ID
  const getTaskById = (id: number | null) => {
    return useQuery<Task>({
      queryKey: ['/api/tasks', id],
      enabled: !!id,
    });
  };
  
  // Create a new task
  const createTask = () => {
    return useMutation({
      mutationFn: (newTask: InsertTask) => 
        apiRequest('POST', '/api/tasks', newTask),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        if (variables.claimId) {
          queryClient.invalidateQueries({ queryKey: ['/api/claims', variables.claimId, 'tasks'] });
        }
        toast({
          title: "Task Created",
          description: "The task has been created successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create task: " + (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };
  
  // Update an existing task
  const updateTask = () => {
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => 
        apiRequest('PATCH', `/api/tasks/${id}`, data),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tasks', variables.id] });
        
        // Invalidate claim tasks if we have task data with claimId
        const taskData = variables.data as Partial<Task>;
        if (taskData.claimId) {
          queryClient.invalidateQueries({ queryKey: ['/api/claims', taskData.claimId, 'tasks'] });
        }
        
        toast({
          title: "Task Updated",
          description: "The task has been updated successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to update task: " + (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };
  
  // Get pending tasks (status = 'pending')
  const getPendingTasks = () => {
    const { data: tasks, isLoading, error } = useQuery<Task[]>({
      queryKey: ['/api/tasks'],
    });
    
    const pendingTasks = tasks?.filter(task => task.status === 'pending') || [];
    
    // Sort by due date (ascending)
    pendingTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return {
      pendingTasks,
      isLoading,
      error
    };
  };
  
  return {
    getTasks,
    getTasksByClaim,
    getTaskById,
    createTask,
    updateTask,
    getPendingTasks
  };
}
