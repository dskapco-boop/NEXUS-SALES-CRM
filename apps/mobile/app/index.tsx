import { Link } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nexus CRM</Text>
      <Text style={styles.subtitle}>Mobile Dashboard</Text>
      
      <View style={styles.cardContainer}>
        <Link href="/_app/_leads" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Leads</Text>
            <Text style={styles.cardText}>Manage your leads</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/_app/_enquiries" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Enquiries</Text>
            <Text style={styles.cardText}>Track customer enquiries</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/_app/_sales-orders" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Sales Orders</Text>
            <Text style={styles.cardText}>Create and manage orders</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/_app/_quotations" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Quotations</Text>
            <Text style={styles.cardText}>Generate quotations</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/_app/_invoices" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Invoices</Text>
            <Text style={styles.cardText}>Track invoices</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  cardContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});
