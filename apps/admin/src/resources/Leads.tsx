import React, { useState } from "react";
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  TextInput,
  SelectInput,
  DateField,
  NumberField,
  NumberInput,
  Create,
  Edit,
  SimpleForm,
  useNotify,
  useRefresh,
  TopToolbar,
  CreateButton,
  FilterButton,
  ExportButton,
  Button,
  useListContext,
  EditButton,
  DeleteButton,
} from "react-admin";
import { StatusField } from "../components/StatusBadge";
import { KanbanBoard } from "./KanbanBoard";
import { Box } from "@mui/material";

// Pipeline stages matching Krayin's lead pipeline
const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "#3b82f1" },
  { id: "contacted", label: "Contacted", color: "#a78bfa" },
  { id: "qualified", label: "Qualified", color: "#22c55e" },
  { id: "unqualified", label: "Unqualified", color: "#f59e0b" },
  { id: "converted", label: "Converted", color: "#22c55e" },
  { id: "lost", label: "Lost", color: "#ef4444" },
];

// Custom toolbar with view toggle (Table / Kanban)
const LeadsTopToolbar = ({ showKanban, setShowKanban }: any) => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
    <Button
      label={showKanban ? "Table" : "Kanban"}
      onClick={() => setShowKanban(!showKanban)}
      size="small"
    />
  </TopToolbar>
);

// Table view for Leads
const LeadsTableView = () => (
  <Datagrid rowClick="edit" bulkActionButtons={false}>
    <TextField source="company" />
    <TextField source="first_name" />
    <TextField source="last_name" />
    <NumberField source="score" />
    <StatusField source="status" type="lead_status" />
    <DateField source="created_at" showTime />
  </Datagrid>
);

