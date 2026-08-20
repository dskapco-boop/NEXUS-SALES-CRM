import { View, Text } from "react-native";
import { Database } from "@nexus-crm/database";

type SalesOrder = Database["public"]["Tables"]["sales_orders"]["Row"];

export function SalesOrderCard({ order }: { order: SalesOrder }) {
  return (
    <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
      <Text className="text-lg font-semibold text-primary">
        {order.order_number}
      </Text>
      <Text className="text-sm text-muted mt-1">
        Total: ${order.total_amount?.toLocaleString() ?? "0.00"}
      </Text>
      <Text className="text-xs text-muted mt-2">Status: {order.status}</Text>
    </View>
  );
}
