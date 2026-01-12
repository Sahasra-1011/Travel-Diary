import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";

import {
  requestForegroundPermission,
  requestBackgroundPermission,
  startForegroundTracking,
  stopForegroundTracking,
  startBackgroundTracking,
  stopBackgroundTracking,
} from "../../src/sensors/locationService";

import { TripDetector, GPSPoint } from "../../src/trip/tripDetector";
import {
  initDatabase,
  saveTrip,
  getLatestTrip,
  TripWithPoints,
} from "../../src/storage/database";

export default function HomeScreen() {
  const tripDetectorRef = useRef<TripDetector | null>(null);
  const [latestTrip, setLatestTrip] = useState<TripWithPoints | null>(null);

  // Create detector once
  if (!tripDetectorRef.current) {
    tripDetectorRef.current = new TripDetector();

    tripDetectorRef.current.onTripEnd = async (trip) => {
      await saveTrip(trip.startTime, trip.endTime, trip.points);

      const savedTrip = await getLatestTrip();
      setLatestTrip(savedTrip);
    };
  }

  useEffect(() => {
    initDatabase();

    async function init() {
      await requestForegroundPermission();
      await requestBackgroundPermission();

      await startForegroundTracking((location) => {
        const point: GPSPoint = {
          latitude: location.latitude,
          longitude: location.longitude,
          speed: location.speed,
          timestamp: location.timestamp,
        };

        tripDetectorRef.current?.processPoint(point);
      });

      await startBackgroundTracking();

      // Load last saved trip on app start
      const trip = await getLatestTrip();
      setLatestTrip(trip);
    }

    init();

    return () => {
      stopForegroundTracking();
      stopBackgroundTracking();
    };
  }, []);

  if (!latestTrip || latestTrip.points.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No trips yet</Text>
      </View>
    );
  }

  const start = latestTrip.points[0];
  const end = latestTrip.points[latestTrip.points.length - 1];

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={{
        latitude: start.latitude,
        longitude: start.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Polyline
        coordinates={latestTrip.points}
        strokeWidth={4}
        strokeColor="blue"
      />

      <Marker coordinate={start} title="Start" />
      <Marker coordinate={end} title="End" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
