import { Task, Claim } from "@shared/schema";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/format-date";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Icons mapping for task types
const taskTypeIcons: Record<string, { icon: string, bgColor: string }> = {
  email: { icon: 'email', bgColor: 'bg-blue-100 text-blue-600' },
  document: { icon: 'folder', bgColor: 'bg-emerald-100 text-emerald-600' },
  legal: { icon: 'gavel', bgColor: 'bg-indigo-100 text-indigo-600' },
  follow_up: { icon: 'assignment', bgColor: 'bg-amber-100 text-amber-600' },
  default: { icon: 'task', bgColor: 'bg-gray-100 text-gray-600' },
};

// Task status options
const taskStatusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

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
  return { text: `Due in ${Math.floor(diffDays)} days`, className: 'text-neutral-500' };
}

function getTaskTypeInfo(title: string) {
  if (title.toLowerCase().includes('email')) return taskTypeIcons.email;
  if (title.toLowerCase().includes('document') || title.toLowerCase().includes('compile')) return taskTypeIcons.document;
  if (title.toLowerCase().includes('law') || title.toLowerCase().includes('legal')) return taskTypeIcons.legal;
  if (title.toLowerCase().includes('follow')) return taskTypeIcons.follow_up;
  return taskTypeIcons.default;
}

export default function Tasks() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortField, setSortField] = useState('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Load claims to associate with tasks
  const { data: claims = [] } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Map claim ID to claim details
  const claimsMap = new Map();
  if (claims && Array.isArray(claims)) {
    claims.forEach((claim: Claim) => {
      claimsMap.set(claim.id, claim);
    });
  }

  // Handle task status change
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await apiRequest('PATCH', `/api/tasks/${taskId}`, { status: newStatus });
      
      // Invalidate tasks query to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating task",
        description: "There was an error updating the task status.",
        variant: "destructive",
      });
    }
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'pending' && task.status === 'pending') return true;
    if (filter === 'in_progress' && task.status === 'in_progress') return true;
    if (filter === 'completed' && task.status === 'completed') return true;
    if (filter === 'overdue') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status !== 'completed';
    }
    return false;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortField === 'dueDate') {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortField === 'title') {
      return sortDirection === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    }
    // Default sort - priority by due date
    return sortDirection === 'asc' 
      ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Tasks</h1>
        <p className="text-neutral-500">Manage and track all tasks in the system</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-6">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'all' ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-500 hover:bg-neutral-50'}`}
            >
              All Tasks
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'pending' ? 'bg-amber-100 text-amber-800' : 'text-neutral-500 hover:bg-neutral-50'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'text-neutral-500 hover:bg-neutral-50'}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'completed' ? 'bg-green-100 text-green-800' : 'text-neutral-500 hover:bg-neutral-50'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1 text-sm rounded-full ${filter === 'overdue' ? 'bg-red-100 text-red-800' : 'text-neutral-500 hover:bg-neutral-50'}`}
            >
              Overdue
            </button>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-[hsl(155,45%,35%)] hover:bg-[hsl(155,45%,30%)] rounded-md flex items-center gap-1"
          >
            <span className="material-icons text-sm">add</span>
            Create Task
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 text-xs uppercase">
              <tr>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('title')}
                >
                  <div className="flex items-center">
                    Task
                    {sortField === 'title' && (
                      <span className="material-icons text-xs ml-1">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Claim</th>
                <th className="px-4 py-3 text-left">Assigned To</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    Due Date
                    {sortField === 'dueDate' && (
                      <span className="material-icons text-xs ml-1">
                        {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {isLoadingTasks ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    Loading tasks...
                  </td>
                </tr>
              ) : sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No tasks found matching your filter criteria
                  </td>
                </tr>
              ) : (
                sortedTasks.map((task) => {
                  const typeInfo = getTaskTypeInfo(task.title);
                  const dueInfo = getTaskDueText(new Date(task.dueDate));
                  const claim = task.claimId ? claimsMap.get(task.claimId) : null;
                  const statusOption = taskStatusOptions.find(s => s.value === task.status);
                  
                  return (
                    <tr key={task.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <span className="material-icons text-sm">{typeInfo.icon}</span>
                          </div>
                          <div>
                            <div className="font-medium text-neutral-800">{task.title}</div>
                            <div className="text-xs text-neutral-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {claim ? (
                          <div>
                            <div className="font-medium">#{claim.claimNumber}</div>
                            <div className="text-xs text-neutral-500">{claim.customerName || 'Unknown Customer'}</div>
                          </div>
                        ) : (
                          <span className="text-neutral-400">No claim</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {task.assignedTo || <span className="text-neutral-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col">
                          <span>{formatDate(task.dueDate)}</span>
                          <span className={`text-xs ${dueInfo.className}`}>{dueInfo.text}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className="py-1 px-2 text-xs rounded border border-neutral-200 bg-white"
                        >
                          {taskStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                          title="View task details"
                        >
                          <span className="material-icons text-sm">more_horiz</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}