import { Task } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { useQuery } from "@tanstack/react-query";

interface PendingTasksProps {
  tasks: Task[];
  onCreateTask: () => void;
}

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

export function PendingTasks({ tasks, onCreateTask }: PendingTasksProps) {
  // Load claims to associate with tasks
  const { data: claims } = useQuery({
    queryKey: ['/api/claims'],
  });
  
  // Map claim ID to claim details
  const claimsMap = new Map();
  if (claims) {
    claims.forEach((claim: any) => {
      claimsMap.set(claim.id, claim);
    });
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-800">Pending Tasks</h3>
        <a href="#viewall" className="text-primary text-sm hover:underline">View all</a>
      </div>
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">
            No pending tasks
          </div>
        ) : (
          tasks.map((task) => {
            const dueInfo = getTaskDueText(new Date(task.dueDate));
            const typeInfo = getTaskTypeInfo(task.title);
            const claim = claimsMap.get(task.claimId);
            
            return (
              <div key={task.id} className="flex items-start gap-3 p-3 rounded-md hover:bg-neutral-50 border border-neutral-200">
                <div className={`h-8 w-8 rounded-full ${typeInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <span className="material-icons text-sm">{typeInfo.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-neutral-800 truncate">{task.title}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-neutral-500">
                      {claim ? `Claim #${claim.claimNumber} • ${claim.customerName}` : `Task #${task.id}`}
                    </p>
                    <span className={`text-xs font-medium ${dueInfo.className}`}>{dueInfo.text}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <button 
          onClick={onCreateTask}
          className="w-full mt-2 py-2 text-sm font-medium text-white bg-[hsl(155,45%,35%)] hover:bg-[hsl(155,45%,30%)] rounded-md flex items-center justify-center gap-1"
        >
          <span className="material-icons text-sm">add</span>
          Create New Task
        </button>
      </div>
    </div>
  );
}
