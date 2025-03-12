import React, { createContext, useContext } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  Bar,
  BarChart as RechartsBarChart,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Define chart configuration type
export type ChartConfig = {
  colors?: string[];
  strokeWidth?: number;
  grid?: boolean;
  legends?: boolean;
  tooltips?: boolean;
  gridColor?: string;
  axisColor?: string;
  tickColor?: string;
  labelColor?: string;
}

// Create chart context for configuration sharing
type ChartContextProps = {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextProps | undefined>(undefined);

// Hook to access chart configuration
function useChart() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("Chart components must be used within a Chart component");
  }
  return context;
}

// Default chart configuration
const defaultConfig: ChartConfig = {
  colors: ["#0ea5e9", "#22c55e", "#f97316", "#f43f5e", "#a855f7"],
  strokeWidth: 2,
  grid: true,
  legends: true,
  tooltips: true,
  gridColor: "rgba(0,0,0,0.1)",
  axisColor: "rgba(0,0,0,0.2)",
  tickColor: "rgba(0,0,0,0.6)",
  labelColor: "rgba(0,0,0,0.7)",
};

// Main Chart component to provide configuration
export function Chart({
  children,
  config = {},
  className,
  ...props
}: {
  children: React.ReactNode;
  config?: ChartConfig;
  className?: string;
  [key: string]: any;
}) {
  const mergedConfig = { ...defaultConfig, ...config };
  
  return (
    <div className={`w-full h-64 ${className || ""}`} {...props}>
      <ChartContext.Provider value={{ config: mergedConfig }}>
        {children}
      </ChartContext.Provider>
    </div>
  );
}

// Line Chart Component
export function LineChart({ 
  data, 
  dataKey = "value",
  nameKey = "name",
}: { 
  data: any[]; 
  dataKey?: string;
  nameKey?: string;
}) {
  const { config } = useChart();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {config.grid && <CartesianGrid strokeDasharray="3 3" stroke={config.gridColor} />}
        <XAxis 
          dataKey={nameKey} 
          stroke={config.axisColor} 
          tick={{ fill: config.tickColor }}
        />
        <YAxis stroke={config.axisColor} tick={{ fill: config.tickColor }} />
        {config.tooltips && <Tooltip />}
        {config.legends && <Legend />}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={config.colors?.[0] || defaultConfig.colors![0]}
          strokeWidth={config.strokeWidth}
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

// Bar Chart Component
export function BarChart({ 
  data,
  dataKey = "value",
  nameKey = "name",
}: { 
  data: any[];
  dataKey?: string;
  nameKey?: string;
}) {
  const { config } = useChart();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {config.grid && <CartesianGrid strokeDasharray="3 3" stroke={config.gridColor} />}
        <XAxis 
          dataKey={nameKey} 
          stroke={config.axisColor} 
          tick={{ fill: config.tickColor }}
        />
        <YAxis stroke={config.axisColor} tick={{ fill: config.tickColor }} />
        {config.tooltips && <Tooltip />}
        {config.legends && <Legend />}
        <Bar dataKey={dataKey} fill={config.colors?.[0] || defaultConfig.colors![0]}>
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={config.colors?.[index % (config.colors.length || 1)] || defaultConfig.colors![index % defaultConfig.colors!.length]} 
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

// Pie Chart Component
export function PieChart({ 
  data,
  dataKey = "value",
  nameKey = "name", 
}: { 
  data: any[];
  dataKey?: string;
  nameKey?: string;
}) {
  const { config } = useChart();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        {config.tooltips && <Tooltip />}
        {config.legends && <Legend />}
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={config.colors?.[index % (config.colors.length || 1)] || defaultConfig.colors![index % defaultConfig.colors!.length]} 
            />
          ))}
        </Pie>
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

// Area Chart Component
export function AreaChart({ 
  data, 
  dataKey = "value",
  nameKey = "name",
}: { 
  data: any[]; 
  dataKey?: string;
  nameKey?: string;
}) {
  const { config } = useChart();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {config.grid && <CartesianGrid strokeDasharray="3 3" stroke={config.gridColor} />}
        <XAxis 
          dataKey={nameKey} 
          stroke={config.axisColor} 
          tick={{ fill: config.tickColor }}
        />
        <YAxis stroke={config.axisColor} tick={{ fill: config.tickColor }} />
        {config.tooltips && <Tooltip />}
        {config.legends && <Legend />}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={config.colors?.[0] || defaultConfig.colors![0]}
          strokeWidth={config.strokeWidth}
          fill={config.colors?.[0] || defaultConfig.colors![0]}
          fillOpacity={0.3}
        />
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}