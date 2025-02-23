import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "../../components/ThemedText";
import * as Haptics from "expo-haptics";
import { AlertModal } from "../../components/AlertModal";
import { useNetwork } from "../../context/NetworkContext";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";

export default function AlertScreen() {
  const insets = useSafeAreaInsets();
  const { sendAlert, showAlert, alertSender, dismissAlert, isConnected } =
    useNetwork();

  const handleAlert = useCallback(async () => {
    // Vibración inmediata al tocar
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    sendAlert();
  }, [sendAlert]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isConnected ? (
        <TouchableOpacity
          style={styles.alertButton}
          onPress={handleAlert}
          activeOpacity={0.8}
        >
          <Ionicons name="warning" size={64} color="#FFF" />
          <ThemedText style={styles.alertText}>
            Presiona para enviar una alerta
          </ThemedText>
          <ThemedText style={styles.alertSubtext}>
            Se notificará a todos los usuarios conectados
          </ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={styles.noWifiContainer}>
          <Ionicons name="wifi-outline" size={64} color="#666" />
          <ThemedText style={styles.noWifiText}>
            Conéctate a una red WiFi para poder enviar alertas
          </ThemedText>
        </View>
      )}

      <AlertModal
        visible={showAlert}
        userName={alertSender}
        onClose={dismissAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  alertButton: {
    flex: 1,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  alertText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    marginTop: 24,
  },
  alertSubtext: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 8,
  },
  noWifiContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noWifiText: {
    fontSize: 18,
    textAlign: "center",
    opacity: 0.6,
    marginTop: 16,
  },
});
