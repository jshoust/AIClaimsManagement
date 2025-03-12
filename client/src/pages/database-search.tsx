import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuery } from "@tanstack/react-query";
import { Claim } from "@shared/schema";
import { formatDate } from "@/lib/format-date";

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
