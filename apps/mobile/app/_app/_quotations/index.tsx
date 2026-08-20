import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { FAB, QuotationCard } from "../../../src/components";
import { useQuotations } from "@nexus-crm/crm-core";

export default function QuotationsScreen() {
  const router = useRouter();
  const { quotations, isLoading } = useQuotations();

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={quotations}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => <QuotationCard quotation={item} />}
      />
      <FAB onPress={() => router.push("/_app/_quotations/new")}>
        <Text className="text-white text-xl">+</Text>
      </FAB>
    </View>
  );
}
