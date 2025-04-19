import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Claim, ExternalDatabase } from "@shared/schema";
import { formatDate } from "@/lib/format-date";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Database, Plus, Trash2, RefreshCcw, TableProperties, PlayCircle } from "lucide-react";

// Create a schema for new database connections
const databaseConnectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["mysql", "postgres", "sqlserver", "oracle"], {
    required_error: "Please select a database type",
  }),
  host: z.string().min(1, "Host is required"),
  port: z.number({
    required_error: "Port is required",
    invalid_type_error: "Port must be a number",
  }).int().positive(),
  database: z.string().min(1, "Database name is required"),
  schema: z.string().optional(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  tags: z.array(z.string()).optional().default([]),
});

type DatabaseFormValues = z.infer<typeof databaseConnectionSchema>;

// External Database Manager Component
function ExternalDatabaseManager() {
  const { toast } = useToast();
  const [isNewConnectionDialogOpen, setIsNewConnectionDialogOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [isConnectionTesting, setIsConnectionTesting] = useState(false);
  const [isViewingTables, setIsViewingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isExecutingQuery, setIsExecutingQuery] = useState(false);
  
  // Fetch connections
  const { 
    data: connections, 
    isLoading: isLoadingConnections,
    refetch: refetchConnections
  } = useQuery<ExternalDatabase[]>({
    queryKey: ['/api/database/connections'],
  });
  
  // Create new connection mutation
  const createConnection = useMutation({
    mutationFn: async (data: DatabaseFormValues) => {
      return apiRequest('/api/database/connections', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Database Connection Created",
        description: "The database connection was successfully created.",
      });
      setIsNewConnectionDialogOpen(false);
      refetchConnections();
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Connection",
        description: error.message || "Failed to create database connection.",
        variant: "destructive",
      });
    },
  });
  
  // Test connection mutation
  const testConnection = useMutation({
    mutationFn: async (data: DatabaseFormValues) => {
      return apiRequest('/api/database/connections/test', 'POST', data);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to database. Latency: ${data.latency}ms`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to database.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Test Connection Failed",
        description: error.message || "An error occurred while testing the connection.",
        variant: "destructive",
      });
    },
  });
  
  // Delete connection mutation
  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/database/connections/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Database Connection Deleted",
        description: "The database connection was successfully deleted.",
      });
      refetchConnections();
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Connection",
        description: error.message || "Failed to delete database connection.",
        variant: "destructive",
      });
    },
  });
  
  // Get tables for a connection
  const { 
    data: tables, 
    isLoading: isLoadingTables,
    refetch: refetchTables
  } = useQuery<string[]>({
    queryKey: ['/api/database/connections', selectedConnectionId, 'tables'],
    enabled: !!selectedConnectionId && isViewingTables,
  });
  
  // Get table schema
  const { 
    data: tableSchema, 
    isLoading: isLoadingSchema 
  } = useQuery({
    queryKey: ['/api/database/connections', selectedConnectionId, 'tables', selectedTable, 'schema'],
    enabled: !!selectedConnectionId && !!selectedTable,
  });
  
  // Form setup for adding new connections
  const form = useForm<DatabaseFormValues>({
    resolver: zodResolver(databaseConnectionSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "postgres" as const,
      host: "",
      port: 5432,
      database: "",
      schema: "",
      username: "",
      password: "",
      tags: [],
    },
  });
  
  // Submit handler for the form
  function onSubmit(data: DatabaseFormValues) {
    createConnection.mutate(data);
  }
  
  // Function to handle test connection
  function handleTestConnection() {
    const formData = form.getValues();
    setIsConnectionTesting(true);
    
    // Update port based on selected database type if not manually changed
    if (!form.formState.dirtyFields.port) {
      switch (formData.type) {
        case "postgres":
          form.setValue("port", 5432);
          break;
        case "mysql":
          form.setValue("port", 3306);
          break;
        case "sqlserver":
          form.setValue("port", 1433);
          break;
        case "oracle":
          form.setValue("port", 1521);
          break;
      }
    }
    
    testConnection.mutate(formData, {
      onSettled: () => {
        setIsConnectionTesting(false);
      }
    });
  }
  
  // Function to view tables for a connection
  function handleViewTables(connectionId: string) {
    setSelectedConnectionId(connectionId);
    setIsViewingTables(true);
    refetchTables();
  }
  
  // Function to select a table and view its schema
  function handleSelectTable(tableName: string) {
    setSelectedTable(tableName);
  }
  
  // Function to delete a connection
  function handleDeleteConnection(id: string) {
    if (confirm("Are you sure you want to delete this connection? This action cannot be undone.")) {
      deleteConnection.mutate(id);
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Database Connections</h3>
          <p className="text-sm text-gray-500">
            Connect to external company databases to query and import data
          </p>
        </div>
        
        {/* New Connection Dialog Trigger */}
        <Dialog open={isNewConnectionDialogOpen} onOpenChange={setIsNewConnectionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Connection
            </Button>
          </DialogTrigger>
          
          {/* New Connection Dialog Content */}
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Database Connection</DialogTitle>
              <DialogDescription>
                Connect to external databases to search and import data.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Connection Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Production Database" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Main production database for company data" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Database Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Update port based on selected database type
                          switch (value) {
                            case "postgres":
                              form.setValue("port", 5432);
                              break;
                            case "mysql":
                              form.setValue("port", 3306);
                              break;
                            case "sqlserver":
                              form.setValue("port", 1433);
                              break;
                            case "oracle":
                              form.setValue("port", 1521);
                              break;
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select database type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="postgres">PostgreSQL</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="sqlserver">SQL Server</SelectItem>
                          <SelectItem value="oracle">Oracle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Host</FormLabel>
                        <FormControl>
                          <Input placeholder="db.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="database"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Name</FormLabel>
                        <FormControl>
                          <Input placeholder="prod_db" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="schema"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schema (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="public" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="db_user" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={isConnectionTesting || createConnection.isPending}
                  >
                    {isConnectionTesting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Test Connection
                  </Button>
                  <Button type="submit" disabled={createConnection.isPending}>
                    {createConnection.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Connection
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Connections List */}
      {isLoadingConnections ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : connections && connections.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b text-left text-neutral-500">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Host</th>
                <th className="p-3 font-medium">Database</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connections.map((connection) => (
                <tr key={connection.id} className="border-b hover:bg-neutral-50">
                  <td className="p-3 font-medium">
                    <div>
                      <div className="font-medium text-primary">{connection.name}</div>
                      <div className="text-xs text-neutral-500">{connection.description}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">
                      {connection.type === 'postgres' ? 'PostgreSQL' : 
                       connection.type === 'mysql' ? 'MySQL' : 
                       connection.type === 'sqlserver' ? 'SQL Server' : 
                       'Oracle'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {connection.host}:{connection.port}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      {connection.database}
                      {connection.schema && <span className="opacity-70">.{connection.schema}</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={connection.isActive ? "success" : "destructive"}>
                      {connection.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewTables(connection.id)}
                        title="Browse Tables"
                      >
                        <TableProperties className="h-4 w-4 text-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteConnection(connection.id)}
                        title="Delete Connection"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border rounded-md p-8 text-center">
          <Database className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Database Connections</h3>
          <p className="text-neutral-500 mb-4 max-w-md mx-auto">
            Connect to external company databases to search and import data for claims processing.
          </p>
          <Button onClick={() => setIsNewConnectionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Database Connection
          </Button>
        </div>
      )}
      
      {/* Database Tables Dialog */}
      {selectedConnectionId && (
        <Dialog open={isViewingTables} onOpenChange={setIsViewingTables}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Database Tables</DialogTitle>
              <DialogDescription>
                Browse and query tables from the connected database.
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingTables ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tables && tables.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b text-left text-neutral-500">
                      <th className="p-3 font-medium">Table Name</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tables.map((tableName) => (
                      <tr key={tableName} className="border-b hover:bg-neutral-50">
                        <td className="p-3 font-medium">{tableName}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSelectTable(tableName)}
                            >
                              <TableProperties className="h-4 w-4 mr-2" />
                              View Schema
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Query
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                No tables found in this database.
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingTables(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function DatabaseSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  
  // Fetch claims data
  const { data: claims, isLoading: isLoadingClaims } = useQuery<Claim[]>({
    queryKey: ['/api/claims'],
  });
  
  // Get filtered search results based on search term and category
  const getFilteredResults = () => {
    if (!claims || !searchTerm) return [];
    
    return claims.filter(claim => {
      if (searchCategory === "all") {
        return (
          claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else if (searchCategory === "claimNumber") {
        return claim.claimNumber.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchCategory === "customer") {
        return claim.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchCategory === "orderNumber") {
        return claim.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      } else if (searchCategory === "contact") {
        return (
          claim.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          claim.phone.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return false;
    });
  };
  
  const searchResults = getFilteredResults();
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Database Search</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Search Claims Database</CardTitle>
            <CardDescription>Search for claims by ID, customer, or order information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Search for claims, customers, or orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <span className="material-icons absolute left-3 top-2 text-neutral-400">search</span>
                </div>
                
                <Select
                  value={searchCategory}
                  onValueChange={setSearchCategory}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="claimNumber">Claim Number</SelectItem>
                    <SelectItem value="customer">Customer Name</SelectItem>
                    <SelectItem value="orderNumber">Order Number</SelectItem>
                    <SelectItem value="contact">Contact Info</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button>Search</Button>
              </div>
              
              <Tabs defaultValue="claims">
                <TabsList>
                  <TabsTrigger value="claims">Claims</TabsTrigger>
                  <TabsTrigger value="contracts">Contracts</TabsTrigger>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>
                
                <TabsContent value="claims" className="mt-4">
                  {isLoadingClaims ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : searchTerm && searchResults.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500">
                      No results found for "{searchTerm}"
                    </div>
                  ) : searchTerm ? (
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-neutral-50 border-b text-left text-neutral-500">
                            <th className="p-3 font-medium">Claim #</th>
                            <th className="p-3 font-medium">Customer</th>
                            <th className="p-3 font-medium">Order #</th>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Status</th>
                            <th className="p-3 font-medium">Amount</th>
                            <th className="p-3 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchResults.map((claim) => (
                            <tr key={claim.id} className="border-b hover:bg-neutral-50">
                              <td className="p-3 font-medium text-primary">#{claim.claimNumber}</td>
                              <td className="p-3">{claim.customerName}</td>
                              <td className="p-3">{claim.orderNumber}</td>
                              <td className="p-3">{formatDate(claim.dateSubmitted)}</td>
                              <td className="p-3">
                                <StatusBadge status={claim.status as any} />
                              </td>
                              <td className="p-3">{claim.claimAmount}</td>
                              <td className="p-3">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="material-icons text-primary">visibility</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      Enter a search term to find claims
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="contracts" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    Contract search functionality is under development
                  </div>
                </TabsContent>
                
                <TabsContent value="customers" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    Customer search functionality is under development
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>External Database Connections</CardTitle>
            <CardDescription>Connect to external company databases to search and import data</CardDescription>
          </CardHeader>
          <CardContent>
            <ExternalDatabaseManager />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Advanced Search</CardTitle>
            <CardDescription>Search with multiple criteria and filters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Claim Status</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Status</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="missing_info">Missing Info</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="follow_up">Follow-up Required</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Claim Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="damaged">Damaged Goods</SelectItem>
                    <SelectItem value="lost">Lost Shipment</SelectItem>
                    <SelectItem value="shortage">Shortage</SelectItem>
                    <SelectItem value="delay">Delivery Delay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Anyone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Anyone</SelectItem>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="mike">Mike Thompson</SelectItem>
                    <SelectItem value="jessica">Jessica Williams</SelectItem>
                    <SelectItem value="david">David Brown</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 days</SelectItem>
                    <SelectItem value="month">Last 30 days</SelectItem>
                    <SelectItem value="quarter">Last 90 days</SelectItem>
                    <SelectItem value="year">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Range</label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Min" className="w-full" />
                  <span>-</span>
                  <Input placeholder="Max" className="w-full" />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full">Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
