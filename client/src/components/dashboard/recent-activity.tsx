import { Activity } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { useQuery } from "@tanstack/react-query";

interface RecentActivityProps {
  activities: Activity[];
}

// Activity type configuration
const activityTypeConfig: Record<string, { icon: string, borderColor: string, color: string }> = {
  email: { 
    icon: 'email', 
    borderColor: 'border-blue-500', 
    color: 'text-blue-500' 
  },
  phone: { 
    icon: 'phone', 
    borderColor: 'border-cyan-500', 
    color: 'text-cyan-500' 
  },
  document: { 
    icon: 'description', 
    borderColor: 'border-green-500', 
    color: 'text-green-500' 
  },
  status_update: { 
    icon: 'update', 
    borderColor: 'border-amber-500', 
    color: 'text-amber-500' 
  },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  // Load claims to associate with activities
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
  
  const formatRelativeTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return 'Just now';
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return formatDate(date);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      <div className="flex justify-between items-center p-4 border-b border-neutral-200">
        <h3 className="font-medium text-neutral-800">Recent Activity</h3>
        <div className="flex gap-2">
          <select className="text-sm border border-neutral-300 rounded px-2 py-1 bg-white">
            <option>All Types</option>
            <option>Emails</option>
            <option>Phone Calls</option>
            <option>Documents</option>
            <option>Status Changes</option>
          </select>
          <a href="/activities" className="text-primary text-sm hover:underline ml-2 flex items-center">View all</a>
        </div>
      </div>
      <div className="p-4">
        <div className="relative">
          {/* Activity Timeline */}
          <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-neutral-200"></div>
          
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center py-4 text-neutral-500 relative pl-10">
                No recent activity
              </div>
            ) : (
              activities.map((activity) => {
                const typeConfig = activityTypeConfig[activity.type] || {
                  icon: 'info',
                  borderColor: 'border-gray-500',
                  color: 'text-gray-500'
                };
                
                const claim = claimsMap.get(activity.claimId);
                const claimInfo = claim ? `#${claim.claimNumber}` : '';
                
                return (
                  <div key={activity.id} className="relative pl-10">
                    <div className={`absolute left-0 p-1 bg-white rounded-full border-2 ${typeConfig.borderColor}`}>
                      <span className={`material-icons ${typeConfig.color} text-sm`}>{typeConfig.icon}</span>
                    </div>
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-neutral-800">{activity.description}</h4>
                      <span className="text-xs text-neutral-500">{formatRelativeTime(activity.timestamp)}</span>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {activity.metadata?.details || 
                       `Activity on claim ${claimInfo} by ${activity.createdBy}`}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {activity.type === 'email' && (
                        <button className="text-xs text-primary hover:underline">View Email</button>
                      )}
                      {activity.type === 'document' && (
                        <button className="text-xs text-primary hover:underline">View Document</button>
                      )}
                      {activity.type === 'phone' && (
                        <button className="text-xs text-primary hover:underline">View Notes</button>
                      )}
                      <button className="text-xs text-primary hover:underline">Add Note</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
