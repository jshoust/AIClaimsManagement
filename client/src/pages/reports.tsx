
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('status');
  
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
  
  // Sample data for demonstration
  const getStatusData = () => [
    { name: 'New', value: 25, color: '#6366f1' },
    { name: 'In Review', value: 40, color: '#f59e0b' },
    { name: 'Approved', value: 20, color: '#10b981' },
    { name: 'Rejected', value: 10, color: '#ef4444' },
    { name: 'On Hold', value: 5, color: '#6b7280' },
  ];
  
  const getClaimTypeData = () => [
    { name: 'Damage', value: 35, color: '#3b82f6' },
    { name: 'Loss', value: 25, color: '#ec4899' },
    { name: 'Theft', value: 10, color: '#8b5cf6' },
    { name: 'Defect', value: 20, color: '#f97316' },
    { name: 'Other', value: 10, color: '#6b7280' },
  ];
  
  const monthlyData = [
    { name: 'Jan', new: 20, inReview: 15, approved: 10, rejected: 5 },
    { name: 'Feb', new: 15, inReview: 20, approved: 12, rejected: 8 },
    { name: 'Mar', new: 25, inReview: 18, approved: 15, rejected: 7 },
    { name: 'Apr', new: 30, inReview: 25, approved: 18, rejected: 10 },
    { name: 'May', new: 28, inReview: 22, approved: 20, rejected: 6 },
    { name: 'Jun', new: 35, inReview: 30, approved: 25, rejected: 5 },
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
            <Button variant="default" className="flex items-center gap-1">
              <span className="material-icons text-sm">download</span>
              Export as PDF
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">248</div>
                  <p className="text-xs text-emerald-500 flex items-center">
                    <span className="material-icons text-xs">arrow_upward</span>
                    <span>12% from last month</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Open Claims</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">65</div>
                  <p className="text-xs text-emerald-500 flex items-center">
                    <span className="material-icons text-xs">arrow_downward</span>
                    <span>5% from last month</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5.2 days</div>
                  <p className="text-xs text-emerald-500 flex items-center">
                    <span className="material-icons text-xs">arrow_downward</span>
                    <span>0.8 days improvement</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">72%</div>
                  <p className="text-xs text-emerald-500 flex items-center">
                    <span className="material-icons text-xs">arrow_upward</span>
                    <span>3% from last month</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Claim Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="new" name="New" stackId="a" fill="#6366f1" />
                      <Bar dataKey="inReview" name="In Review" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="approved" name="Approved" stackId="a" fill="#10b981" />
                      <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Claims by {reportType === 'status' ? 'Status' : 'Type'}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={reportType === 'status' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportType('status')}
                    >
                      Status
                    </Button>
                    <Button
                      variant={reportType === 'claimType' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setReportType('claimType')}
                    >
                      Type
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
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
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Distribution Table</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-neutral-700 uppercase bg-neutral-100">
                        <tr>
                          <th scope="col" className="px-6 py-3">Category</th>
                          <th scope="col" className="px-6 py-3">Count</th>
                          <th scope="col" className="px-6 py-3">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieData.map((item, index) => (
                          <tr key={index} className="bg-white border-b">
                            <td className="px-6 py-4 flex items-center">
                              <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                              {item.name}
                            </td>
                            <td className="px-6 py-4">{item.value}</td>
                            <td className="px-6 py-4">
                              {Math.round((item.value / pieData.reduce((sum, i) => sum + i.value, 0)) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
