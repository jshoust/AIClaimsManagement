import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value: string;
    isPositive: boolean;
  };
  iconColor: string;
}

export function SummaryCard({ title, value, icon, change, iconColor }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{title}</p>
          <p className="text-2xl font-medium text-neutral-800">{value}</p>
        </div>
        <div className={`h-10 w-10 ${iconColor} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-2 text-xs flex items-center">
          <span className={`flex items-center ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="material-icons text-xs">
              {change.isPositive ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {change.value}
          </span>
          <span className="ml-1 text-neutral-500">vs last month</span>
        </div>
      )}
    </div>
  );
}
