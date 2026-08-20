import { 
  List, 
  Datagrid, 
  TextField, 
  DateField, 
  Edit, 
  SimpleForm, 
  TextInput, 
  SelectInput, 
  ReferenceInput, 
  NumberInput,
  DateInput,
  Toolbar,
  SaveButton,
  DeleteButton,
  NumberField,
} from "react-admin";

// Invoices resource following PRD Section 8.3
export const InvoicesList = (props: any) => (
  <List {...props} title="Invoices" exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="invoice_number" />
      <ReferenceInput source="account_id" reference="accounts" link={false}>
        <TextField source="name" />
      </ReferenceInput>
      <ReferenceInput source="sales_order_id" reference="sales_orders" link={false}>
        <TextField source="order_number" />
      </ReferenceInput>
      <SelectInput
        source="currency"
        choices={[
          { id: "AED", name: "AED" },
          { id: "USD", name: "USD" },
          { id: "EUR", name: "EUR" },
          { id: "GBP", name: "GBP" },
        ]}
        optionText={(choice) => choice.name}
        optionValue="id"
        sortable={false}
      />
      <SelectInput
        source="status"
        choices={[
          { id: "draft", name: "Draft" },
          { id: "sent", name: "Sent" },
          { id: "viewed", name: "Viewed" },
          { id: "paid", name: "Paid" },
          { id: "partial", name: "Partial" },
          { id: "overdue", name: "Overdue" },
          { id: "void", name: "Void" },
          { id: "cancelled", name: "Cancelled" },
        ]}
        optionText={(choice) => choice.name}
        optionValue="id"
        sortable={false}
      />
      <NumberField source="total_amount" options={{ style: "currency", currency: "AED" }} />
      <NumberField source="amount_due" options={{ style: "currency", currency: "AED" }} />
      <DateField source="invoice_date" />
      <DateField source="due_date" />
      <DateField source="sent_at" />
      <DateField source="paid_at" />
    </Datagrid>
  </List>
);

const InvoiceToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton saveOnEnter={false} />
    <DeleteButton />
  </Toolbar>
);

export const InvoicesEdit = (props: any) => (
  <Edit {...props} title="Edit Invoice">
    <SimpleForm toolbar={<InvoiceToolbar />} fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="sales_order_id" reference="sales_orders" link={false}>
          <SelectInput
            source="sales_order_id"
            label="Source Order"
            optionText="order_number"
            optionValue="id"
          />
        </ReferenceInput>
        <ReferenceInput source="account_id" reference="accounts" link={false}>
          <SelectInput
            source="account_id"
            label="Customer"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
      </div>

      <TextInput source="invoice_number" label="Invoice Number" fullWidth />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput source="invoice_date" label="Invoice Date" />
        <DateInput source="due_date" label="Due Date" />
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
      </div>

      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "draft", name: "Draft" },
          { id: "sent", name: "Sent" },
          { id: "viewed", name: "Viewed" },
          { id: "partial", name: "Partial Payment" },
          { id: "paid", name: "Paid" },
          { id: "overdue", name: "Overdue" },
          { id: "void", name: "Void" },
          { id: "cancelled", name: "Cancelled" },
        ]}
        isRequired
      />

      <NumberInput source="amount_paid" label="Amount Paid (AED)" />

      <div>
        <label className="block text-sm font-medium mb-1">Billing Address</label>
        <TextInput source="billing_address" multiline rows={3} />
      </div>

      <TextInput source="payment_terms" label="Payment Terms (e.g., Net 30)" />
      <TextInput source="notes" label="Notes" multiline rows={3} />
      <TextInput source="terms_conditions" label="Terms & Conditions" multiline rows={3} />
    </SimpleForm>
  </Edit>
);
