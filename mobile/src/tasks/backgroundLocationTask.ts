import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";

export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_TASK";

TaskManager.defineTask(
  BACKGROUND_LOCATION_TASK,
  async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
    if (error) {
      console.log("Background task error:", error);
      return;
    }

    if (!data) return;

    /**
     * Expo sends location updates in this shape:
     * data = { locations: LocationObject[] }
     */
    const locations = (data as any).locations as Location.LocationObject[];

    if (!locations || locations.length === 0) return;

    const location = locations[0];

    console.log("Background GPS:", {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    });
  }
);
