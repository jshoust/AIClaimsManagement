
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chart, LineChart, BarChart, PieChart } from "@/components/ui/chart";
import { useEffect } from "react";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");

  // Example data for charts
  const lineChartData = [
    { name: "Jan", value: 24 },
    { name: "Feb", value: 13 },
    { name: "Mar", value: 42 },
    { name: "Apr", value: 35 },
    { name: "May", value: 59 },
    { name: "Jun", value: 48 },
  ];

  const barChartData = [
    { name: "Damaged", value: 35 },
    { name: "Lost", value: 28 },
    { name: "Shortage", value: 15 },
    { name: "Delay", value: 22 },
  ];

  const pieChartData = [
    { name: "Approved", value: 63 },
    { name: "Pending", value: 25 },
    { name: "Denied", value: 12 },
  ];

  useEffect(() => {
    // Update date range labels based on selection
    console.log(`Date range changed to ${dateRange}`);
  }, [dateRange]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDateRange("7d")}>
            7d
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange("30d")}>
            30d
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange("90d")}>
            90d
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDateRange("1y")}>
            1y
          </Button>
          <Input
            type="date"
            className="w-auto"
          />
          <Button>
            <span className="material-icons mr-1 text-sm">download</span>
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="claims">Claims Analysis</TabsTrigger>
          <TabsTrigger value="financial">Financial Impact</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">856</div>
                <p className="text-xs text-muted-foreground">+12.3% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2 days</div>
                <p className="text-xs text-muted-foreground">-1.5 days from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73.4%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last period</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Claims Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)"],
                    strokeWidth: 2,
                    grid: true,
                  }}
                >
                  <LineChart data={lineChartData} />
                </Chart>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Claim Types</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)", "hsl(155, 60%, 50%)", "hsl(155, 60%, 60%)", "hsl(155, 60%, 70%)"],
                    strokeWidth: 0,
                    grid: false,
                  }}
                >
                  <BarChart data={barChartData} />
                </Chart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="claims">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Claim Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)", "hsl(40, 80%, 60%)", "hsl(0, 60%, 60%)"],
                    strokeWidth: 0,
                    grid: false,
                  }}
                >
                  <PieChart data={pieChartData} />
                </Chart>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Claim Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)", "hsl(155, 60%, 50%)", "hsl(155, 60%, 60%)"],
                    strokeWidth: 0,
                    grid: false,
                  }}
                >
                  <BarChart 
                    data={[
                      { name: "Web Form", value: 58 },
                      { name: "Email", value: 32 },
                      { name: "Phone", value: 10 },
                    ]} 
                  />
                </Chart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="financial">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Financial Impact Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Chart
                config={{
                  colors: ["hsl(155, 60%, 40%)"],
                  strokeWidth: 2,
                  grid: true,
                }}
              >
                <LineChart 
                  data={[
                    { name: "Jan", value: 24350 },
                    { name: "Feb", value: 18200 },
                    { name: "Mar", value: 31840 },
                    { name: "Apr", value: 26790 },
                    { name: "May", value: 42150 },
                    { name: "Jun", value: 35680 },
                  ]} 
                />
              </Chart>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)", "hsl(155, 60%, 50%)", "hsl(155, 60%, 60%)", "hsl(155, 60%, 70%)"],
                    strokeWidth: 0,
                    grid: false,
                  }}
                >
                  <BarChart 
                    data={[
                      { name: "Sarah J.", value: 95 },
                      { name: "Mike T.", value: 78 },
                      { name: "Jessica W.", value: 92 },
                      { name: "David B.", value: 82 },
                    ]} 
                  />
                </Chart>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Processing Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  config={{
                    colors: ["hsl(155, 60%, 40%)"],
                    strokeWidth: 2,
                    grid: true,
                  }}
                >
                  <LineChart 
                    data={[
                      { name: "Jan", value: 9.8 },
                      { name: "Feb", value: 9.2 },
                      { name: "Mar", value: 8.7 },
                      { name: "Apr", value: 8.5 },
                      { name: "May", value: 8.2 },
                      { name: "Jun", value: 7.9 },
                    ]} 
                  />
                </Chart>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
