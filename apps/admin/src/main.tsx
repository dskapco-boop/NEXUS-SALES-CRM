import React from "react";
import { createRoot } from "react-dom/client";
import { Admin, Resource } from "react-admin";
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

import "./index.css";

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
    mode: "dark",
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
    >
      <Resource name="leads" list={LeadsList} create={LeadCreate} edit={LeadsEdit} />
      <Resource name="opportunities" list={InquiriesList} create={InquiriesCreate} edit={InquiriesEdit} />
      <Resource name="quotes" list={QuotationsList} create={QuotationsCreate} edit={QuotationEdit} />
      <Resource name="sales_orders" list={SalesOrdersList} edit={SalesOrdersEdit} />
      <Resource name="invoices" list={InvoicesList} edit={InvoicesEdit} />
    </Admin>
  </React.StrictMode>,
);
