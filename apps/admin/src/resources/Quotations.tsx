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
  NumberInput,
  DateInput,
  Toolbar,
  SaveButton,
  DeleteButton,
  useRecordContext,
  useListContext,
} from "react-admin";
import { NumberField } from "react-admin";

// Quotations resource following PRD Section 7.1
export const QuotationsList = (props: any) => (
  <List {...props} title="Quotations" exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="quote_number" />
      <ReferenceField source="account_id" reference="accounts" link={false}>
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="opportunity_id" reference="opportunities" link={false}>
        <TextField source="name" />
      </ReferenceField>
            <TextField source="currency" />
            <TextField source="status" />
      <NumberField source="total_amount" options={{ style: "currency", currency: "AED" }} />
      <DateField source="quote_date" />
      <DateField source="valid_until" />
            <TextField source="approval_status" />
      <DateField source="sent_at" />
      <DateField source="accepted_at" />
    </Datagrid>
  </List>
);

const QuoteToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton saveOnEnter={false} />
    <DeleteButton />
  </Toolbar>
);

// Line Items field components
const QuoteLineItems = () => {
  const record = useRecordContext();
  if (!record?.line_items) return null;
  
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Unit Price</th>
            <th className="text-right py-1">Tax</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {record.line_items.map((item: any, i: number) => (
            <tr key={i}>
              <td className="py-1">{item.description}</td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">{item.unit_price}</td>
              <td className="text-right py-1">{item.tax_rate}%</td>
              <td className="text-right py-1">{item.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const QuotationsCreate = (props: any) => (
  <Create {...props} title="Create Quotation">
    <SimpleForm toolbar={<QuoteToolbar />} fullWidth>
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="account_id" reference="accounts" link={false}>
          <SelectInput
            source="account_id"
            label="Customer"
            optionText="name"
            optionValue="id"
            isRequired
          />
        </ReferenceInput>
        <ReferenceInput source="opportunity_id" reference="opportunities" link={false}>
          <SelectInput
            source="opportunity_id"
            label="Opportunity"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
      </div>

      {/* Quote Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput source="quote_date" label="Quote Date" defaultValue={new Date().toISOString()} />
        <DateInput source="valid_until" label="Valid Until" />
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
          isRequired
        />
      </div>

      {/* Line Items Section - using ArrayInput would be complex,
          for now showing as informational with totals */}
      <div>
        <label className="block text-sm font-medium mb-2">Line Items</label>
        <p className="text-sm text-muted-foreground mb-2">
          Line items will be added when you convert to order
        </p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Discount Percent</label>
          <NumberInput
            source="discount_percent"
            defaultValue={0}
            parse={(v) => v === '' ? 0 : Number(v)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
          <NumberInput
            source="tax_rate"
            defaultValue={5}
            parse={(v) => v === '' ? 5 : Number(v)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtotal</label>
          <NumberInput source="subtotal" defaultValue={0} disabled />
        </div>
      </div>

      {/* Terms */}
      <TextInput fullWidth source="terms_conditions" label="Terms & Conditions" multiline />
      <TextInput fullWidth source="subject" label="Subject" />
      <TextInput source="body" label="Body / Description" multiline rows={4} />
      <TextInput source="notes" label="Internal Notes" multiline rows={3} />

      {/* Approval */}
      <SelectInput
        source="approval_status"
        label=""
        choices={[
          { id: "pending", name: "Pending Approval" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
        ]}
        defaultValue="pending"
      />
      
      <ReferenceInput source="approved_by" reference="users" link={false}>
        <SelectInput
          source="approved_by"
          label="Approved By"
          optionText={(choice) => choice.full_name || choice.email}
          optionValue="id"
        />
      </ReferenceInput>

      {/* ISO Compliance */}
      <SelectInput
        source="iso_compliance_status"
        label="ISO Compliance"
        choices={[
          { id: "pending", name: "Pending Review" },
          { id: "in_review", name: "In Review" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
        ]}
        defaultValue="pending"
      />
    </SimpleForm>
  </Create>
);

export const QuotationEdit = (props: any) => (
  <Edit {...props} title="Edit Quotation">
    <SimpleForm toolbar={<QuoteToolbar />} fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="account_id" reference="accounts" link={false}>
          <SelectInput
            source="account_id"
            label="Customer"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
        <ReferenceInput source="opportunity_id" reference="opportunities" link={false}>
          <SelectInput
            source="opportunity_id"
            label="Opportunity"
            optionText="name"
            optionValue="id"
          />
        </ReferenceInput>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput source="quote_date" label="Quote Date" />
        <DateInput source="valid_until" label="Valid Until" />
        <SelectInput
          source="currency"
          label="Currency"
          choices={[
            { id: "AED", name: "AED (UAE Dirham)" },
            { id: "USD", name: "USD (US Dollar)" },
            { id: "EUR", name: "EUR (Euro)" },
            { id: "GBP", name: "GBP (British Pound)" },
          ]}
          isRequired
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NumberInput source="discount_percent" label="Discount Percent" />
        <NumberInput source="tax_rate" label="Tax Rate (%)" />
        <NumberInput source="total_amount" label="Total Amount" disabled />
      </div>

      <TextInput fullWidth source="terms_conditions" label="Terms & Conditions" multiline />
      <TextInput fullWidth source="subject" label="Subject" />
      <TextInput source="body" label="Body / Description" multiline rows={4} />
      <TextInput source="notes" label="Internal Notes" multiline rows={3} />

      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "draft", name: "Draft" },
          { id: "sent", name: "Sent" },
          { id: "viewed", name: "Viewed" },
          { id: "accepted", name: "Accepted" },
          { id: "rejected", name: "Rejected" },
          { id: "expired", name: "Expired" },
          { id: "revised", name: "Revised" },
        ]}
        isRequired
      />

      <SelectInput
        source="approval_status"
        label="Approval Status"
        choices={[
          { id: "pending", name: "Pending Approval" },
          { id: "approved", name: "Approved" },
          { id: "rejected", name: "Rejected" },
        ]}
      />
    </SimpleForm>
  </Edit>
);
