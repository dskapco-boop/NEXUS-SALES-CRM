import { View, Text } from "react-native";
import { Database } from "@nexus-crm/database";

type Quotation = Database["public"]["Tables"]["quotations"]["Row"];

export function QuotationCard({ quotation }: { quotation: Quotation }) {
  return (
    <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
      <Text className="text-lg font-semibold text-primary">
        {quotation.quote_number}
      </Text>
      <Text className="text-sm text-muted mt-1">
        Total: ${quotation.total_amount?.toLocaleString() ?? "0.00"}
      </Text>
      <Text className="text-xs text-muted mt-2">Status: {quotation.status}</Text>
    </View>
  );
}
