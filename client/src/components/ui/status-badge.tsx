import { cn } from "@/lib/utils";

type StatusType = 'new' | 'missing_info' | 'in_review' | 'follow_up' | 'completed';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  new: {
    label: 'New',
    className: 'bg-blue-100 text-blue-800'
  },
  missing_info: {
    label: 'Missing Info',
    className: 'bg-amber-100 text-amber-800'
  },
  in_review: {
    label: 'In Review',
    className: 'bg-cyan-100 text-cyan-800'
  },
  follow_up: {
    label: 'Follow-up Required',
    className: 'bg-red-100 text-red-800'
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800'
  }
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
