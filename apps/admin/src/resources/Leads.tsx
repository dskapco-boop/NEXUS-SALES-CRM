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

// Krayin-style pipeline stages: New → Follow Up → Prospect → Negotiation → Won → Lost
const PIPELINE_STAGES = [
  { id: "new", label: "New", color: "#3b82f1" },
  { id: "follow_up", label: "Follow Up", color: "#a78bfa" },
  { id: "prospect", label: "Prospect", color: "#f59e0b" },
  { id: "negotiation", label: "Negotiation", color: "#8b5cf6" },
  { id: "won", label: "Won", color: "#22c55e" },
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
