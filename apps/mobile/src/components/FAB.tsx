import { TouchableOpacity, Text, ViewStyle, TextStyle, StyleSheet, View, ActivityIndicator } from "react-native";
import { tokens } from "@nexus-crm/ui";

interface FABProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function FAB({ onPress, children, style }: FABProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fab, style]}
      className="absolute bottom-6 right-6 bg-primary rounded-full w-14 h-14 items-center justify-center shadow-lg"
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
