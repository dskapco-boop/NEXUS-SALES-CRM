import { Card, CardContent, CardHeader, Typography, Grid, Paper, Box } from "@mui/material";
import { List, Datagrid, TextField, NumberField, DateField, ReferenceField } from "react-admin";

// Krayin-style dashboard: metric cards + data tables
// Using simple metrics instead of charts (recharts not installed)

export const Dashboard = () => {
  return (
    <Card>
      <CardHeader title="Nexus Sales CRM Dashboard" />
      <CardContent>
        {/* Metric Cards Row */}
        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} display="flex" gap={2} flexWrap="wrap">
            <MetricCard title="Won Revenue" value="$2,760,000" subtitle="This year" color="success" />
            <MetricCard title="Lost Revenue" value="$70,000" color="warning" />
            <MetricCard title="Total Leads" value="31" subtitle="Active pipeline" color="info" />
            <MetricCard title="Total Quotes" value="9" color="info" />
            <MetricCard title="Avg Lead Value" value="$150,451" color="info" />
          </Grid>
        </Grid>

        {/* Pipeline Summary */}
        <Grid container spacing={3} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, backgroundColor: "#fff", textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">New</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#3b82f1" }}>6</Typography>
              <Typography variant="body2" color="text.secondary">$1,270,000</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, backgroundColor: "#fff", textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">Follow Up</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#f59e0b" }}>3</Typography>
              <Typography variant="body2" color="text.secondary">$144,000</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, backgroundColor: "#fff", textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">Prospect</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#a78bfa" }}>3</Typography>
              <Typography variant="body2" color="text.secondary">$260,000</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, backgroundColor: "#fff", textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">Negotiation</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#8b5cf6" }}>2</Typography>
              <Typography variant="body2" color="text.secondary">$160,000</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Revenue Breakdown */}
        <Grid container spacing={3} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">Won Revenue</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#22c55e" }}>$2,760,000</Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box sx={{ width: "75%", height: "100%", backgroundColor: "#22c55e", borderRadius: 4 }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">Lost Revenue</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#ef4444" }}>$70,000</Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box sx={{ width: "3%", height: "100%", backgroundColor: "#ef4444", borderRadius: 4 }} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle2" color="text.secondary">Conversion Rate</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#3b82f1" }}>65%</Typography>
              <Box sx={{ mt: 1, height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <Box sx={{ width: "65%", height: "100%", backgroundColor: "#3b82f1", borderRadius: 4 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Tables Row */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>Recent Leads</Typography>
              <List exporter={false} bulkActionButtons={false} perPage={5} pagination={false}>
                <Datagrid rowClick="edit" empty={false}>
                  <TextField source="company" />
                  <TextField source="first_name" />
                  <NumberField source="score" />
                  <DateField source="created_at" showTime />
                </Datagrid>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>Recent Quotes</Typography>
              <List exporter={false} bulkActionButtons={false} perPage={5} pagination={false}>
                <Datagrid rowClick="edit" empty={false}>
                  <TextField source="quote_number" />
                  <ReferenceField source="account_id" reference="accounts" link={false}>
                    <TextField source="name" />
                  </ReferenceField>
                  <NumberField source="total_amount" options={{ style: "currency", currency: "AED" }} />
                  <DateField source="quote_date" />
                </Datagrid>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const MetricCard = ({ title, value, subtitle, color = "default" }: any) => {
  const colorMap: Record<string, string> = {
    default: "#6b7280",
    success: "#22c55e",
    warning: "#f59e0b",
    info: "#3b82f1",
    error: "#ef4444",
  };

  return (
    <Card sx={{ flexGrow: 1, minWidth: 120, backgroundColor: "#fff" }}>
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
