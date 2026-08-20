import { Card, CardContent, CardHeader, Typography, Grid, Paper } from "@mui/material";
import { useListContext, useNotify, List, Datagrid, TextField, NumberField, DateField, ReferenceField } from "react-admin";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, } from "recharts";

// Krayin-style dashboard: metric cards + charts at the top, tables below
const data = [
  { name: "Jan", leads: 4, won: 2, lost: 1 },
  { name: "Feb", leads: 7, won: 3, lost: 2 },
  { name: "Mar", leads: 5, won: 4, lost: 1 },
  { name: "Apr", leads: 10, won: 6, lost: 2 },
  { name: "May", leads: 8, won: 5, lost: 3 },
  { name: "Jun", leads: 6, won: 4, lost: 2 },
  { name: "Jul", leads: 12, won: 7, lost: 3 },
  { name: "Aug", leads: 18, won: 10, lost: 5 },
  { name: "Sep", leads: 9, won: 6, lost: 2 },
  { name: "Oct", leads: 7, won: 5, lost: 3 },
  { name: "Nov", leads: 11, won: 8, lost: 1 },
  { name: "Dec", leads: 14, won: 9, lost: 4 },
];

const revenueData = [
  { name: "Existing Business", value: 2290000 },
  { name: "New Business", value: 320000 },
  { name: "Service Business", value: 150000 },
];

const leadSourceData = [
  { name: "Website", value: 45 },
  { name: "Email", value: 25 },
  { name: "Referral", value: 18 },
  { name: "Cold Call", value: 12 },
};

const leadSourceColors = ["#a78bfa", "#f472b6", "#2dd36f", "#fb92b2"];
const revenueColors = ["#a78bfa", "#f472b6", "#2dd36f"];

const MetricCard = ({ title, value, subtitle, color = "default" }: any) => {
  const colorMap = {
    default: "#6b7280",
    success: "#22c55e",
    warning: "#f59e0b",
    info: "#3b82f1",
  };

  return (
    <Card sx={{ flexGrow: 1, minWidth: 120, backgroundColor: "#fff" }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary" display="block">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colorMap[color as keyof typeof colorMap] }}>
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

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ marginBottom: 2 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>Leads Over Time</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="#a78bfa" name="Total Leads" />
                  <Bar dataKey="won" fill="#22c55e" name="Won" />
                  <Bar dataKey="lost" fill="#ef4444" name="Lost" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: "#fff" }}>
              <Typography variant="subtitle1" gutterBottom>Revenue By Types</Typography>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={revenueData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {revenueData.map((_, i) => <Cell key={`cell-${i}`} fill={revenueColors[i % revenueColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
            <br />
            <Paper sx={{ p: 2, backgroundColor: "#fff", marginTop: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Lead Sources</Typography>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={leadSourceData} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {leadSourceData.map((_, i) => <Cell key={`cell-${i}`} fill={leadSourceColors[i % leadSourceColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
