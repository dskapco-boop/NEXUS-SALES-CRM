import { List, Datagrid, TextField, DateField, Create, Edit, SimpleForm, TextInput, SelectInput, ReferenceInput } from "react-admin";

export const EnquiriesList = (props: any) => (
  <List {...props} title="Enquiries">
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <ReferenceInput source="lead_id" reference="leads" link="false">
        <TextField source="first_name" />
      </ReferenceInput>
      <TextField source="status" />
      <TextField source="notes" />
      <DateField source="created_at" showTime />
    </Datagrid>
  </List>
);

export const EnquiriesCreate = (props: any) => (
  <Create {...props}>
    <SimpleForm>
      <ReferenceInput source="lead_id" reference="leads">
        <SelectInput optionText={(choice) => `${choice.first_name} ${choice.last_name}`} />
      </ReferenceInput>
      <SelectInput source="status" choices={[
        { id: "open", name: "Open" },
        { id: "in_progress", name: "In Progress" },
        { id: "resolved", name: "Resolved" },
        { id: "closed", name: "Closed" },
      ]} />
      <TextInput fullWidth multiline source="notes" />
    </SimpleForm>
  </Create>
);

export const EnquiriesEdit = (props: any) => (
  <Edit {...props}>
    <SimpleForm>
      <ReferenceInput source="lead_id" reference="leads">
        <SelectInput optionText={(choice) => `${choice.first_name} ${choice.last_name}`} />
      </ReferenceInput>
      <SelectInput source="status" choices={[
        { id: "open", name: "Open" },
        { id: "in_progress", name: "In Progress" },
        { id: "resolved", name: "Resolved" },
        { id: "closed", name: "Closed" },
      ]} />
      <TextInput fullWidth multiline source="notes" />
    </SimpleForm>
  </Edit>
);
