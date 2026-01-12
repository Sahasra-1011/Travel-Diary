import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";

import { getAllTrips, TripSummary } from "../../src/storage/database";

export default function TripsScreen() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadTrips() {
      const data = await getAllTrips();
      setTrips(data);
    }

    loadTrips();
  }, []);

  function renderItem({ item }: { item: TripSummary }) {
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const durationMin = Math.round(
      (item.endTime - item.startTime) / 60000
    );

    return (
      <Pressable
        style={styles.card}
        onPress={() => router.push(`/trip/${item.id}` as any)}
      >
        <Text style={styles.title}>
          Trip on {start.toLocaleDateString()}
        </Text>
        <Text>Start: {start.toLocaleTimeString()}</Text>
        <Text>End: {end.toLocaleTimeString()}</Text>
        <Text>Duration: {durationMin} min</Text>
      </Pressable>
    );
  }

  if (trips.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No trips recorded yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
