import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { FAB, EnquiryCard } from "../../../src/components";
import { useEnquiries } from "@nexus-crm/crm-core";

export default function EnquiriesScreen() {
  const router = useRouter();
  const { enquiries, isLoading } = useEnquiries();

  return (
    <View className="flex-1 bg-background">
      <FlatList
        data={enquiries}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => <EnquiryCard enquiry={item} />}
      />
      <FAB onPress={() => router.push("/_app/_enquiries/new")}>
        <Text className="text-white text-xl">+</Text>
      </FAB>
    </View>
  );
}
