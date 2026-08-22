import {
  List,
  Datagrid,
  TextField,
  DateField,
  Edit,
  EditButton,
  Filter,
  TextInput,
} from "react-admin";
import { StatusField } from "../components/StatusBadge";

const EmailsFilter = (props: any) => (
  <Filter {...props}>
    <TextInput label="Subject" source="subject" type="search" placeholder="Search subjects..." />
    <TextInput label="From" source="from" type="search" placeholder="from@example.com..." />
    <TextInput label="Folder" source="folder" type="search" />
  </Filter>
);

export const EmailsList = (props: any) => (
  <List {...props} title="Emails" exporter={false} filters={<EmailsFilter />}>
    <Datagrid rowClick="edit" bulkActionButtons={false} expandable={<EmailsBody />}>
      <StatusField source="direction" type="email_direction" />
      <StatusField source="is_read" type="read_status" />
      <TextField source="subject" />
      <TextField source="from" />
      <DateField source="sent_at" showTime />
      <DateField source="received_at" showTime />
      <EditButton />
    </Datagrid>
  </List>
);

const EmailsBody = (record: any) => {
  if (!record) return null;
  return (
    <div style={{ padding: "10px 0" }}>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem", maxWidth: "100%" }}>
        {record.body || "(No body text available)"}
      </pre>
    </div>
  );
};

export const EmailsEdit = (props: any) => (
  <Edit {...props} title="View Email">
    <Datagrid>
      <TextField source="direction" />
      <TextField source="is_read" />
      <TextField source="subject" />
      <TextField source="from" />
      <TextField source="to" />
      <TextField source="cc" />
      <DateField source="sent_at" showTime />
      <DateField source="received_at" showTime />
      <TextField source="folder" />
      <StatusField source="related_to_table" type="related_record" />
      <TextField source="related_to_id" />
    </Datagrid>
  </Edit>
);
