import React from "react";
import { StyleSheet, View } from "react-native";
import { useNetwork } from "@/context/NetworkContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function NetworkScreen() {
  const { connectedUsers } = useNetwork();

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return "wifi";
    if (strength >= 50) return "wifi-outline";
    return "cellular-outline";
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Usuarios Conectados</ThemedText>
      {connectedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="wifi-outline"
            size={48}
            color={Colors.light.icon}
            style={styles.emptyIcon}
          />
          <ThemedText style={styles.emptyText}>
            No hay usuarios conectados
          </ThemedText>
        </View>
      ) : (
        <View style={styles.userList}>
          {connectedUsers.map((user) => (
            <View key={user.name} style={styles.userCard}>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{user.name}</ThemedText>
                <View style={styles.signalContainer}>
                  <Ionicons
                    name={getSignalIcon(user.signalStrength)}
                    size={18}
                    color={Colors.primary}
                  />
                  <ThemedText style={styles.signalText}>
                    {user.signalStrength}%
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    marginTop: 60,
  },
  userList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 12,
    padding: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  signalContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  signalText: {
    fontSize: 14,
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});
