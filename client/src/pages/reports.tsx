
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Add print styling
import { useEffect } from 'react';

// Add print media CSS
useEffect(() => {
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      nav, header, footer, .no-print {
        display: none !important;
      }
      body, html {
        width: 100%;
        height: auto;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .print-container {
        width: 100% !important;
        overflow: visible !important;
      }
      button {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  return () => {
    document.head.removeChild(style);
  };
}, []);
</new_str>

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function Reports() {
  const [reportPeriod, setReportPeriod] = useState("month");
  const [reportType, setReportType] = useState("status");
  
  // Fetch claims data for reports
  const { data: claims, isLoading } = useQuery({
    queryKey: ['/api/claims'],
  });
  
  // Prepare data for status distribution chart
  const getStatusData = () => {
    if (!claims) return [];
    
    const statusCounts: Record<string, number> = {
      new: 0,
      missing_info: 0,
      in_review: 0,
      follow_up: 0,
      completed: 0
    };
    
    claims.forEach((claim: any) => {
      if (statusCounts[claim.status] !== undefined) {
        statusCounts[claim.status]++;
      }
    });
    
    return [
      { name: 'New', value: statusCounts.new, color: '#3B82F6' }, // blue
      { name: 'Missing Info', value: statusCounts.missing_info, color: '#F59E0B' }, // amber
      { name: 'In Review', value: statusCounts.in_review, color: '#06B6D4' }, // cyan
      { name: 'Follow-up', value: statusCounts.follow_up, color: '#EF4444' }, // red
      { name: 'Completed', value: statusCounts.completed, color: '#10B981' } // green
    ];
  };
  
  // Prepare data for claim type distribution chart
  const getClaimTypeData = () => {
    if (!claims) return [];
    
    const typeCounts: Record<string, number> = {};
    
    claims.forEach((claim: any) => {
      if (typeCounts[claim.claimType]) {
        typeCounts[claim.claimType]++;
      } else {
        typeCounts[claim.claimType] = 1;
      }
    });
    
    return Object.entries(typeCounts).map(([name, value], index) => {
      const colors = ['#3B82F6', '#F59E0B', '#06B6D4', '#EF4444', '#10B981', '#8B5CF6'];
      return {
        name,
        value,
        color: colors[index % colors.length]
      };
    });
  };
  
  // Monthly trend data (mocked for demo)
  const monthlyTrendData = [
    { name: 'Jan', new: 4, inReview: 3, completed: 8 },
    { name: 'Feb', new: 3, inReview: 2, completed: 10 },
    { name: 'Mar', new: 5, inReview: 4, completed: 7 },
    { name: 'Apr', new: 7, inReview: 5, completed: 6 },
    { name: 'May', new: 2, inReview: 3, completed: 12 },
    { name: 'Jun', new: 4, inReview: 6, completed: 8 },
    { name: 'Jul', new: 6, inReview: 4, completed: 9 },
    { name: 'Aug', new: 3, inReview: 2, completed: 11 },
    { name: 'Sep', new: 5, inReview: 3, completed: 14 },
    { name: 'Oct', new: 8, inReview: 7, completed: 10 },
    { name: 'Nov', new: 6, inReview: 3, completed: 9 },
    { name: 'Dec', new: 4, inReview: 2, completed: 7 }
  ];
  
  const pieData = reportType === 'status' ? getStatusData() : getClaimTypeData();
  
  return (
    <main className="flex-1 overflow-y-auto scrollbar-thin p-6 print-container">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-neutral-800">Reports</h2>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-1"
              onClick={() => window.print()}
            >
              <span className="material-icons text-sm">print</span>
              Print Report
            </Button>
            <Button variant="outline" className="flex items-center gap-1">
              <span className="material-icons text-sm">file_download</span>
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">Total Claims</p>
                  <p className="text-2xl font-medium text-neutral-800">{claims?.length || 0}</p>
                </div>
                <div className="h-10 w-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <span className="material-icons text-primary">description</span>
                </div>
              </div>
              <div className="text-xs text-neutral-500">
                Across all time periods
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">Processing Time</p>
                  <p className="text-2xl font-medium text-neutral-800">4.2 days</p>
                </div>
                <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-amber-600">timer</span>
                </div>
              </div>
              <div className="text-xs text-neutral-500">
                Average time to close a claim
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-neutral-500 font-medium">Resolution Rate</p>
                  <p className="text-2xl font-medium text-neutral-800">74%</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="material-icons text-green-600">check_circle</span>
                </div>
              </div>
              <div className="text-xs text-neutral-500">
                Claims successfully resolved
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Claims Overview</CardTitle>
              <div className="flex gap-2">
                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last 12 Months</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trend">
              <TabsList>
                <TabsTrigger value="trend">Monthly Trend</TabsTrigger>
                <TabsTrigger value="distribution">Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trend" className="pt-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyTrendData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="new" name="New Claims" fill="#3B82F6" />
                        <Bar dataKey="inReview" name="In Review" fill="#F59E0B" />
                        <Bar dataKey="completed" name="Completed" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="distribution" className="pt-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex justify-center gap-4 mb-4">
                      <button 
                        className={`px-3 py-1 rounded-md text-sm ${
                          reportType === 'status' 
                            ? 'bg-primary text-white' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                        onClick={() => setReportType('status')}
                      >
                        By Status
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-md text-sm ${
                          reportType === 'type' 
                            ? 'bg-primary text-white' 
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                        onClick={() => setReportType('type')}
                      >
                        By Type
                      </button>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:w-80">
                    <div className="bg-neutral-50 p-4 rounded-md">
                      <h3 className="font-medium mb-3">Distribution Breakdown</h3>
                      <div className="space-y-3">
                        {pieData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-3 h-3 rounded-sm mr-2" 
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.value}</span>
                              <span className="text-xs text-neutral-500">
                                ({((item.value / (claims?.length || 1)) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Claims</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims && Array.from(
                    claims.reduce((acc: Map<string, number>, claim: any) => {
                      const count = acc.get(claim.customerName) || 0;
                      acc.set(claim.customerName, count + 1);
                      return acc;
                    }, new Map<string, number>())
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([customer, count], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <span className="font-medium">{customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-neutral-100 h-2 w-32 rounded-full overflow-hidden">
                            <div 
                              className="bg-primary h-full"
                              style={{ width: `${(count / (claims.length || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Claims By State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={[
                      { state: 'California', value: 23 },
                      { state: 'New York', value: 17 },
                      { state: 'Texas', value: 14 },
                      { state: 'Florida', value: 11 },
                      { state: 'Illinois', value: 8 },
                    ]}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="state" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
