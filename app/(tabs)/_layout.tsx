import { Tabs } from "expo-router";
import { Platform, Keyboard } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../constants/Colors";
import { BlurView } from "expo-blur";

export default function TabLayout() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#8E8E93",
        headerShown: false,
        tabBarStyle: {
          ...(isKeyboardVisible
            ? { display: "none" }
            : {
                position: "absolute",
                bottom: Platform.OS === "ios" ? 30 : 20,
                left: 20,
                right: 20,
                borderRadius: 16,
                height: 60,
                paddingTop: 8,
                paddingBottom: 12,
                backgroundColor:
                  Platform.OS === "ios"
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.95)",
                borderTopWidth: 0,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }),
        },
        tabBarBackground: () =>
          Platform.OS === "ios" && !isKeyboardVisible ? (
            <BlurView
              intensity={60}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
              }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Alerta",
          tabBarIcon: ({ color }) => (
            <Ionicons name="warning-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: "Red",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
