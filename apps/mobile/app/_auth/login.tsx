import { View, Text } from "react-native";
import { Button } from "@nexus-crm/ui";

export default function LoginScreen() {
  return (
    <View className="flex-1 bg-background p-6 justify-center">
      <Text className="text-3xl font-bold text-center mb-8 text-primary">Nexus CRM</Text>
      <Button title="Sign in with Google" onPress={() => {}} />
    </View>
  );
}
