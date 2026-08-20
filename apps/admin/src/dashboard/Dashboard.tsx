import { Card, CardContent, CardHeader, Typography, Grid, Paper, Box, Table, TableBody, TableCell, TableHead, TableRow, Avatar, Link } from "@mui/material";
import { useDataProvider, useNotify } from "react-admin";
import { useEffect, useState } from "react";
import { StatusField } from "../components/StatusBadge";

// Krayin-style dashboard: metric cards + data tables
// Using real data from Supabase via react-admin dataProvider

export const Dashboard = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [metrics, setMetrics] = useState<any>({});
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch recent leads
        const leadsResult = await dataProvider.getList("leads", {
          pagination: { page: 1, perPage: 5 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });
        setRecentLeads(leadsResult.data || []);

        // Fetch all leads (for metrics)
        const allLeadsResult = await dataProvider.getList("leads", {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });
        const allLeads = allLeadsResult.data || [];

        // Fetch all opportunities (for won/lost revenue)
        const oppsResult = await dataProvider.getList("opportunities", {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });
        const allOpps = oppsResult.data || [];

        // Fetch all quotes (for quotes count)
        const quotesResult = await dataProvider.getList("quotes", {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "created_at", order: "DESC" },
          filter: {},
        });
        const allQuotes = quotesResult.data || [];

        // Fetch recent quotes
        const recentQuotesResult = await dataProvider.getList("quotes", {
          pagination: { page: 1, perPage: 5 },
          sort: { field: "quote_date", order: "DESC" },
          filter: {},
        });
        setRecentQuotes(recentQuotesResult.data || []);

        // Fetch accounts (for name lookup)
        const accountsResult = await dataProvider.getList("accounts", {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: "name", order: "ASC" },
          filter: {},
        });
        const accMap: Record<string, string> = {};
        (accountsResult.data || []).forEach((a: any) => {
          accMap[a.id] = a.name;
        });
        setAccountsMap(accMap);

        // Calculate metrics
        const pipelineByStage: Record<string, { count: number; value: number }> = {};
        allLeads.forEach((lead: any) => {
          const stage = lead.status || "new";
          if (!pipelineByStage[stage]) pipelineByStage[stage] = { count: 0, value: 0 };
          pipelineByStage[stage].count += 1;
          pipelineByStage[stage].value += parseFloat(lead.custom_fields?.estimated_value || 0);
        });

        // Calculate won/lost revenue from opportunities
        const wonRevenue = allOpps
          .filter((o: any) => o.stage === "closed_won" || o.stage === "won")
          .reduce((sum: number, o: any) => sum + parseFloat(o.amount || 0), 0);
        const lostRevenue = allOpps
          .filter((o: any) => o.stage === "closed_lost" || o.stage === "lost")
          .reduce((sum: number, o: any) => sum + parseFloat(o.amount || 0), 0);

        // Calculate conversion rate
        const wonOpportunities = allOpps.filter((o: any) => o.stage === "closed_won" || o.stage === "won").length;
        const totalOpportunities = allOpps.length;
        const conversionRate = totalOpportunities > 0 ? Math.round((wonOpportunities / totalOpportunities) * 100) : 0;

        // Average lead value
        const totalLeadValue = allLeads.reduce((sum: number, l: any) => sum + parseFloat(l.custom_fields?.estimated_value || 0), 0);
        const avgLeadValue = allLeads.length > 0 ? Math.round(totalLeadValue / allLeads.length) : 0;

        setMetrics({
          wonRevenue,
          lostRevenue,
          totalLeads: allLeads.length,
          totalQuotes: allQuotes.length,
          avgLeadValue,
          conversionRate,
          pipeline: pipelineByStage,
          totalOpportunities,
          wonOpportunities,
        });
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        notify("Could not load dashboard data", { type: "warning" });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dataProvider, notify]);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const MetricCard = ({ title, value, subtitle, color = "default" }: any) => {
    const colorMap: Record<string, string> = {
      default: "#6b7280",
      success: "#22c55e",
      warning: "#f59e0b",
      info: "#3b82f1",
      error: "#ef4444",
    };

    return (
      <Card sx={{ flexGrow: 1, minWidth: 140, backgroundColor: "#fff" }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary" display="block">
            {title}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: colorMap[color as keyof typeof colorMap] }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const pipelineStages = [
    { id: "new", label: "New", color: "#3b82f1" },
    { id: "follow_up", label: "Follow Up", color: "#a78bfa" },
    { id: "prospect", label: "Prospect", color: "#f59e0b" },
    { id: "negotiation", label: "Negotiation", color: "#8b5cf6" },
    { id: "won", label: "Won", color: "#22c55e" },
    { id: "lost", label: "Lost", color: "#ef4444" },
  ];

  // Use Krayin-style status mappings
  const statusLabelMap: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    unqualified: "Unqualified",
    converted: "Converted",
    follow_up: "Follow Up",
    prospect: "Prospect",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Nexus Sales CRM Dashboard" />
        <CardContent>
          <Typography>Loading dashboard...</Typography>
        </CardContent>
      </Card>
    );
  }

  const p = metrics.pipeline || {};
  const maxPipelineCount = Math.max(...pipelineStages.map((s) => p[s.id]?.count || 0), 1);

  return (
    <Card>
      <CardHeader title="Nexus Sales CRM Dashboard" />
      <CardContent>
        {/* Metric Cards Row */}
        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} display="flex" gap={2} flexWrap="wrap">
            <MetricCard title="Won Revenue" value={fmt(metrics.wonRevenue || 0)} subtitle="This year" color="success" />
            <MetricCard title="Lost Revenue" value={fmt(metrics.lostRevenue || 0)} color="warning" />
            <MetricCard title="Total Leads" value={metrics.totalLeads || 0} subtitle="Active pipeline" color="info" />
            <MetricCard title="Total Quotes" value={metrics.totalQuotes || 0} color="info" />
            <MetricCard title="Avg Lead Value" value={fmt(metrics.avgLeadValue || 0)} color="info" />
          </Grid>
        </Grid>

        {/* Pipeline Summary */}
        <Grid container spacing={3} sx={{ marginBottom: 2 }}>
          {pipelineStages.map((stage) => {
            const stageData = p[stage.id] || { count: 0, value: 0 };
            const progressPercent = (stageData.count / maxPipelineCount) * 100;
            return (
              <Grid item xs={12} md={2} key={stage.id}>
                <Paper sx={{ p: 2, backgroundColor: "#fff", textAlign: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {stage.label}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: stage.color, mt: 0.5 }}
                  >
                    {stageData.count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {fmt(stageData.value)}
                  </Typography>
                  <Box sx={{ height: 4, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                    <Box
                      sx={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        backgroundColor: stage.color,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>

        {/* Revenue Breakdown */}
        <Grid container spacing={3} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Won Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#22c55e", mt: 0.5 }}>
                {fmt(metrics.wonRevenue || 0)}
              </Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${metrics.conversionRate || 0}%`,
                    height: "100%",
                    backgroundColor: "#22c55e",
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Lost Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#ef4444", mt: 0.5 }}>
                {fmt(metrics.lostRevenue || 0)}
              </Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${100 - (metrics.conversionRate || 0)}%`,
                    height: "100%",
                    backgroundColor: "#ef4444",
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">
                Conversion Rate
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#3b82f1", mt: 0.5 }}>
                {metrics.conversionRate || 0}%
              </Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box
                  sx={{
                    width: `${metrics.conversionRate || 0}%`,
                    height: "100%",
                    backgroundColor: "#3b82f1",
                    borderRadius: 4,
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Tables Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Leads
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Company</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLeads.map((lead: any) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.company || "-"}</TableCell>
                      <TableCell>
                        {lead.first_name} {lead.last_name}
                      </TableCell>
                      <TableCell>{lead.score || 0}</TableCell>
                      <TableCell>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Quotes
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Quote #</TableCell>
                    <TableCell>Account</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentQuotes.map((quote: any) => (
                    <TableRow key={quote.id} hover>
                      <TableCell>{quote.quote_number || "-"}</TableCell>
                      <TableCell>{accountsMap[quote.account_id] || "-"}</TableCell>
                      <TableCell>
                        {quote.total_amount
                          ? `$${parseFloat(quote.total_amount).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {quote.quote_date ? new Date(quote.quote_date).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
