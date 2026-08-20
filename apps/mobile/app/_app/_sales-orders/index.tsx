import { View, Text, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { FAB, SalesOrderCard } from "../../../src/components";
import { useSalesOrders } from "@nexus-crm/crm-core";

export default function SalesOrdersScreen() {
  const router = useRouter();
  const { salesOrders, isLoading } = useSalesOrders();

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={salesOrders}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => <SalesOrderCard order={item} />}
      />
      <FAB onPress={() => router.push("/_app/_sales-orders/new")}>
        <Text className="text-white text-xl">+</Text>
      </FAB>
    </View>
  );
}
