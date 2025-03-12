import { Claim } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import { StatusBadge } from "@/components/ui/status-badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EditClaimForm from "./edit-claim-form";
import { apiRequest } from "@/lib/queryClient";
import DocumentPreview from "../documents/document-preview";
import DocumentUpload from "../documents/document-upload";

interface ClaimDetailsProps {
  claimId: number;
  onClose: () => void;
}

export default function ClaimDetails({ claimId, onClose }: ClaimDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("details");
  
  // Fetch claim details
  const { data: claim, isLoading: isLoadingClaim } = useQuery({
    queryKey: ['/api/claims', claimId],
    enabled: !!claimId,
  });
  
  // Fetch associated documents
  const { data: documents = [], isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/claims', claimId, 'documents'],
    queryFn: async () => {
      const res = await fetch(`/api/claims/${claimId}/documents`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
    enabled: !!claimId,
  });
  
  // Fetch activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/claims', claimId, 'activities'],
    queryFn: async () => {
      const res = await fetch(`/api/claims/${claimId}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
    enabled: !!claimId,
  });
  
  // Fetch tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['/api/claims', claimId, 'tasks'],
    queryFn: async () => {
      const res = await fetch(`/api/claims/${claimId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    enabled: !!claimId,
  });
  
  // Function to send follow-up email
  const sendFollowUpEmail = async () => {
    if (!claim) return;
    
    try {
      // Format missing information as bullet points
      const missingItems = (claim.missingInformation as string[])
        .map(item => `• ${item}`)
        .join('\n');
      
      // Replace placeholders in email template
      const emailBody = 
        `Dear ${claim.contactPerson},\n\n` +
        `We are processing your claim #${claim.claimNumber} but need additional information to proceed. Please provide the following:\n\n` +
        `${missingItems}\n\n` +
        `Thank you,\nWard TLC Claims Department`;
      
      await apiRequest('POST', '/api/send-email', {
        to: claim.email,
        subject: `Missing Information for Claim #${claim.claimNumber}`,
        body: emailBody,
        claimId: claim.id
      });
      
      toast({
        title: "Email Sent",
        description: `Follow-up email sent to ${claim.contactPerson}`,
      });
      
      // Create activity log for email
      await apiRequest('POST', '/api/activities', {
        claimId: claim.id,
        type: 'email',
        description: `Follow-up email sent to ${claim.contactPerson}`,
        createdBy: 'John Doe',
      });
      
      // Invalidate activities cache to show the new email activity
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/claims', claim.id, 'activities'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send follow-up email",
        variant: "destructive"
      });
    }
  };
  
  if (isLoadingClaim) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <span className="material-icons text-neutral-400 text-3xl">error</span>
        </div>
        <h3 className="text-lg font-medium text-neutral-700">Claim not found</h3>
        <p className="text-neutral-500 mt-2">The claim you're looking for doesn't exist or was deleted.</p>
        <Button onClick={onClose} className="mt-6">Back to Claims</Button>
      </div>
    );
  }
  
  // Get file icon based on type
  const getFileIcon = (fileType: string) => {
    if (fileType === 'pdf') return 'picture_as_pdf';
    if (fileType === 'docx' || fileType === 'doc') return 'description';
    if (fileType === 'xlsx' || fileType === 'xls') return 'table_chart';
    if (fileType.includes('image')) return 'image';
    return 'insert_drive_file';
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return 'email';
      case 'phone': return 'phone';
      case 'note': return 'note';
      case 'status_change': return 'update';
      case 'document': return 'description';
      default: return 'event_note';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium text-neutral-800">Claim #{claim.claimNumber}</h2>
          <p className="text-sm text-neutral-500">Submitted on {formatDate(claim.dateSubmitted)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={claim.status as any} />
          <Button 
            variant="outline" 
            onClick={onClose}
            className="h-8 px-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="activities" className="flex-1">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1">Tasks ({tasks.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="pt-6">
          <EditClaimForm claim={claim} onClose={() => setActiveTab("documents")} />
        </TabsContent>
        
        <TabsContent value="documents" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                <Button size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-sm">upload_file</span>
                  Add Document
                </Button>
              </div>
              <CardDescription>Documents associated with this claim</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No documents found for this claim
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="border rounded-md p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-md bg-primary bg-opacity-10 flex items-center justify-center flex-shrink-0">
                          <span className="material-icons text-primary">{getFileIcon(doc.fileType)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-neutral-800 truncate">{doc.fileName}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-neutral-500">{doc.fileType.toUpperCase()}</span>
                            <span className="text-xs text-neutral-500">{formatDate(doc.uploadedAt)}</span>
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                              <span className="material-icons text-xs mr-1">visibility</span>
                              View
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                              <span className="material-icons text-xs mr-1">download</span>
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Activities</CardTitle>
                <Button size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-sm">add</span>
                  Add Note
                </Button>
              </div>
              <CardDescription>Activity history for this claim</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No activities found for this claim
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity: any) => (
                    <div key={activity.id} className="flex gap-4 p-3 border-b last:border-0">
                      <div className="h-10 w-10 rounded-full bg-primary bg-opacity-10 flex items-center justify-center">
                        <span className="material-icons text-primary">{getActivityIcon(activity.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-medium text-neutral-800">{activity.description}</h4>
                          <span className="text-xs text-neutral-500">{formatDate(activity.timestamp)}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">By {activity.createdBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Tasks</CardTitle>
                <Button size="sm" className="flex items-center gap-1">
                  <span className="material-icons text-sm">add_task</span>
                  Add Task
                </Button>
              </div>
              <CardDescription>Tasks associated with this claim</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  No tasks found for this claim
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full ${
                            task.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'
                          } flex items-center justify-center text-white`}>
                            <span className="material-icons text-xs">
                              {task.status === 'completed' ? 'check' : 'schedule'}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-neutral-800">{task.title}</h4>
                            <p className="text-xs text-neutral-500 mt-1">Due: {formatDate(task.dueDate)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs"
                          disabled={task.status === 'completed'}
                        >
                          {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                        </Button>
                      </div>
                      {task.description && (
                        <p className="text-sm text-neutral-600 mt-2 pl-8">{task.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {claim.missingInformation && (claim.missingInformation as string[]).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm flex items-center">
              <span className="material-icons text-sm mr-1">warning</span>
              Missing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-orange-700 mb-2">
              This claim is missing {(claim.missingInformation as string[]).length} required fields.
            </p>
            <ul className="space-y-1">
              {(claim.missingInformation as string[]).map((item, index) => (
                <li key={index} className="text-sm text-orange-700 flex items-start">
                  <span className="material-icons text-orange-500 mr-2 text-sm">error</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Button onClick={sendFollowUpEmail} className="w-full">
                <span className="material-icons mr-1 text-sm">email</span>
                Send Follow-up Email
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}