import {
  List,
  Datagrid,
  TextField,
  DateField,
  Create,
  Edit,
  SimpleForm,
  TextInput,
  SelectInput,
  ReferenceInput,
  ReferenceField,
  NumberInput,
  DateInput,
  Toolbar,
  SaveButton,
  DeleteButton,
  NumberField,
} from "react-admin";
import { StatusField } from "../components/StatusBadge";

// Inquiries/Opportunities resource following PRD Section 6.2
// Aligned with database schema (opportunities table)
export const InquiriesList = (props: any) => (
  <List {...props} title="Inquiries / Opportunities" exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <ReferenceField source="account_id" reference="accounts" link={false}>
        <TextField source="name" />
      </ReferenceField>
      <StatusField source="stage" type="opportunity_stage" />
      <NumberField source="amount" options={{ style: "currency", currency: "AED" }} />
      <TextField source="currency" />
      <DateField source="expected_close_date" />
      <DateField source="created_at" showTime />
    </Datagrid>
  </List>
);

const InquiryToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton saveOnEnter={false} />
    <DeleteButton />
  </Toolbar>
);

export const InquiriesCreate = (props: any) => (
  <Create {...props} title="Create Inquiry / Opportunity">
    <SimpleForm toolbar={<InquiryToolbar />} fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="lead_id" reference="leads" link={false}>
          <SelectInput
            source="lead_id"
            label="Source Lead"
            optionText={(choice) => `${choice.first_name} ${choice.last_name}`}
            optionValue="id"
          />
        </ReferenceInput>
        <ReferenceInput source="account_id" reference="accounts" link={false}>
          <SelectInput
            source="account_id"
            label="Company"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
      </div>

      <TextInput fullWidth source="name" label="Opportunity Name" isRequired />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectInput
          source="stage"
          label="Stage"
          choices={[
            { id: "prospecting", name: "Prospecting" },
            { id: "qualification", name: "Qualification" },
            { id: "proposal", name: "Proposal" },
            { id: "negotiation", name: "Negotiation" },
            { id: "closed_won", name: "Closed Won" },
            { id: "closed_lost", name: "Closed Lost" },
          ]}
          defaultValue="prospecting"
          isRequired
        />
        <NumberInput source="amount" label="Estimated Value (AED)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectInput
          source="currency"
          label="Currency"
          choices={[
            { id: "AED", name: "AED (UAE Dirham)" },
            { id: "USD", name: "USD (US Dollar)" },
            { id: "EUR", name: "EUR (Euro)" },
            { id: "GBP", name: "GBP (British Pound)" },
          ]}
          defaultValue="AED"
        />
        <NumberInput source="probability" label="Probability (%)" />
        <DateInput source="expected_close_date" label="Expected Close Date" />
      </div>

      <TextInput
        source="description"
        label="Description / Requirements"
        multiline
        rows={4}
      />

      <TextInput
        source="notes"
        label="Internal Notes"
        multiline
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <TextInput
          fullWidth
          source="tags"
          helperText="Comma-separated tags (e.g., urgent, iso-9001, supply)"
        />
      </div>

      <SelectInput
        source="custom_fields.iso_compliance_status"
        label="ISO Compliance Status"
        choices={[
          { id: "pending", name: "Pending Review" },
          { id: "in_review", name: "In Review" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
        ]}
        defaultValue="pending"
      />
      <TextInput
        fullWidth
        source="custom_fields.iso_standards"
        label="ISO Standards Interested"
        helperText="e.g., 9001, 14001, 45001"
      />
    </SimpleForm>
  </Create>
);

// Export aliases matching main.tsx imports
export { InquiriesList as OpportunitiesList, InquiriesCreate as OpportunitiesCreate };

export const InquiriesEdit = (props: any) => (
  <Edit {...props} title="Edit Inquiry / Opportunity">
    <SimpleForm toolbar={<InquiryToolbar />} fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="lead_id" reference="leads" link={false}>
          <SelectInput
            source="lead_id"
            label="Source Lead"
            optionText={(choice) => `${choice.first_name} ${choice.last_name}`}
            optionValue="id"
          />
        </ReferenceInput>
        <ReferenceInput source="account_id" reference="accounts" link={false}>
          <SelectInput
            source="account_id"
            label="Company"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
      </div>

      <TextInput fullWidth source="name" label="Opportunity Name" isRequired />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectInput
          source="stage"
          label="Stage"
          choices={[
            { id: "prospecting", name: "Prospecting" },
            { id: "qualification", name: "Qualification" },
            { id: "proposal", name: "Proposal" },
            { id: "negotiation", name: "Negotiation" },
            { id: "closed_won", name: "Closed Won" },
            { id: "closed_lost", name: "Closed Lost" },
          ]}
          isRequired
        />
        <NumberInput source="amount" label="Estimated Value (AED)" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectInput
          source="currency"
          label="Currency"
          choices={[
            { id: "AED", name: "AED (UAE Dirham)" },
            { id: "USD", name: "USD (US Dollar)" },
            { id: "EUR", name: "EUR (Euro)" },
            { id: "GBP", name: "GBP (British Pound)" },
          ]}
        />
        <NumberInput source="probability" label="Probability (%)" />
        <DateInput source="expected_close_date" label="Expected Close Date" />
      </div>

      <TextInput
        source="description"
        label="Description / Requirements"
        multiline
        rows={4}
      />

      <TextInput
        source="loss_reason"
        label="Loss Reason (if closed lost)"
        multiline
        rows={2}
      />

      <TextInput
        source="notes"
        label="Internal Notes"
        multiline
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <TextInput
          fullWidth
          source="tags"
          helperText="Comma-separated tags"
        />
      </div>

      <SelectInput
        source="custom_fields.iso_compliance_status"
        label="ISO Compliance Status"
        choices={[
          { id: "pending", name: "Pending Review" },
          { id: "in_review", name: "In Review" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
        ]}
      />
      <TextInput
        fullWidth
        source="custom_fields.iso_standards"
        label="ISO Standards Interested"
      />
    </SimpleForm>
  </Edit>
);

// Export alias
export { InquiriesEdit as OpportunitiesEdit };
