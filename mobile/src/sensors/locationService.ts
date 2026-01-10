import * as Location from "expo-location";
import { BACKGROUND_LOCATION_TASK } from "../tasks/backgroundLocationTask";

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
export async function requestBackgroundPermission() {
  const { status } = await Location.requestBackgroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Background location permission denied");
  }

  return true;
}


export async function startBackgroundTracking() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );

  if (!hasStarted) {
    await Location.startLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK,
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Travel Diary is tracking",
          notificationBody: "Your trips are being recorded",
        },
      }
    );
  }
}

export async function stopBackgroundTracking() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  );

  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
  }
}
