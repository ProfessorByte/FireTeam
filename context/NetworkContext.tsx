import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import NetInfo, {
  NetInfoStateType,
  NetInfoState,
} from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ConnectedUser {
  name: string;
  signalStrength: number;
  lastSeen: number;
  deviceId: string;
  isOnline: boolean;
  ipAddress?: string;
}

interface NetworkState {
  isWiFi: boolean;
  ssid?: string | null;
  strength: number;
  isInternetReachable: boolean;
  ipAddress?: string;
}

interface NetworkContextType {
  userName: string;
  setUserName: (name: string) => void;
  isConnected: boolean;
  networkState: NetworkState;
  sendAlert: () => Promise<void>;
  connectedUsers: ConnectedUser[];
  reconnect: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);
const STORAGE_KEY = "@FireTeam:userData";
const BROADCAST_INTERVAL = 2000;
const USER_TIMEOUT = 10000;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const generateDeviceId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const DEVICE_ID = generateDeviceId();

// Helper function to calculate signal strength
const calculateSignalStrength = (state: NetInfoState): number => {
  if (state.type !== NetInfoStateType.wifi || !state.isConnected) {
    return 0;
  }

  // If connected to WiFi and internet is reachable, consider it strong connection
  if (state.isInternetReachable) {
    return 100;
  }

  // If WiFi is connected but internet is not reachable, consider it medium strength
  return 60;
};

// Helper function to get SSID from network state
const getNetworkSSID = (state: NetInfoState): string | null => {
  if (state.type === NetInfoStateType.wifi && "details" in state) {
    return (state.details as any)?.ssid || null;
  }
  return null;
};

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const broadcastTimer = useRef<NodeJS.Timeout | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [networkState, setNetworkState] = useState<NetworkState>({
    isWiFi: false,
    ssid: null,
    strength: 0,
    isInternetReachable: false,
  });

  // Load saved username
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((savedData) => {
      if (savedData) {
        const { name } = JSON.parse(savedData);
        if (name) setUserName(name);
      }
    });
  }, []);

  // Save username changes
  const handleSetUserName = useCallback((name: string) => {
    const cleanedName = name.replace(/\s+/g, " ").trim();
    setUserName(cleanedName);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ name: cleanedName }));
  }, []);

  // Clean up inactive users
  const cleanupInactiveUsers = useCallback(() => {
    const now = Date.now();
    setConnectedUsers((prev) =>
      prev.filter((user) => now - user.lastSeen < USER_TIMEOUT)
    );
  }, []);

  useEffect(() => {
    const cleanup = setInterval(cleanupInactiveUsers, 5000);
    return () => clearInterval(cleanup);
  }, [cleanupInactiveUsers]);

  // Network monitoring and device discovery
  useEffect(() => {
    const updateNetworkInfo = async () => {
      try {
        const netInfo = await NetInfo.fetch();
        const ipAddress = await Network.getIpAddressAsync();
        const isWifi = netInfo.type === NetInfoStateType.wifi;
        const signalStrength = calculateSignalStrength(netInfo);

        setIsConnected(isWifi);
        setNetworkState({
          isWiFi: isWifi,
          ssid: getNetworkSSID(netInfo),
          strength: signalStrength,
          isInternetReachable: netInfo.isInternetReachable || false,
          ipAddress,
        });

        if (isWifi && userName) {
          // Update our own status
          setConnectedUsers((prev) => {
            const filtered = prev.filter((u) => u.deviceId !== DEVICE_ID);
            return [
              ...filtered,
              {
                name: userName,
                signalStrength,
                lastSeen: Date.now(),
                deviceId: DEVICE_ID,
                isOnline: true,
                ipAddress,
              },
            ];
          });
        }
      } catch (error) {
        console.error("Network update error:", error);
      }
    };

    const initialize = async () => {
      await updateNetworkInfo();
      broadcastTimer.current = setInterval(
        updateNetworkInfo,
        BROADCAST_INTERVAL
      );
    };

    if (userName) {
      initialize();
    }

    return () => {
      if (broadcastTimer.current) {
        clearInterval(broadcastTimer.current);
        broadcastTimer.current = null;
      }
    };
  }, [userName]);

  const reconnect = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      const ipAddress = await Network.getIpAddressAsync();
      const isWifi = netInfo.type === NetInfoStateType.wifi;
      const signalStrength = calculateSignalStrength(netInfo);

      setIsConnected(isWifi);
      setNetworkState({
        isWiFi: isWifi,
        ssid: getNetworkSSID(netInfo),
        strength: signalStrength,
        isInternetReachable: netInfo.isInternetReachable || false,
        ipAddress,
      });

      if (isWifi && userName) {
        await notifyOthers("connected");
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
    }
  };

  const notifyOthers = async (
    action: "connected" | "disconnected" | "alert"
  ) => {
    if (!userName) return;

    // Show local notification
    let notificationMessage = "";
    switch (action) {
      case "connected":
        notificationMessage = `${userName} se ha conectado a la red`;
        break;
      case "disconnected":
        notificationMessage = `${userName} se ha desconectado de la red`;
        break;
      case "alert":
        notificationMessage = `¡ALERTA! enviada por ${userName}`;
        break;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "FireTeam",
        body: notificationMessage,
        sound: true,
      },
      trigger: null,
    });
  };

  const sendAlert = async () => {
    await notifyOthers("alert");
  };

  // Update offline status when app is closed or backgrounded
  useEffect(() => {
    const handleAppStateChange = async () => {
      await notifyOthers("disconnected");
    };

    // Add app state change listener
    const subscription = NetInfo.addEventListener((state) => {
      if (!state.isConnected && userName) {
        handleAppStateChange();
      }
    });

    return () => {
      subscription();
      handleAppStateChange();
    };
  }, [userName]);

  return (
    <NetworkContext.Provider
      value={{
        userName,
        setUserName: handleSetUserName,
        isConnected,
        networkState,
        sendAlert,
        connectedUsers,
        reconnect,
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
