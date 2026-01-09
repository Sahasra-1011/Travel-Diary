import { useEffect } from "react";
import { View, Text } from "react-native";

import {
  requestForegroundPermission,
  startForegroundTracking,
  stopForegroundTracking,
} from "../../src/sensors/locationService";


export default function HomeScreen() {
  useEffect(() => {
  let isActive = true;

  async function init() {
    try {
      await requestForegroundPermission();

      await startForegroundTracking((location) => {
        if (!isActive) return;
        console.log("GPS Update:", location);
      });
    } catch (error) {
      console.log("Tracking error:", error);
    }
  }

  init();

  return () => {
    isActive = false;
    stopForegroundTracking();
  };
}, []);
;

  return (
  <View
    style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "white",
    }}
  >
    <Text style={{ color: "black", fontSize: 18 }}>
      Travel Diary – Home
    </Text>
  </View>
);

}
