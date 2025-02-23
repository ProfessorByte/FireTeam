import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useState, useCallback } from "react";
import Colors from "../../constants/Colors";
import { ThemedText } from "../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [deviceId, setDeviceId] = useState("");

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
    // TODO: Implement save functionality
  }, [deviceId]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Configuración</ThemedText>
          <ThemedText style={styles.subtitle}>
            Configura los ajustes de tu dispositivo
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>
              Identificador del Dispositivo
            </ThemedText>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="wifi"
                size={20}
                color={Colors.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={deviceId}
                onChangeText={setDeviceId}
                placeholder="Ingresa un nombre único"
                placeholderTextColor="rgba(255,255,255,0.5)"
                selectionColor={Colors.secondary}
                returnKeyType="done"
                onSubmitEditing={dismissKeyboard}
              />
            </View>
            <ThemedText style={styles.helper}>
              Este nombre será visible para otros dispositivos en la red
            </ThemedText>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.saveButtonText}>
              Guardar Cambios
            </ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.version}>FireTeam v1.0.0</ThemedText>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  helper: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: "auto",
    alignItems: "center",
  },
  version: {
    opacity: 0.5,
    fontSize: 14,
  },
});
