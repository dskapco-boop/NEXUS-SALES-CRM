import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FAB, LeadCard } from "../../../src/components";
import { useLeads } from "@nexus-crm/crm-core";

export default function LeadsScreen() {
  const router = useRouter();
  const { leads, isLoading, deleteLead } = useLeads();

  const handleDelete = async (id: string) => {
    await deleteLead.mutateAsync(id);
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <LeadCard lead={item} onDelete={handleDelete} />
        )}
      />
      <FAB onPress={() => router.push("/_app/_leads/new")}>
        <Text className="text-white text-xl">+</Text>
      </FAB>
    </View>
  );
}
