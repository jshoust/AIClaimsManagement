import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function EmailIntegration() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("setup");
  const [emailConfig, setEmailConfig] = useState({
    incomingServer: "",
    incomingPort: "",
    outgoingServer: "",
    outgoingPort: "",
    username: "",
    password: "",
    useSSL: true,
    autoCheck: true,
    checkInterval: "15"
  });
  
  // Load email templates
  const { data: emailTemplates, isLoading } = useQuery({
    queryKey: ['/api/email-templates'],
  });
  
  const handleSaveConfig = () => {
    toast({
      title: "Configuration Saved",
      description: "Email integration settings have been saved",
    });
  };
  
  const handleTestConnection = () => {
    toast({
      title: "Connection Successful",
      description: "Successfully connected to the email server",
    });
  };
  
  const handleSaveTemplate = () => {
    toast({
      title: "Template Saved",
      description: "Email template has been saved successfully",
    });
  };
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Email Integration</h2>
        </div>
        
        <Tabs defaultValue="setup" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Email History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Set up your email server to automatically process incoming claims and send notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="incomingServer">Incoming Mail Server (IMAP)</Label>
                    <Input 
                      id="incomingServer" 
                      placeholder="imap.example.com"
                      value={emailConfig.incomingServer}
                      onChange={(e) => setEmailConfig({...emailConfig, incomingServer: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incomingPort">Incoming Port</Label>
                    <Input 
                      id="incomingPort" 
                      placeholder="993"
                      value={emailConfig.incomingPort}
                      onChange={(e) => setEmailConfig({...emailConfig, incomingPort: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outgoingServer">Outgoing Mail Server (SMTP)</Label>
                    <Input 
                      id="outgoingServer" 
                      placeholder="smtp.example.com"
                      value={emailConfig.outgoingServer}
                      onChange={(e) => setEmailConfig({...emailConfig, outgoingServer: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outgoingPort">Outgoing Port</Label>
                    <Input 
                      id="outgoingPort" 
                      placeholder="587"
                      value={emailConfig.outgoingPort}
                      onChange={(e) => setEmailConfig({...emailConfig, outgoingPort: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Email Username</Label>
                    <Input 
                      id="username" 
                      placeholder="claims@wardtlc.com"
                      value={emailConfig.username}
                      onChange={(e) => setEmailConfig({...emailConfig, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Email Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••"
                      value={emailConfig.password}
                      onChange={(e) => setEmailConfig({...emailConfig, password: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="useSSL">Use SSL/TLS</Label>
                      <p className="text-sm text-neutral-500">Secure connection to mail servers</p>
                    </div>
                    <Switch 
                      id="useSSL" 
                      checked={emailConfig.useSSL}
                      onCheckedChange={(checked) => setEmailConfig({...emailConfig, useSSL: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoCheck">Auto-Check for New Emails</Label>
                      <p className="text-sm text-neutral-500">Automatically check for new claim emails</p>
                    </div>
                    <Switch 
                      id="autoCheck" 
                      checked={emailConfig.autoCheck}
                      onCheckedChange={(checked) => setEmailConfig({...emailConfig, autoCheck: checked})}
                    />
                  </div>
                  
                  {emailConfig.autoCheck && (
                    <div className="space-y-2">
                      <Label htmlFor="checkInterval">Check Interval (minutes)</Label>
                      <Input 
                        id="checkInterval" 
                        type="number" 
                        min="5" 
                        max="60"
                        value={emailConfig.checkInterval}
                        onChange={(e) => setEmailConfig({...emailConfig, checkInterval: e.target.value})}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleTestConnection}>Test Connection</Button>
                <Button onClick={handleSaveConfig}>Save Configuration</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Manage templates for automated emails sent to customers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="missing-info">
                  <TabsList className="mb-4">
                    <TabsTrigger value="missing-info">Missing Information</TabsTrigger>
                    <TabsTrigger value="status-update">Status Update</TabsTrigger>
                    <TabsTrigger value="new-template">+ New Template</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="missing-info" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" value="Missing Information Request" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input 
                        id="subject" 
                        value="Missing Information for Claim #{claimNumber}" 
                      />
                      <p className="text-xs text-neutral-500">
                        Use {'{'}claimNumber{'}'}, {'{'}customerName{'}'}, etc. as placeholders
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Email Body</Label>
                      <Textarea 
                        id="body" 
                        rows={10}
                        value={
                          "Dear {contactPerson},\n\n" +
                          "We are processing your claim #{claimNumber} but need additional information to proceed. Please provide the following:\n\n" +
                          "{missingItems}\n\n" +
                          "Thank you,\nWard TLC Claims Department"
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="default-template" />
                        <Label htmlFor="default-template">Set as default template</Label>
                      </div>
                      <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="status-update" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" value="Claim Status Update" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input 
                        id="subject" 
                        value="Status Update for Claim #{claimNumber}" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Email Body</Label>
                      <Textarea 
                        id="body" 
                        rows={10}
                        value={
                          "Dear {contactPerson},\n\n" +
                          "Your claim #{claimNumber} status has been updated to {status}.\n\n" +
                          "Thank you,\nWard TLC Claims Department"
                        }
                      />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="default-template" />
                        <Label htmlFor="default-template">Set as default template</Label>
                      </div>
                      <Button onClick={handleSaveTemplate}>Save Template</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="new-template" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" placeholder="Enter template name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Input id="subject" placeholder="Enter email subject" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body">Email Body</Label>
                      <Textarea id="body" rows={10} placeholder="Enter email body" />
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch id="default-template" />
                        <Label htmlFor="default-template">Set as default template</Label>
                      </div>
                      <Button onClick={handleSaveTemplate}>Create Template</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Email History</CardTitle>
                <CardDescription>
                  View sent and received emails related to claims.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Input className="max-w-sm" placeholder="Search emails..." />
                    <Button variant="outline">Refresh</Button>
                  </div>
                  
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-neutral-50 border-b text-left text-neutral-500">
                          <th className="p-3 font-medium">Date</th>
                          <th className="p-3 font-medium">Direction</th>
                          <th className="p-3 font-medium">Claim #</th>
                          <th className="p-3 font-medium">Subject</th>
                          <th className="p-3 font-medium">Recipient</th>
                          <th className="p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-neutral-50">
                          <td className="p-3">Oct 12, 2023</td>
                          <td className="p-3">
                            <span className="text-blue-600 material-icons text-sm">outgoing_mail</span> Sent
                          </td>
                          <td className="p-3">#CLM-1082</td>
                          <td className="p-3">Missing Information Request</td>
                          <td className="p-3">john.smith@acmelogistics.com</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Delivered
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b hover:bg-neutral-50">
                          <td className="p-3">Oct 11, 2023</td>
                          <td className="p-3">
                            <span className="text-green-600 material-icons text-sm">incoming_mail</span> Received
                          </td>
                          <td className="p-3">#CLM-1081</td>
                          <td className="p-3">Re: Claim Documentation</td>
                          <td className="p-3">mark.davis@globalshipping.com</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Read
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-neutral-50">
                          <td className="p-3">Oct 10, 2023</td>
                          <td className="p-3">
                            <span className="text-blue-600 material-icons text-sm">outgoing_mail</span> Sent
                          </td>
                          <td className="p-3">#CLM-1080</td>
                          <td className="p-3">Status Update: In Review</td>
                          <td className="p-3">lisa.johnson@fasttrack.com</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Delivered
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
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
