import { View, ActivityIndicator, Text } from "react-native";

export function LoadingView() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#243b53" />
      <Text className="text-muted mt-4 text-sm">Loading Nexus CRM...</Text>
    </View>
  );
}
