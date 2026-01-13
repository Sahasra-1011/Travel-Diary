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

import { haversineDistance } from "../../src/utils/geo";
import { uploadTripSummary } from "../../src/firebase/uploadTripSummary";

export default function HomeScreen() {
  const tripDetectorRef = useRef<TripDetector | null>(null);
  const [latestTrip, setLatestTrip] = useState<TripWithPoints | null>(null);

  // -----------------------------
  // Create TripDetector ONCE
  // -----------------------------
  if (!tripDetectorRef.current) {
    tripDetectorRef.current = new TripDetector();

    tripDetectorRef.current.onTripEnd = async (trip) => {
      // 1️⃣ Save locally (offline-first)
      await saveTrip(trip.startTime, trip.endTime, trip.points);

      // 2️⃣ Load latest trip for UI
      const savedTrip = await getLatestTrip();
      setLatestTrip(savedTrip);

      // -----------------------------
      // 3️⃣ Build trip summary
      // -----------------------------
      let distanceKm = 0;
      let maxSpeed = 0; // km/h

      for (let i = 1; i < trip.points.length; i++) {
        const prev = trip.points[i - 1];
        const curr = trip.points[i];

        // Distance
        distanceKm += haversineDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );

        // Max speed (convert m/s → km/h)
        if (curr.speed !== null) {
          const speedKmh = curr.speed * 3.6;
          if (speedKmh > maxSpeed) {
            maxSpeed = speedKmh;
          }
        }
      }

      const durationMin = Math.round(
        (trip.endTime - trip.startTime) / 60000
      );

      const avgSpeed =
        durationMin > 0 ? (distanceKm / durationMin) * 60 : 0;

      // Hour bucket (policy-friendly)
      const startHour = new Date(trip.startTime).getHours();
      const hourBucket = `${startHour}-${startHour + 1}`;

      // -----------------------------
      // Mode detection (FINAL, CORRECT)
      // -----------------------------
      let mode = "unknown";

      // Walking: slow overall, no spikes
      if (distanceKm < 1 && avgSpeed < 6 && maxSpeed < 8) {
        mode = "walking";
      }

      // Cycling: moderate speed, limited peak
      else if (avgSpeed < 15 && maxSpeed < 25) {
        mode = "cycling";
      }

      // Two-wheeler: clear speed spikes
      else if (maxSpeed >= 25 && maxSpeed < 60) {
        mode = "two_wheeler";
      }

      // Car: sustained higher speed + longer distance
      else if (avgSpeed >= 25 && distanceKm > 5) {
        mode = "car";
      }

      // -----------------------------
      // 4️⃣ Upload to Firebase
      // -----------------------------
      uploadTripSummary({
        city: "Hyderabad",
        distance_km: Number(distanceKm.toFixed(2)),
        duration_min: durationMin,
        avg_speed: Number(avgSpeed.toFixed(1)),
        mode,
        hour_bucket: hourBucket,
        date: new Date(trip.startTime).toISOString().split("T")[0],
      });
    };
  }

  // -----------------------------
  // App lifecycle
  // -----------------------------
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

  // -----------------------------
  // UI
  // -----------------------------
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
