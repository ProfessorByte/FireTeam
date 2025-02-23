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
import { Audio } from "expo-av";
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
  showAlert: boolean;
  alertSender: string;
  dismissAlert: () => void;
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
  const alertSound = useRef<Audio.Sound>();
  const [userName, setUserName] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertSender, setAlertSender] = useState("");
  const [networkState, setNetworkState] = useState<NetworkState>({
    isWiFi: false,
    ssid: null,
    strength: 0,
    isInternetReachable: false,
  });

  // Load alert sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/sounds/alert.mp3")
        );
        alertSound.current = sound;
      } catch (error) {
        console.error("Error loading sound:", error);
      }
    };

    loadSound();

    return () => {
      if (alertSound.current) {
        alertSound.current.unloadAsync();
      }
    };
  }, []);

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
  const updateNetworkInfo = useCallback(async () => {
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
  }, [userName]);

  // Initial network state and listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.type === NetInfoStateType.wifi);
    });

    // Initial check
    updateNetworkInfo();

    return () => {
      unsubscribe();
    };
  }, [updateNetworkInfo]);

  // Periodic updates when user is set
  useEffect(() => {
    if (!userName) return;

    updateNetworkInfo();
    broadcastTimer.current = setInterval(updateNetworkInfo, BROADCAST_INTERVAL);

    return () => {
      if (broadcastTimer.current) {
        clearInterval(broadcastTimer.current);
        broadcastTimer.current = null;
      }
    };
  }, [userName, updateNetworkInfo]);

  const playAlertSound = useCallback(async () => {
    try {
      if (alertSound.current) {
        await alertSound.current.setPositionAsync(0);
        await alertSound.current.playAsync();
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error("Error playing alert sound:", error);
    }
  }, []);

  const showNotification = useCallback(async (message: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "FireTeam",
          body: message,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }, []);

  const sendAlert = useCallback(async () => {
    if (!userName) return;

    // Primero mostramos la alerta localmente
    setShowAlert(true);
    setAlertSender(userName);

    // Reproducimos el sonido y vibramos
    await playAlertSound();

    // Notificamos a otros usuarios
    await showNotification(`¡ALERTA! enviada por ${userName}`);

    // Programamos el cierre automático
    setTimeout(() => {
      setShowAlert(false);
      setAlertSender("");
    }, 10000);
  }, [userName, playAlertSound, showNotification]);

  const dismissAlert = useCallback(() => {
    setShowAlert(false);
    setAlertSender("");
  }, []);

  const reconnect = useCallback(async () => {
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
        await showNotification(`${userName} se ha conectado a la red`);
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
    }
  }, [userName, showNotification]);

  // Update offline status when app is closed or backgrounded
  useEffect(() => {
    const handleAppStateChange = async () => {
      if (userName) {
        await showNotification(`${userName} se ha desconectado de la red`);
      }
    };

    const subscription = NetInfo.addEventListener((state) => {
      if (!state.isConnected && userName) {
        handleAppStateChange();
      }
    });

    return () => {
      subscription();
      handleAppStateChange();
    };
  }, [userName, showNotification]);

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
        showAlert,
        alertSender,
        dismissAlert,
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