// Lead card component for Kanban - matches Krayin's card style
const LeadCard = ({ lead, onClick }: any) => {
  const initials = `${lead.first_name?.charAt(0) || ""}${lead.last_name?.charAt(0) || ""}`.toUpperCase() || "??";
  const avatarBg = `hsl(${Math.random() * 360}, 70%, 80%)`;

  // Status dot colors
  const statusColors: Record<string, string> = {
    new: "#3b82f1",
    contacted: "#a78bfa",
    qualified: "#22c55e",
    unqualified: "#f59e0b",
    converted: "#22c55e",
    lost: "#ef4444",
  };

  const urgencyColors: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const urgencyLabels: Record<string, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const statusColor = statusColors[lead.status] || "#6b7280";
  const urgency = lead.custom_fields?.urgency;
  const urgencyColor = urgencyColors[urgency] || "#6b7280";
  const isUrgent = urgency === "urgent";

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#fff",
        border: isUrgent ? "2px solid #ef4444" : "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        cursor: "pointer",
        boxShadow: isUrgent ? "0 2px 4px rgba(239, 68, 68, 0.2)" : "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header row: avatar + name + urgency badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: avatarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.company}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              {lead.first_name} {lead.last_name}
              {lead.job_title && ` • ${lead.job_title}`}
            </div>
          </div>
        </div>

        {isUrgent && (
          <div
            style={{
              backgroundColor: urgencyColor,
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {urgencyLabels[urgency]}
          </div>
        )}
      </div>

      {/* Status section */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: statusColor }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{PIPELINE_STAGES.find((s) => s.id === lead.status)?.label || lead.status}</span>
      </div>

      {/* Metadata */}
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        {lead.source && <div>📊 {lead.source.replace("_", " ")}</div>}
        {lead.score !== undefined && <div>🎯 AI Score: {lead.score}/100</div>}
      </div>

      {/* Tags */}
      {lead.custom_fields?.iso_standards && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
          <span
            style={{
              fontSize: 10,
              backgroundColor: "#f3f4f6",
              color: "#4b5563",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ISO {lead.custom_fields.iso_standards}
          </span>
        </div>
      )}

      {/* Created date */}
      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6, textAlign: "right" }}>
        {new Date(lead.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

// Main Leads List with Kanban/Table toggle
export const LeadsList = (props: any) => {
  const [showKanban, setShowKanban] = useState(false);
  const listContext = useListContext();

  if (showKanban) {
    return (
      <div>
        <LeadsTopToolbar showKanban={showKanban} setShowKanban={setShowKanban} />
        <Box sx={{ p: 2 }}>
          <KanbanBoard
            data={listContext.data}
            stages={PIPELINE_STAGES}
            onEdit={(id: string) => {
              window.location.hash = `#/leads/${id}`;
            }}
          />
        </Box>
      </div>
    );
  }

  return (
    <List {...props} title="Leads" exporter={false}>
      <LeadsTopToolbar showKanban={showKanban} setShowKanban={setShowKanban} />
      <Datagrid rowClick="edit" bulkActionButtons={false}>
        <TextField source="company" />
        <TextField source="first_name" />
        <TextField source="last_name" />
        <NumberField source="score" />
        <StatusField source="status" type="lead_status" />
        <DateField source="created_at" showTime />
        <EditButton />
        <DeleteButton />
      </Datagrid>
    </List>
  );
};

export const LeadCreate = (props: any) => (
  <Create {...props} title="Create New Lead">
    <SimpleForm fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="first_name" label="First Name" isRequired />
        <TextInput fullWidth source="last_name" label="Last Name" isRequired />
        <TextInput fullWidth source="email" type="email" label="Email" />
        <TextInput fullWidth source="phone" label="Phone" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="mobile" label="Mobile" />
        <TextInput fullWidth source="job_title" label="Job Title" />
        <TextInput fullWidth source="company" label="Company" isRequired />
      </div>

      <SelectInput
        source="source"
        label="Lead Source"
        choices={[
          { id: "website", name: "Website" },
          { id: "referral", name: "Referral" },
          { id: "cold_call", name: "Cold Call" },
          { id: "email", name: "Email" },
          { id: "social", name: "Social Media" },
          { id: "event", name: "Event" },
          { id: "other", name: "Other" },
        ]}
        isRequired
      />

      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "new", name: "New" },
          { id: "contacted", name: "Contacted" },
          { id: "qualified", name: "Qualified" },
          { id: "unqualified", name: "Unqualified" },
          { id: "converted", name: "Converted" },
          { id: "lost", name: "Lost" },
        ]}
        isRequired
      />

      <TextInput fullWidth source="custom_fields.industry" label="Industry" />
      <NumberInput source="custom_fields.estimated_value" label="Estimated Value (AED)" />
      <SelectInput
        source="custom_fields.urgency"
        label="Urgency"
        choices={[
          { id: "urgent", name: "Urgent" },
          { id: "high", name: "High" },
          { id: "medium", name: "Medium" },
          { id: "low", name: "Low" },
        ]}
      />
      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={4}
        fullWidth
      />

      <h3 className="text-lg font-medium mt-4 mb-2">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="address.city" label="City" />
        <TextInput fullWidth source="address.state" label="Emirate" />
        <TextInput fullWidth source="address.country" label="Country" />
        <TextInput fullWidth source="address.postal_code" label="Postal Code" />
        <TextInput fullWidth source="address.street" label="Street Address" />
      </div>

      <h3 className="text-lg font-medium mt-4 mb-2">ISO Consultancy Details (Optional)</h3>
      <TextInput fullWidth source="custom_fields.iso_standards" label="ISO Standards Interested" helperText="e.g., 9001, 14001" />
      <SelectInput
        source="custom_fields.iso_project_type"
        label="ISO Project Type"
        choices={[
          { id: "implementation", name: "Implementation" },
          { id: "gap_analysis", name: "Gap Analysis" },
          { id: "internal_audit", name: "Internal Audit" },
          { id: "certification", name: "Certification" },
          { id: "training", name: "Training" },
        ]}
      />
      <TextInput fullWidth source="custom_fields.iso_budget_range" label="ISO Budget Range (AED)" />
    </SimpleForm>
  </Create>
);

export const LeadsEdit = (props: any) => (
  <Edit {...props} title="Edit Lead">
    <SimpleForm fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="first_name" label="First Name" isRequired />
        <TextInput fullWidth source="last_name" label="Last Name" isRequired />
        <TextInput fullWidth source="email" type="email" label="Email" />
        <TextInput fullWidth source="phone" label="Phone" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="mobile" label="Mobile" />
        <TextInput fullWidth source="job_title" label="Job Title" />
        <TextInput fullWidth source="company" label="Company" isRequired />
      </div>

      <SelectInput
        source="source"
        label="Lead Source"
        choices={[
          { id: "website", name: "Website" },
          { id: "referral", name: "Referral" },
          { id: "cold_call", name: "Cold Call" },
          { id: "email", name: "Email" },
          { id: "social", name: "Social Media" },
          { id: "event", name: "Event" },
          { id: "other", name: "Other" },
        ]}
        isRequired
      />

      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "new", name: "New" },
          { id: "contacted", name: "Contacted" },
          { id: "qualified", name: "Qualified" },
          { id: "unqualified", name: "Unqualified" },
          { id: "converted", name: "Converted" },
          { id: "lost", name: "Lost" },
        ]}
        isRequired
      />

      <TextInput fullWidth source="custom_fields.industry" label="Industry" />
      <NumberInput source="custom_fields.estimated_value" label="Estimated Value (AED)" />
      <SelectInput
        source="custom_fields.urgency"
        label="Urgency"
        choices={[
          { id: "urgent", name: "Urgent" },
          { id: "high", name: "High" },
          { id: "medium", name: "Medium" },
          { id: "low", name: "Low" },
        ]}
      />
      <NumberInput source="score" label="AI Lead Score" />
      <TextInput
        source="notes"
        label="Notes"
        multiline
        rows={4}
        fullWidth
      />

      <h3 className="text-lg font-medium mt-4 mb-2">Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput fullWidth source="address.city" label="City" />
        <TextInput fullWidth source="address.state" label="Emirate" />
        <TextInput fullWidth source="address.country" label="Country" />
        <TextInput fullWidth source="address.postal_code" label="Postal Code" />
        <TextInput fullWidth source="address.street" label="Street Address" />
      </div>

      <h3 className="text-lg font-medium mt-4 mb-2">ISO Consultancy Details (Optional)</h3>
      <TextInput fullWidth source="custom_fields.iso_standards" label="ISO Standards Interested" />
      <SelectInput
        source="custom_fields.iso_project_type"
        label="ISO Project Type"
        choices={[
          { id: "implementation", name: "Implementation" },
          { id: "gap_analysis", name: "Gap Analysis" },
          { id: "internal_audit", name: "Internal Audit" },
          { id: "certification", name: "Certification" },
          { id: "training", name: "Training" },
        ]}
      />
      <TextInput fullWidth source="custom_fields.iso_budget_range" label="ISO Budget Range (AED)" />
    </SimpleForm>
  </Edit>
);
