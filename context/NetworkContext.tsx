import React, { createContext, useContext, useState, useEffect } from "react";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

interface ConnectedUser {
  name: string;
  signalStrength: number; // 0-100
  lastSeen: number;
}

interface NetworkContextType {
  userName: string;
  setUserName: (name: string) => void;
  isConnected: boolean;
  sendAlert: () => Promise<void>;
  connectedUsers: ConnectedUser[];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  // Cleanup inactive users every 30 seconds
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setConnectedUsers((prev) =>
        prev.filter((user) => now - user.lastSeen < 30000)
      );
    }, 30000);

    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    // Request notification permissions
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("Notification permissions not granted");
      }
    })();

    // Monitor network state
    const subscription = Network.addNetworkStateListener((state) => {
      if (state.type === Network.NetworkStateType.WIFI) {
        setIsConnected(true);
        if (userName) {
          notifyOthers("connected");
        }
      } else {
        setIsConnected(false);
        if (userName) {
          notifyOthers("disconnected");
        }
      }
    });

    // Setup notification listener
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    );

    return () => {
      subscription.remove();
      notificationListener.remove();
    };
  }, [userName]);

  const updateUserSignal = async () => {
    if (!userName || !isConnected) return;

    try {
      const networkState = await Network.getNetworkStateAsync();
      let signalStrength = 100;

      if (networkState.type === Network.NetworkStateType.WIFI) {
        // Simulate signal strength based on isConnected and isInternetReachable
        signalStrength = networkState.isInternetReachable ? 100 : 60;
      }

      setConnectedUsers((prev) => {
        const existing = prev.find((u) => u.name === userName);
        if (existing) {
          return prev.map((u) =>
            u.name === userName
              ? { ...u, signalStrength, lastSeen: Date.now() }
              : u
          );
        }
        return [
          ...prev,
          { name: userName, signalStrength, lastSeen: Date.now() },
        ];
      });
    } catch (error) {
      console.error("Error updating signal strength:", error);
    }
  };

  // Update signal strength periodically
  useEffect(() => {
    if (!userName || !isConnected) return;

    updateUserSignal();
    const interval = setInterval(updateUserSignal, 5000);

    return () => clearInterval(interval);
  }, [userName, isConnected]);

  const notifyOthers = async (
    action: "connected" | "disconnected" | "alert"
  ) => {
    if (!userName) return;

    let message = "";
    switch (action) {
      case "connected":
        message = `${userName} se ha conectado a la red`;
        break;
      case "disconnected":
        message = `${userName} se ha desconectado de la red`;
        break;
      case "alert":
        message = `¡ALERTA! enviada por ${userName}`;
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "FireTeam",
        body: message,
        sound: true,
      },
      trigger: null,
    });
  };

  const sendAlert = async () => {
    await notifyOthers("alert");
  };

  return (
    <NetworkContext.Provider
      value={{
        userName,
        setUserName,
        isConnected,
        sendAlert,
        connectedUsers,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
