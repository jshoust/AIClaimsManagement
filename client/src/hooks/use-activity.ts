import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, InsertActivity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useActivity() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get all activities
  const getActivities = () => {
    return useQuery<Activity[]>({
      queryKey: ['/api/activities'],
    });
  };
  
  // Get activities for a specific claim
  const getActivitiesByClaim = (claimId: number | null) => {
    return useQuery<Activity[]>({
      queryKey: ['/api/claims', claimId, 'activities'],
      enabled: !!claimId,
    });
  };
  
  // Create a new activity
  const createActivity = () => {
    return useMutation({
      mutationFn: (newActivity: InsertActivity) => 
        apiRequest('POST', '/api/activities', newActivity),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        if (variables.claimId) {
          queryClient.invalidateQueries({ queryKey: ['/api/claims', variables.claimId, 'activities'] });
        }
        toast({
          title: "Activity Logged",
          description: "The activity has been recorded successfully",
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to record activity: " + (error as Error).message,
          variant: "destructive",
        });
      }
    });
  };
  
  // Get recent activities
  const getRecentActivities = (limit: number = 5) => {
    const { data: activities, isLoading, error } = useQuery<Activity[]>({
      queryKey: ['/api/activities'],
    });
    
    // Sort by timestamp (descending) and limit
    const recentActivities = activities
      ? [...activities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit)
      : [];
    
    return {
      recentActivities,
      isLoading,
      error
    };
  };
  
  // Get activity distribution by type
  const getActivityDistribution = () => {
    const { data: activities, isLoading, error } = useQuery<Activity[]>({
      queryKey: ['/api/activities'],
    });
    
    const distribution = {
      email: 0,
      phone: 0,
      document: 0,
      status_update: 0,
      other: 0
    };
    
    if (activities) {
      activities.forEach(activity => {
        if (distribution.hasOwnProperty(activity.type)) {
          distribution[activity.type as keyof typeof distribution]++;
        } else {
          distribution.other++;
        }
      });
    }
    
    return {
      distribution,
      isLoading,
      error
    };
  };
  
  return {
    getActivities,
    getActivitiesByClaim,
    createActivity,
    getRecentActivities,
    getActivityDistribution
  };
}
