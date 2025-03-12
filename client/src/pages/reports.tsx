import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function Reports() {
  const [reportType, setReportType] = useState('status');

  // Mock data for demonstration
  const getStatusData = () => [
    { name: 'Pending', value: 35 },
    { name: 'Completed', value: 45 },
    { name: 'Rejected', value: 20 },
  ];

  const getClaimTypeData = () => [
    { name: 'Medical', value: 40 },
    { name: 'Travel', value: 30 },
    { name: 'Equipment', value: 20 },
    { name: 'Other', value: 10 },
  ];

  const getMonthlyClaimsData = () => [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 19 },
    { name: 'Mar', value: 25 },
    { name: 'Apr', value: 22 },
    { name: 'May', value: 30 },
    { name: 'Jun', value: 28 },
    { name: 'Jul', value: 32 },
    { name: 'Aug', value: 37 },
    { name: 'Sep', value: 29 },
    { name: 'Oct', value: 26 },
    { name: 'Nov', value: 20 },
    { name: 'Dec', value: 24 },
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
            <Button variant="outline" onClick={() => setReportType('status')} className={`${reportType === 'status' ? 'bg-primary/10' : ''}`}>
              Status Reports
            </Button>
            <Button variant="outline" onClick={() => setReportType('type')} className={`${reportType === 'type' ? 'bg-primary/10' : ''}`}>
              Claim Type Reports
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Claims by {reportType === 'status' ? 'Status' : 'Type'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold text-4xl mb-1">{reportType === 'status' ? '100' : '120'}</div>
                  <div className="text-sm text-muted-foreground">Total Claims</div>
                </div>
                <div className="w-full">
                  {pieData.map((entry, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <div className={`w-3 h-3 rounded-full bg-chart-${index + 1} mr-2`}></div>
                      <div className="text-sm">{entry.name}</div>
                      <div className="ml-auto text-sm font-medium">{entry.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Claims</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80 flex items-end justify-between gap-2">
                {getMonthlyClaimsData().map((data, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex-1 w-6 bg-primary rounded-t" style={{ height: `${data.value * 2}px` }}></div>
                    <div className="text-xs mt-1">{data.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-secondary/20 rounded-lg p-4">
                  <div className="text-muted-foreground text-sm">Total Claims</div>
                  <div className="text-2xl font-semibold mt-1">120</div>
                </div>
                <div className="bg-secondary/20 rounded-lg p-4">
                  <div className="text-muted-foreground text-sm">Average Processing Time</div>
                  <div className="text-2xl font-semibold mt-1">4.5 days</div>
                </div>
                <div className="bg-secondary/20 rounded-lg p-4">
                  <div className="text-muted-foreground text-sm">Approval Rate</div>
                  <div className="text-2xl font-semibold mt-1">85%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}