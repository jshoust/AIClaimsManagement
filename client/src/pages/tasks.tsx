import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Task, Claim } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";

// Icons mapping for task types
const taskTypeIcons: Record<string, { icon: string, bgColor: string }> = {
  email: { icon: 'email', bgColor: 'bg-blue-100 text-blue-600' },
  document: { icon: 'folder', bgColor: 'bg-emerald-100 text-emerald-600' },
  legal: { icon: 'gavel', bgColor: 'bg-indigo-100 text-indigo-600' },
  follow_up: { icon: 'assignment', bgColor: 'bg-amber-100 text-amber-600' },
  default: { icon: 'task', bgColor: 'bg-gray-100 text-gray-600' },
};

function getTaskDueText(dueDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const taskDate = new Date(dueDate);
  taskDate.setHours(0, 0, 0, 0);
  
  const diffTime = taskDate.getTime() - today.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0) return { text: 'Overdue', className: 'text-red-600' };
  if (diffDays === 0) return { text: 'Due today', className: 'text-red-600' };
  if (diffDays === 1) return { text: 'Due tomorrow', className: 'text-amber-600' };
  return { text: `Due in ${diffDays} days`, className: 'text-neutral-500' };
}

function getTaskTypeInfo(title: string) {
  if (title.toLowerCase().includes('email')) return taskTypeIcons.email;
  if (title.toLowerCase().includes('document') || title.toLowerCase().includes('compile')) return taskTypeIcons.document;
  if (title.toLowerCase().includes('law') || title.toLowerCase().includes('legal')) return taskTypeIcons.legal;
  if (title.toLowerCase().includes('follow')) return taskTypeIcons.follow_up;
  return taskTypeIcons.default;
}

export default function Tasks() {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch tasks data
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
  });
  
  // Fetch claims to associate with tasks
  const { data: claims = [] } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Map claim ID to claim details
  const claimsMap = new Map();
  if (claims && Array.isArray(claims)) {
    claims.forEach((claim: any) => {
      claimsMap.set(claim.id, claim);
    });
  }
  
  // Get pending tasks sorted by due date
  const pendingTasks = tasks
    ? tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    : [];
    
  // Get completed tasks sorted by due date (most recent first)
  const completedTasks = tasks
    ? tasks
        .filter(task => task.status === 'completed')
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
        .slice(0, 5) // Only show the 5 most recent completed tasks
    : [];
  
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus}.`
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Tasks</h2>
          <div className="flex gap-3">
            <Button 
              onClick={() => setIsCreateTaskModalOpen(true)}
              className="flex items-center gap-1 bg-[hsl(155,45%,35%)] hover:bg-[hsl(155,45%,30%)]"
            >
              <span className="material-icons text-sm">add</span>
              New Task
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-1"
              onClick={() => {
                queryClient.refetchQueries({ queryKey: ['/api/tasks'] });
                toast({
                  title: "Tasks Refreshed",
                  description: "Task list has been refreshed."
                });
              }}
            >
              <span className="material-icons text-sm">refresh</span>
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Pending Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-800">Pending Tasks</h3>
          </div>
          <div className="p-4">
            {isLoadingTasks ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin h-8 w-8 border-4 border-[hsl(155,45%,35%)] border-t-transparent rounded-full"></div>
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No pending tasks
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.map((task) => {
                  const dueInfo = getTaskDueText(new Date(task.dueDate));
                  const typeInfo = getTaskTypeInfo(task.title);
                  const claim = claimsMap.get(task.claimId);
                  
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-50 border border-neutral-200">
                      <div className={`h-8 w-8 rounded-full ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="material-icons text-sm">{typeInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-neutral-800">{task.title}</h4>
                        <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap justify-between items-center mt-2">
                          <p className="text-xs text-neutral-500">
                            {claim ? (
                              <>Claim #{claim.claimNumber} • {claim.customerName}</>
                            ) : (
                              <>Task #{task.id}</>
                            )}
                          </p>
                          <span className={`text-xs font-medium ${dueInfo.className}`}>{dueInfo.text}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-neutral-500">
                            {task.assignedTo ? `Assigned to: ${task.assignedTo}` : 'Unassigned'}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Recently Completed Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-medium text-neutral-800">Recently Completed Tasks</h3>
          </div>
          <div className="p-4">
            {isLoadingTasks ? (
              <div className="flex justify-center items-center h-20">
                <div className="animate-spin h-6 w-6 border-4 border-neutral-300 border-t-transparent rounded-full"></div>
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">
                No completed tasks
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => {
                  const typeInfo = getTaskTypeInfo(task.title);
                  const claim = claimsMap.get(task.claimId);
                  
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-3 rounded-md bg-neutral-50 border border-neutral-200">
                      <div className={`h-6 w-6 rounded-full ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="material-icons text-xs">{typeInfo.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <h4 className="text-sm font-medium text-neutral-600 line-through">{task.title}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 text-xs p-0"
                            onClick={() => handleStatusChange(task.id, 'pending')}
                          >
                            Reopen
                          </Button>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-neutral-500">
                            {claim ? `Claim #${claim.claimNumber}` : `Task #${task.id}`}
                          </p>
                          <span className="text-xs text-neutral-500">
                            Completed: {formatDate(new Date(task.updatedAt || task.createdAt))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        initialClaimId={null}
      />
    </div>
  );
}