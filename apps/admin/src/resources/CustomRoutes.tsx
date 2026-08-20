import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./StatCard";

export const Dashboard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nexus CRM Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Leads" value="127" change="+12%" />
          <StatCard title="Open Enquiries" value="23" change="+3" />
          <StatCard title="Sales Orders" value="15" change="+2" />
          <StatCard title="Monthly Revenue" value="$48.2K" change="+8%" />
        </div>
      </CardContent>
    </Card>
  );
};
