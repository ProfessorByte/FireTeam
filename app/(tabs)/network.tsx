import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useNetwork } from "@/context/NetworkContext";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function NetworkScreen() {
  const { connectedUsers, networkState, isConnected, reconnect } = useNetwork();

  const getSignalIcon = (strength: number) => {
    if (strength >= 75) return "wifi";
    if (strength >= 50) return "wifi-outline";
    return "cellular-outline";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Usuarios Conectados</ThemedText>
        <View style={styles.networkInfo}>
          {networkState.isWiFi ? (
            <>
              <Ionicons
                name="wifi"
                size={18}
                color={Colors.primary}
                style={styles.networkIcon}
              />
              <ThemedText style={styles.networkText}>
                {networkState.ssid || "WiFi"}
              </ThemedText>
            </>
          ) : (
            <TouchableOpacity
              onPress={reconnect}
              style={styles.reconnectButton}
              disabled={isConnected}
            >
              <Ionicons
                name="refresh-circle-outline"
                size={24}
                color={isConnected ? Colors.light.icon : Colors.primary}
              />
              <ThemedText
                style={[
                  styles.reconnectText,
                  isConnected && styles.reconnectTextDisabled,
                ]}
              >
                Reconectar
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          {connectedUsers.map((user, index) => (
            <View key={`${user.deviceId}-${index}`} style={styles.userCard}>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{user.name}</ThemedText>
                <View style={styles.signalContainer}>
                  <Ionicons
                    name={getSignalIcon(user.signalStrength)}
                    size={18}
                    color={user.isOnline ? Colors.primary : Colors.light.icon}
                  />
                  <ThemedText
                    style={[
                      styles.signalText,
                      !user.isOnline && styles.signalTextOffline,
                    ]}
                  >
                    {user.signalStrength}%
                  </ThemedText>
                  {!user.isOnline && (
                    <ThemedText style={styles.offlineText}>
                      Desconectado
                    </ThemedText>
                  )}
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
  header: {
    marginBottom: 20,
  },
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  networkIcon: {
    marginRight: 8,
  },
  networkText: {
    fontSize: 14,
    opacity: 0.8,
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reconnectText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.primary,
  },
  reconnectTextDisabled: {
    color: Colors.light.icon,
  },
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
  signalTextOffline: {
    color: Colors.light.icon,
  },
  offlineText: {
    fontSize: 12,
    color: Colors.light.icon,
    marginLeft: 8,
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
