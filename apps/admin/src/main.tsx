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

import "./index.css";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Admin
      dataProvider={supabaseDataProvider}
      authProvider={authProvider}
      title="Nexus CRM"
    >
      <Resource name="leads" list={LeadsList} create={LeadCreate} edit={LeadsEdit} />
      <Resource name="opportunities" list={InquiriesList} create={InquiriesCreate} edit={InquiriesEdit} />
      <Resource name="quotes" list={QuotationsList} create={QuotationsCreate} edit={QuotationEdit} />
      <Resource name="sales_orders" list={SalesOrdersList} edit={SalesOrdersEdit} />
      <Resource name="invoices" list={InvoicesList} edit={InvoicesEdit} />
    </Admin>
  </React.StrictMode>,
);
