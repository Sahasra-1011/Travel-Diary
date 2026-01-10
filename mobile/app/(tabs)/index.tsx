import { useEffect, useRef } from "react";
import { View, Text } from "react-native";

import {
  requestForegroundPermission,
  requestBackgroundPermission,
  startForegroundTracking,
  stopForegroundTracking,
  startBackgroundTracking,
  stopBackgroundTracking,
} from "../../src/sensors/locationService";

import { TripDetector, GPSPoint } from "../../src/trip/tripDetector";
import { initDatabase, saveTrip } from "../../src/storage/database";

export default function HomeScreen() {
  // ✅ ONE persistent TripDetector instance
  const tripDetectorRef = useRef<TripDetector | null>(null);

  // Register detector + callbacks ONCE
  if (!tripDetectorRef.current) {
    tripDetectorRef.current = new TripDetector();

    tripDetectorRef.current.onTripStart = (startTime) => {
      console.log(
        "🚀 Trip STARTED at",
        new Date(startTime).toLocaleTimeString()
      );
    };

    tripDetectorRef.current.onTripEnd = async (trip) => {
      console.log(
        "🏁 Trip ENDED",
        "Start:",
        new Date(trip.startTime).toLocaleTimeString(),
        "End:",
        new Date(trip.endTime).toLocaleTimeString(),
        "Points:",
        trip.points.length
      );

      // ✅ Persist trip to SQLite
      await saveTrip(trip.startTime, trip.endTime, trip.points);
    };
  }

  useEffect(() => {
    // Initialize DB once on app start
    initDatabase();

    async function init() {
      try {
        // ---- Permissions ----
        await requestForegroundPermission();
        await requestBackgroundPermission();

        // ---- Foreground GPS (feeds TripDetector) ----
        await startForegroundTracking((location) => {
          const point: GPSPoint = {
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            timestamp: location.timestamp,
          };

          tripDetectorRef.current?.processPoint(point);
        });

        // ---- Background GPS (keeps tracking alive) ----
        await startBackgroundTracking();

        console.log("Tracking initialized");
      } catch (error) {
        console.log("Tracking error:", error);
      }
    }

    init();

    return () => {
      stopForegroundTracking();
      stopBackgroundTracking();
    };
  }, []);

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
