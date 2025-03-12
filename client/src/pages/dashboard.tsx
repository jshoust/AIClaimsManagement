import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { RecentClaims } from "@/components/dashboard/recent-claims";
import { PendingTasks } from "@/components/dashboard/pending-tasks";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CreateClaimModal } from "@/components/claims/create-claim-modal";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import DetailPanel from "@/components/layout/detail-panel";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Claim, Task, Activity } from "@shared/schema";

interface DashboardProps {
  onSelectClaim: (claimId: number) => void;
  selectedClaimId: number | null;
}

export default function Dashboard({ onSelectClaim, selectedClaimId }: DashboardProps) {
  const [isCreateClaimModalOpen, setIsCreateClaimModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  
  // Fetch claims data
  const { data: claims, isLoading: isLoadingClaims } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Fetch tasks data
  const { data: tasks, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    refetchInterval: 5000, // Refresh tasks every 5 seconds to ensure updates
  });
  
  // Fetch activities data
  const { data: activities, isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });
  
  // Calculate summary statistics
  const summaryStats = {
    totalClaims: claims?.length || 0,
    pendingAction: claims?.filter(c => c.status === 'follow_up').length || 0,
    missingInfo: claims?.filter(c => c.status === 'missing_info').length || 0,
    completed: claims?.filter(c => c.status === 'completed').length || 0,
  };
  
  // Get pending tasks sorted by due date
  const pendingTasks = tasks
    ? tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4)
    : [];
  
  // Get recent activities sorted by timestamp
  const recentActivities = activities
    ? activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 4)
    : [];
  
  // Get recent claims
  const recentClaims = claims
    ? [...claims].sort((a, b) => new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()).slice(0, 5)
    : [];
  
  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium text-neutral-800">Dashboard</h2>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateClaimModalOpen(true)}
                className="flex items-center gap-1 bg-[hsl(155,45%,35%)] hover:bg-[hsl(155,45%,30%)]"
              >
                <span className="material-icons text-sm">add</span>
                New Claim
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-1"
                onClick={() => {
                  // Refresh all data using React Query's refetch instead of full page reload
                  queryClient.refetchQueries({ queryKey: ['/api/claims'] });
                  queryClient.refetchQueries({ queryKey: ['/api/tasks'] });
                  queryClient.refetchQueries({ queryKey: ['/api/activities'] });
                  
                  toast({
                    title: "Data Refreshed",
                    description: "All data has been refreshed from the server."
                  });
                }}
              >
                <span className="material-icons text-sm">refresh</span>
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Claims"
              value={summaryStats.totalClaims}
              icon={<span className="material-icons text-[hsl(155,45%,35%)]">description</span>}
              change={{ value: "3.2%", isPositive: true }}
              iconColor="bg-[hsl(155,45%,95%)]"
            />
            
            <SummaryCard
              title="Pending Action"
              value={summaryStats.pendingAction}
              icon={<span className="material-icons text-amber-600">pending_actions</span>}
              change={{ value: "12.5%", isPositive: false }}
              iconColor="bg-amber-100"
            />
            
            <SummaryCard
              title="Missing Info"
              value={summaryStats.missingInfo}
              icon={<span className="material-icons text-red-600">info</span>}
              change={{ value: "4.8%", isPositive: true }}
              iconColor="bg-red-100"
            />
            
            <SummaryCard
              title="Completed"
              value={summaryStats.completed}
              icon={<span className="material-icons text-green-600">check_circle</span>}
              change={{ value: "7.3%", isPositive: true }}
              iconColor="bg-green-100"
            />
          </div>

          {/* Recent Claims & Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <RecentClaims 
                claims={recentClaims}
                onSelectClaim={onSelectClaim}
              />
            </div>
            
            <div>
              <PendingTasks 
                tasks={pendingTasks}
                onCreateTask={() => setIsCreateTaskModalOpen(true)}
              />
            </div>
          </div>
          
          {/* Recent Activity */}
          <RecentActivity activities={recentActivities} />
        </div>
        
        {/* Create Claim Modal */}
        <CreateClaimModal 
          isOpen={isCreateClaimModalOpen}
          onClose={() => setIsCreateClaimModalOpen(false)}
        />
        
        {/* Create Task Modal */}
        <CreateTaskModal 
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          initialClaimId={selectedClaimId}
        />
      </main>
      
      {/* Detail Panel */}
      <DetailPanel 
        selectedClaimId={selectedClaimId}
        onClose={() => onSelectClaim(0)}
      />
    </div>
  );
}
