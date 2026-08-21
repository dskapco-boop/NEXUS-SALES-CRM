import { Card, CardContent, CardHeader, Typography, Grid, Paper, Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@nexus-crm/api";

// Krayin-style dashboard: metric cards + data tables
// Uses Supabase directly to avoid react-admin context issues
const supabase = getSupabaseClient();

export const Dashboard = () => {
  const [metrics, setMetrics] = useState<any>({});
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [accountsMap, setAccountsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch recent leads (5 most recent)
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id,first_name,last_name,company,status,source,score,created_at,custom_fields")
          .order("created_at", { ascending: false })
          .limit(5);
        setRecentLeads(leads || []);

        // Fetch all leads for metrics
        const { data: allLeads, error: allLeadsError } = await supabase
          .from("leads")
          .select("id,status,custom_fields");
        const leadsData = allLeads || [];

        // Fetch all opportunities
        const { data: allOpps } = await supabase
          .from("opportunities")
          .select("id,stage,amount");
        const oppsData = allOpps || [];

        // Fetch all quotes
        const { data: allQuotes } = await supabase
          .from("quotes")
          .select("id");
        const quotesData = allQuotes || [];

        // Fetch recent quotes (5)
        const { data: recQuotes } = await supabase
          .from("quotes")
          .select("id,quote_number,account_id,total_amount,quote_date")
          .order("quote_date", { ascending: false })
          .limit(5);
        setRecentQuotes(recQuotes || []);

        // Fetch accounts for name lookup
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id,name");
        const accMap: Record<string, string> = {};
        (accounts || []).forEach((a: any) => { accMap[a.id] = a.name; });
        setAccountsMap(accMap);

        // Calculate pipeline stats
        const pipelineByStage: Record<string, { count: number; value: number }> = {};
        leadsData.forEach((lead: any) => {
          const stage = lead.status || "new";
          if (!pipelineByStage[stage]) pipelineByStage[stage] = { count: 0, value: 0 };
          pipelineByStage[stage].count += 1;
          const val = parseFloat(lead.custom_fields?.estimated_value || 0);
          pipelineByStage[stage].value += isNaN(val) ? 0 : val;
        });

        // Calculate won/lost revenue
        const wonRevenue = oppsData
          .filter((o: any) => o.stage === "closed_won" || o.stage === "won")
          .reduce((sum: number, o: any) => sum + parseFloat(o.amount || 0), 0);
        const lostRevenue = oppsData
          .filter((o: any) => o.stage === "closed_lost" || o.stage === "lost")
          .reduce((sum: number, o: any) => sum + parseFloat(o.amount || 0), 0);

        const wonOpps = oppsData.filter((o: any) => o.stage === "closed_won" || o.stage === "won").length;
        const totalOpps = oppsData.length;
        const conversionRate = totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 100) : 0;

        const totalLeadValue = leadsData.reduce((sum: number, l: any) => {
          const val = parseFloat(l.custom_fields?.estimated_value || 0);
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        const avgLeadValue = leadsData.length > 0 ? Math.round(totalLeadValue / leadsData.length) : 0;

        setMetrics({
          wonRevenue,
          lostRevenue,
          totalLeads: leadsData.length,
          totalQuotes: quotesData.length,
          avgLeadValue,
          conversionRate,
          pipeline: pipelineByStage,
          totalOpportunities: totalOpps,
          wonOpportunities: wonOpps,
        });
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fmt = (n: number) => `${n.toLocaleString()} د.إ`;

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

  if (loading) {
    return (
      <Card>
        <CardHeader title="Nexus CRM" />
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
      <CardHeader title="Nexus CRM" />
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
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stage.color, mt: 0.5 }}>
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
                          ? `${parseFloat(quote.total_amount).toLocaleString()} د.إ`
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
