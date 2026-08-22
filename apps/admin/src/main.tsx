import React from "react";
import { createRoot } from "react-dom/client";
import { Admin, Resource, Menu } from "react-admin";
import { Box, ListItemIcon, ListItemText } from "@mui/material";
import { Settings as SettingsIcon, SmartToy as AIIcon, Dashboard as DashboardIcon } from "@mui/icons-material";
import { supabaseDataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import { LeadsList, LeadCreate, LeadsEdit } from "./resources/Leads";
import {
  InquiriesList,
  InquiriesCreate,
  InquiriesEdit,
} from "./resources/Inquiries";
import { QuotationsList, QuotationsCreate, QuotationEdit } from "./resources/Quotations";
import { SalesOrdersList, SalesOrdersEdit } from "./resources/SalesOrders";
import { InvoicesList, InvoicesEdit } from "./resources/Invoices";
import { Dashboard } from "./dashboard/Dashboard";
import { SettingsPage } from "./settings/SettingsPage";
import { AIPage } from "./ai/AIPage";

import "./index.css";

// Custom menu with Settings and AI entries in sidebar
// Uses MUI components wrapped in react-admin's Menu
const CustomMenu = (props: any) => (
  <Menu {...props}>
    <Box component="span" onClick={() => { window.location.hash = "#/dashboard"; }} sx={{ cursor: "pointer", display: "flex", alignItems: "center", px: 2, py: 1.5, borderRadius: 1, "&:hover": { backgroundColor: "action.hover" } }}>
      <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
      <ListItemText primary="Dashboard" />
    </Box>
    <Menu.ResourceItem name="leads" {...props} />
    <Menu.ResourceItem name="opportunities" {...props} />
    <Menu.ResourceItem name="quotes" {...props} />
    <Menu.ResourceItem name="sales_orders" {...props} />
    <Menu.ResourceItem name="invoices" {...props} />
    <Box component="span" onClick={() => { window.location.hash = "#/settings"; }} sx={{ cursor: "pointer", display: "flex", alignItems: "center", px: 2, py: 1.5, borderRadius: 1, "&:hover": { backgroundColor: "action.hover" } }}>
      <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
      <ListItemText primary="Settings" />
    </Box>
    <Box component="span" onClick={() => { window.location.hash = "#/ai"; }} sx={{ cursor: "pointer", display: "flex", alignItems: "center", px: 2, py: 1.5, borderRadius: 1, "&:hover": { backgroundColor: "action.hover" } }}>
      <ListItemIcon><AIIcon fontSize="small" /></ListItemIcon>
      <ListItemText primary="AI Functions" />
    </Box>
  </Menu>
);

// Krayin-inspired theme: blue primary (#3b82f1), clean sidebar
const krayinTheme = {
  palette: {
    primary: { main: "#3b82f1", contrastText: "#ffffff" },
    secondary: { main: "#6366f1", contrastText: "#ffffff" },
  },
  sidebar: {
    width: 240,
    narrowWidth: 60,
  },
  components: {
    RaSidebar: {
      styleOverrides: {
        fixed: {
          zIndex: 100,
        },
      },
    },
  },
};

// Krayin-inspired dark theme
const darkTheme = {
  palette: {
    mode: "dark" as "dark",
    primary: { main: "#3b82f1", contrastText: "#ffffff" },
    secondary: { main: "#6366f1", contrastText: "#ffffff" },
    background: {
      default: "#1a1a2e",
      paper: "#16213e",
    },
  },
  sidebar: {
    width: 240,
    narrowWidth: 60,
  },
};

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Admin
      dataProvider={supabaseDataProvider}
      authProvider={authProvider}
      title="Nexus CRM"
      theme={krayinTheme}
      darkTheme={darkTheme}
      dashboard={Dashboard}
      customRoutes={[
        { path: "/settings", component: SettingsPage },
        { path: "/ai", component: AIPage },
      ]}
      menu={CustomMenu}
    >
      <Resource name="leads" list={LeadsList} create={LeadCreate} edit={LeadsEdit} />
      <Resource name="opportunities" list={InquiriesList} create={InquiriesCreate} edit={InquiriesEdit} />
      <Resource name="quotes" list={QuotationsList} create={QuotationsCreate} edit={QuotationEdit} />
      <Resource name="sales_orders" list={SalesOrdersList} edit={SalesOrdersEdit} />
      <Resource name="invoices" list={InvoicesList} edit={InvoicesEdit} />
    </Admin>
  </React.StrictMode>,
);
