import { View, Text } from "react-native";
import { Database } from "@nexus-crm/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const statusColors: Record<string, string> = {
    draft: "#94a3b8",
    sent: "#3b82f6",
    paid: "#10b981",
    overdue: "#ef4444",
    void: "#6b7280",
  };

  return (
    <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-primary">
            {invoice.invoice_number}
          </Text>
          <Text className="text-sm text-muted mt-1">
            Due: {new Date(invoice.due_date!).toLocaleDateString()}
          </Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${statusColors[invoice.status] || "#94a3b8"}20` }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: statusColors[invoice.status] || "#94a3b8" }}
          >
            {invoice.status}
          </Text>
        </View>
      </View>
      <Text className="text-sm font-medium mt-2 text-primary">
        ${invoice.total_amount?.toLocaleString() ?? "0.00"}
      </Text>
    </View>
  );
}
