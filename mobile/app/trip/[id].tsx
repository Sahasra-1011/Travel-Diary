import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import MapView, { Polyline, Marker } from "react-native-maps";

import { getTripById } from "../../src/storage/database";
import { haversineDistance } from "../../src/utils/geo";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<any>(null);

  useEffect(() => {
    async function loadTrip() {
      if (!id) return;
      const data = await getTripById(Number(id));
      setTrip(data);
    }

    loadTrip();
  }, [id]);

  if (!trip || trip.points.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Loading trip...</Text>
      </View>
    );
  }

  const start = trip.points[0];
  const end = trip.points[trip.points.length - 1];

  // --------- STATS CALCULATION ---------
  let distanceKm = 0;

  for (let i = 1; i < trip.points.length; i++) {
    const prev = trip.points[i - 1];
    const curr = trip.points[i];

    distanceKm += haversineDistance(
      prev.latitude,
      prev.longitude,
      curr.latitude,
      curr.longitude
    );
  }

  const durationMin = Math.round(
    (trip.endTime - trip.startTime) / 60000
  );

  const avgSpeed =
    durationMin > 0
      ? ((distanceKm / durationMin) * 60).toFixed(1)
      : "0";

  // --------- UI ---------
  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: start.latitude,
          longitude: start.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline
          coordinates={trip.points}
          strokeWidth={4}
          strokeColor="blue"
        />

        <Marker coordinate={start} title="Start" />
        <Marker coordinate={end} title="End" />
      </MapView>

      <View style={styles.stats}>
        <Text style={styles.statText}>
          Distance: {distanceKm.toFixed(2)} km
        </Text>
        <Text style={styles.statText}>
          Duration: {durationMin} min
        </Text>
        <Text style={styles.statText}>
          Avg Speed: {avgSpeed} km/h
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  stats: {
    padding: 14,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  statText: {
    fontSize: 15,
    marginBottom: 4,
  },
});
