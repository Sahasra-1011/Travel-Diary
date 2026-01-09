import * as Location from "expo-location";

export async function requestForegroundPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Foreground location permission denied");
  }

  return true;
}

export async function getCurrentLocation() {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    speed: location.coords.speed,
    timestamp: location.timestamp,
  };
}

let locationSubscription: Location.LocationSubscription | null = null;

export async function startForegroundTracking(
  onLocationUpdate: (location: {
    latitude: number;
    longitude: number;
    speed: number | null;
    timestamp: number;
  }) => void
) {
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000, // every 5 seconds
      distanceInterval: 5, // or every 5 meters
    },
    (location) => {
      onLocationUpdate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: location.coords.speed,
        timestamp: location.timestamp,
      });
    }
  );
}

export function stopForegroundTracking() {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
