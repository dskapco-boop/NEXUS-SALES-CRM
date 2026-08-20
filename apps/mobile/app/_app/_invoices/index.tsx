import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { FAB, InvoiceCard } from "../../../src/components";
import { useInvoices } from "@nexus-crm/crm-core";

export default function InvoicesScreen() {
  const router = useRouter();
  const { invoices, isLoading } = useInvoices();

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => <InvoiceCard invoice={item} />}
      />
      <FAB onPress={() => router.push("/_app/_invoices/new")}>
        <Text className="text-white text-xl">+</Text>
      </FAB>
    </View>
  );
}
