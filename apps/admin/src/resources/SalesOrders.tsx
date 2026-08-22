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
  ReferenceField,
  NumberInput,
  DateInput,
  Toolbar,
  SaveButton,
  DeleteButton,
  EditButton,
  NumberField,
} from "react-admin";
import { StatusField } from "../components/StatusBadge";

// Sales Orders resource following PRD Section 7.2
export const SalesOrdersList = (props: any) => (
  <List {...props} title="Sales Orders" exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="order_number" />
      <ReferenceField source="account_id" reference="accounts" link={false}>
        <TextField source="name" />
      </ReferenceField>
      <ReferenceField source="quote_id" reference="quotes" link={false}>
        <TextField source="quote_number" />
      </ReferenceField>
      <StatusField source="status" type="order_status" />
      <NumberField source="total_amount" options={{ style: "currency", currency: "AED" }} />
      <DateField source="order_date" />
      <DateField source="expected_ship_date" />
      <DateField source="shipped_date" />
      <DateField source="delivered_date" />
      <TextField source="tracking_number" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

const OrderToolbar = (props: any) => (
  <Toolbar {...props}>
    <SaveButton saveOnEnter={false} />
    <DeleteButton />
  </Toolbar>
);

export const SalesOrdersEdit = (props: any) => (
  <Edit {...props} title="Edit Sales Order">
    <SimpleForm toolbar={<OrderToolbar />} fullWidth>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReferenceInput source="quote_id" reference="quotes" link={false}>
          <SelectInput
            source="quote_id"
            label="Source Quote"
            optionText="quote_number"
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

      <TextInput source="order_number" label="Order Number" fullWidth />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DateInput source="order_date" label="Order Date" />
        <DateInput source="expected_ship_date" label="Expected Ship Date" />
        <DateInput source="shipped_date" label="Shipped Date" />
      </div>

      <DateInput source="delivered_date" label="Delivered Date" />

      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "draft", name: "Draft" },
          { id: "confirmed", name: "Confirmed" },
          { id: "processing", name: "Processing" },
          { id: "shipped", name: "Shipped" },
          { id: "delivered", name: "Delivered" },
          { id: "cancelled", name: "Cancelled" },
        ]}
        isRequired
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NumberInput source="subtotal" label="Subtotal (AED)" />
        <NumberInput source="tax_amount" label="Tax (AED)" />
        <NumberInput source="total_amount" label="Total (AED)" />
      </div>

      <SelectInput
        source="currency"
        label="Currency"
        choices={[
          { id: "AED", name: "AED (UAE Dirham)" },
          { id: "EUR", name: "EUR (Euro)" },
          { id: "GBP", name: "GBP (British Pound)" },
          { id: "SAR", name: "SAR (Saudi Riyal)" },
        ]}
        defaultValue="AED"
      />

      <TextInput source="shipping_method" label="Shipping Method" />
      <TextInput source="tracking_number" label="Tracking Number" />
      
      <div>
        <label className="block text-sm font-medium mb-1">Shipping Address</label>
        <TextInput source="shipping_address" multiline rows={3} />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Billing Address</label>
        <TextInput source="billing_address" multiline rows={3} />
      </div>

      <TextInput source="notes" label="Notes" multiline rows={3} />
      <TextInput source="internal_notes" label="Internal Notes" multiline rows={3} />
    </SimpleForm>
  </Edit>
);
