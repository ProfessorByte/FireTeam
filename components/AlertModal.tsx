import React, { useEffect } from "react";
import { Modal, StyleSheet, View, Animated, Easing } from "react-native";
import * as Haptics from "expo-haptics";
import { ThemedText } from "./ThemedText";
import Colors from "../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface AlertModalProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
}

export function AlertModal({ visible, userName, onClose }: AlertModalProps) {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    let vibrationInterval: NodeJS.Timeout;
    let animationLoop: Animated.CompositeAnimation;

    if (visible) {
      // Iniciar animación de pulso
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();

      // Iniciar vibración constante
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      vibrationInterval = setInterval(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 1000);

      // Auto-cerrar después de 10 segundos
      const timer = setTimeout(onClose, 10000);
      return () => {
        clearTimeout(timer);
        clearInterval(vibrationInterval);
        animationLoop.stop();
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Animated.View
            style={[
              styles.alertIconContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="warning" size={64} color={Colors.secondary} />
          </Animated.View>
          <ThemedText style={styles.alertTitle}>¡ALERTA!</ThemedText>
          <ThemedText style={styles.alertMessage}>
            Enviada por: {userName}
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 32,
    minWidth: "80%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  alertIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: "rgba(255, 87, 51, 0.2)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  alertTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.secondary,
    marginBottom: 16,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 38,
  },
  alertMessage: {
    fontSize: 18,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 24,
  },
});
