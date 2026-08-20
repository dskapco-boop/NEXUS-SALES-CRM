import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon?: ReactNode;
}

export const StatCard = ({ title, value, change, icon }: StatCardProps) => (
  <div className="bg-card rounded-lg p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-green-600">{change}</p>
      </div>
      {icon}
    </div>
  </div>
);
