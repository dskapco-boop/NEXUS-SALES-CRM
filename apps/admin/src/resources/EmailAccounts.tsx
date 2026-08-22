import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  NumberInput,
  BooleanInput,
  EditButton,
  DeleteButton,
} from "react-admin";
import { StatusField } from "../components/StatusBadge";

// Email Accounts resource
export const EmailAccountsList = (props: any) => (
  <List {...props} title="Email Accounts" exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="email" />
      <TextField source="display_name" />
      <TextField source="provider_type" />
      <TextField source="connection_status" />
      <DateField source="last_sync_at" />
      <TextField source="sync_frequency_minutes" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const EmailAccountsCreate = (props: any) => (
  <Create {...props} title="Add Email Account">
    <SimpleForm>
      <TextInput source="email" label="Email Address" fullWidth />
      <TextInput source="display_name" label="Display Name" />
      <SelectInput
        source="provider_type"
        label="Provider"
        choices={[
          { id: "imap", name: "IMAP (Custom)" },
          { id: "gmail", name: "Gmail" },
          { id: "outlook", name: "Outlook/Hotmail" },
        ]}
        defaultValue="imap"
      />
      <TextInput source="imap_host" label="IMAP Host" />
      <NumberInput source="imap_port" label="IMAP Port" />
      <SelectInput
        source="imap_encryption"
        label="IMAP Encryption"
        choices={[
          { id: "tls", name: "TLS" },
          { id: "starttls", name: "STARTTLS" },
          { id: "none", name: "None" },
        ]}
      />
      <TextInput source="smtp_host" label="SMTP Host" />
      <NumberInput source="smtp_port" label="SMTP Port" />
      <SelectInput
        source="smtp_encryption"
        label="SMTP Encryption"
        choices={[
          { id: "tls", name: "TLS" },
          { id: "starttls", name: "STARTTLS" },
          { id: "none", name: "None" },
        ]}
      />
      <SelectInput
        source="sync_frequency_minutes"
        label="Sync Frequency"
        choices={[
          { id: 0, name: "Manual Only" },
          { id: 5, name: "Every 5 minutes" },
          { id: 15, name: "Every 15 minutes" },
          { id: 30, name: "Every 30 minutes" },
          { id: 60, name: "Every hour" },
        ]}
        defaultValue={15}
      />
      <BooleanInput source="sync_enabled" label="Enable Sync" defaultValue={true} />
    </SimpleForm>
  </Create>
);

export const EmailAccountsEdit = (props: any) => (
  <Edit {...props} title="Edit Email Account">
    <SimpleForm>
      <TextInput disabled source="id" label="ID" />
      <TextInput source="email" label="Email Address" fullWidth />
      <TextInput source="display_name" label="Display Name" />
      <SelectInput
        source="provider_type"
        label="Provider"
        choices={[
          { id: "imap", name: "IMAP (Custom)" },
          { id: "gmail", name: "Gmail" },
          { id: "outlook", name: "Outlook/Hotmail" },
        ]}
      />
      <TextInput source="imap_host" label="IMAP Host" />
      <NumberInput source="imap_port" label="IMAP Port" />
      <SelectInput
        source="imap_encryption"
        label="IMAP Encryption"
        choices={[
          { id: "tls", name: "TLS" },
          { id: "starttls", name: "STARTTLS" },
          { id: "none", name: "None" },
        ]}
      />
      <TextInput source="smtp_host" label="SMTP Host" />
      <NumberInput source="smtp_port" label="SMTP Port" />
      <SelectInput
        source="smtp_encryption"
        label="SMTP Encryption"
        choices={[
          { id: "tls", name: "TLS" },
          { id: "starttls", name: "STARTTLS" },
          { id: "none", name: "None" },
        ]}
      />
      <SelectInput
        source="sync_frequency_minutes"
        label="Sync Frequency"
        choices={[
          { id: 0, name: "Manual Only" },
          { id: 5, name: "Every 5 minutes" },
          { id: 15, name: "Every 15 minutes" },
          { id: 30, name: "Every 30 minutes" },
          { id: 60, name: "Every hour" },
        ]}
      />
      <BooleanInput source="sync_enabled" label="Enable Sync" />
      <BooleanInput source="is_active" label="Active" />
      <TextField source="connection_status" />
      <DateField source="last_sync_at" />
    </SimpleForm>
  </Edit>
);
