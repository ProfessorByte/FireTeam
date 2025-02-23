import { StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import { useCallback } from "react";
import Colors from "../../constants/Colors";
import * as Haptics from "expo-haptics";
import { ThemedText } from "../../components/ThemedText";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

export default function AlertScreen() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Implement alert functionality
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <ThemedText style={styles.title}>FireTeam</ThemedText>

      <Animated.View style={[styles.buttonContainer, animatedStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="warning" size={64} color="#fff" />
            <ThemedText style={styles.buttonText}>ALERTA</ThemedText>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ThemedText style={styles.helpText}>
        Presiona el botón para enviar una alerta de emergencia
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 120 : 100,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 40,
  },
  buttonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
  },
  helpText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 20,
  },
});
