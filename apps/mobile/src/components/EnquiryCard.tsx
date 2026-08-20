import { View, Text } from "react-native";
import { Database } from "@nexus-crm/database";

type Enquiry = Database["public"]["Tables"]["enquiries"]["Row"];

export function EnquiryCard({ enquiry }: { enquiry: Enquiry }) {
  return (
    <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
      <Text className="text-lg font-semibold text-primary">
        Enquiry #{enquiry.id.slice(0, 8)}
      </Text>
      <Text className="text-sm text-muted mt-1">{enquiry.notes}</Text>
      <Text className="text-xs text-muted mt-2">Status: {enquiry.status}</Text>
    </View>
  );
}
