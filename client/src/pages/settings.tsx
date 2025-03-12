import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  
  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Settings</h2>
        </div>
        
        <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 md:grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center">
                  <div className="md:w-24 flex flex-col items-center">
                    <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center text-white font-medium text-xl">
                      JD
                    </div>
                    <Button variant="link" className="mt-2 text-xs">Change</Button>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" defaultValue="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue="johndoe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue="Claims Administrator" disabled />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Update your password to maintain account security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="md:col-span-2 h-0 md:h-auto"></div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveSettings}>Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and feels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Theme</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border rounded-md p-2 flex flex-col items-center space-y-2 cursor-pointer bg-primary bg-opacity-10 border-primary">
                        <div className="w-full h-20 bg-white rounded-md border"></div>
                        <span className="text-xs font-medium">Light</span>
                      </div>
                      <div className="border rounded-md p-2 flex flex-col items-center space-y-2 cursor-pointer">
                        <div className="w-full h-20 bg-neutral-800 rounded-md border"></div>
                        <span className="text-xs font-medium">Dark</span>
                      </div>
                      <div className="border rounded-md p-2 flex flex-col items-center space-y-2 cursor-pointer">
                        <div className="w-full h-20 bg-gradient-to-b from-white to-neutral-800 rounded-md border"></div>
                        <span className="text-xs font-medium">System</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Primary Color</h3>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-600 cursor-pointer ring-2 ring-offset-2 ring-blue-600"></div>
                      <div className="h-8 w-8 rounded-full bg-green-600 cursor-pointer"></div>
                      <div className="h-8 w-8 rounded-full bg-red-600 cursor-pointer"></div>
                      <div className="h-8 w-8 rounded-full bg-purple-600 cursor-pointer"></div>
                      <div className="h-8 w-8 rounded-full bg-amber-600 cursor-pointer"></div>
                      <div className="h-8 w-8 rounded-full bg-cyan-600 cursor-pointer"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Font Size</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-xs">A</span>
                      <input 
                        type="range" 
                        min="1" 
                        max="3" 
                        defaultValue="2" 
                        className="flex-1" 
                      />
                      <span className="text-lg">A</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="densityToggle">Compact Mode</Label>
                      <p className="text-sm text-neutral-500">Reduce spacing in tables and UI</p>
                    </div>
                    <Switch id="densityToggle" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Appearance</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you want to receive notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailNewClaims">New Claims</Label>
                          <p className="text-sm text-neutral-500">Receive email when new claims are submitted</p>
                        </div>
                        <Switch id="emailNewClaims" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailStatusUpdates">Status Updates</Label>
                          <p className="text-sm text-neutral-500">Receive email when claim status changes</p>
                        </div>
                        <Switch id="emailStatusUpdates" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailTaskReminders">Task Reminders</Label>
                          <p className="text-sm text-neutral-500">Receive email for upcoming task due dates</p>
                        </div>
                        <Switch id="emailTaskReminders" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="emailWeeklyDigest">Weekly Digest</Label>
                          <p className="text-sm text-neutral-500">Receive weekly summary of claims activity</p>
                        </div>
                        <Switch id="emailWeeklyDigest" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-4">In-App Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="appNewClaims">New Claims</Label>
                          <p className="text-sm text-neutral-500">Show notification when new claims are submitted</p>
                        </div>
                        <Switch id="appNewClaims" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="appStatusUpdates">Status Updates</Label>
                          <p className="text-sm text-neutral-500">Show notification when claim status changes</p>
                        </div>
                        <Switch id="appStatusUpdates" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="appTaskReminders">Task Reminders</Label>
                          <p className="text-sm text-neutral-500">Show notification for upcoming task due dates</p>
                        </div>
                        <Switch id="appTaskReminders" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="appDueDateAlerts">Due Date Alerts</Label>
                          <p className="text-sm text-neutral-500">Show alerts for overdue tasks</p>
                        </div>
                        <Switch id="appDueDateAlerts" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end">
                  <Button onClick={handleSaveSettings}>Save Notification Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide preferences and defaults.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Default Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="defaultAssignee">Default Assignee</Label>
                      <select id="defaultAssignee" className="w-full border border-neutral-300 rounded-md px-3 py-2">
                        <option value="">Select an assignee</option>
                        <option value="sarah">Sarah Johnson</option>
                        <option value="mike">Mike Thompson</option>
                        <option value="jessica">Jessica Williams</option>
                        <option value="david">David Brown</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultPriority">Default Priority</Label>
                      <select id="defaultPriority" className="w-full border border-neutral-300 rounded-md px-3 py-2">
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-4">Automation Rules</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoAssign">Auto-Assign Claims</Label>
                        <p className="text-sm text-neutral-500">Automatically assign new claims based on workload</p>
                      </div>
                      <Switch id="autoAssign" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoReminders">Auto-Generate Reminders</Label>
                        <p className="text-sm text-neutral-500">Create follow-up tasks for missing information</p>
                      </div>
                      <Switch id="autoReminders" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoEmail">Auto-Send Emails</Label>
                        <p className="text-sm text-neutral-500">Automatically send emails for status updates</p>
                      </div>
                      <Switch id="autoEmail" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Email Signature</h3>
                  <Textarea 
                    rows={4} 
                    defaultValue={
                      "John Doe\nClaims Administrator\nWard TLC\nPhone: (555) 123-4567\nEmail: john.doe@wardtlc.com"
                    }
                  />
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button onClick={handleSaveSettings}>Save System Settings</Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Manage your application data and exports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Export All Claims Data</h4>
                      <p className="text-sm text-neutral-500">Download a CSV file of all claims</p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-1 text-sm">download</span>
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Backup System Data</h4>
                      <p className="text-sm text-neutral-500">Create a complete system backup</p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-1 text-sm">backup</span>
                      Backup
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h4 className="font-medium">Clear Cache</h4>
                      <p className="text-sm text-neutral-500">Clear application cache data</p>
                    </div>
                    <Button variant="outline">
                      <span className="material-icons mr-1 text-sm">cleaning_services</span>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
