import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Database } from "@nexus-crm/database";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

interface LeadCardProps {
  lead: Lead;
  onDelete?: (id: string) => void;
}

export function LeadCard({ lead, onDelete }: LeadCardProps) {
  const statusColors: Record<string, string> = {
    new: "#3b82f6",
    contacted: "#8b5cf6",
    qualified: "#10b981",
    converted: "#f59e0b",
    lost: "#ef4444",
  };

  return (
    <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-primary">
            {lead.first_name} {lead.last_name}
          </Text>
          <Text className="text-sm text-muted">{lead.email}</Text>
          <Text className="text-sm text-muted">{lead.phone}</Text>
          <Text className="text-xs text-muted mt-2">{lead.company}</Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${statusColors[lead.status] || "#94a3b8"}20` }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: statusColors[lead.status] || "#94a3b8" }}
          >
            {lead.status}
          </Text>
        </View>
      </View>
    </View>
  );
}
