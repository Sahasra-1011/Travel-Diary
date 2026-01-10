// --------------------
// Types
// --------------------

export type GPSPoint = {
  latitude: number;
  longitude: number;
  speed: number | null; // meters/second
  timestamp: number;   // milliseconds
};

export type Trip = {
  startTime: number;
  endTime: number;
  points: GPSPoint[];
};

// --------------------
// Thresholds
// --------------------

const START_PERSISTENCE_MS = 60 * 1000;        // 1 min movement
const STOP_PERSISTENCE_MS = 5 * 60 * 1000;     // 5 min stationary
const STATIONARY_RADIUS_METERS = 30;           // heuristic radius

// --------------------
// Helpers
// --------------------

function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --------------------
// TripDetector
// --------------------

export class TripDetector {
  private isInTrip = false;

  private currentTripPoints: GPSPoint[] = [];
  private tripStartTime: number | null = null;

  private movementStartTime: number | null = null;

  // NEW: stationary heuristic state
  private stationaryAnchor: GPSPoint | null = null;
  private stationaryStartTime: number | null = null;

  onTripStart?: (startTime: number) => void;
  onTripEnd?: (trip: Trip) => void;

  processPoint(point: GPSPoint) {
    const now = point.timestamp;

    // --------------------
    // TRIP NOT STARTED
    // --------------------
    if (!this.isInTrip) {
      if (!this.movementStartTime) {
        this.movementStartTime = now;
      }

      if (now - this.movementStartTime >= START_PERSISTENCE_MS) {
        this.isInTrip = true;
        this.tripStartTime = this.movementStartTime;
        this.currentTripPoints = [];

        this.stationaryAnchor = null;
        this.stationaryStartTime = null;

        this.onTripStart?.(this.tripStartTime);
      }
    }

    // --------------------
    // TRIP ONGOING
    // --------------------
    if (this.isInTrip) {
      this.currentTripPoints.push(point);

      if (!this.stationaryAnchor) {
        this.stationaryAnchor = point;
        this.stationaryStartTime = now;
        return;
      }

      const distanceFromAnchor = haversine(
        this.stationaryAnchor.latitude,
        this.stationaryAnchor.longitude,
        point.latitude,
        point.longitude
      );

      if (distanceFromAnchor <= STATIONARY_RADIUS_METERS) {
        // still stationary
        if (
          this.stationaryStartTime &&
          now - this.stationaryStartTime >= STOP_PERSISTENCE_MS
        ) {
          // END TRIP
          const trip: Trip = {
            startTime: this.tripStartTime!,
            endTime: now,
            points: this.currentTripPoints,
          };

          this.reset();
          this.onTripEnd?.(trip);
        }
      } else {
        // user moved meaningfully → reset stationary timer
        this.stationaryAnchor = point;
        this.stationaryStartTime = now;
      }
    }
  }

  private reset() {
    this.isInTrip = false;
    this.tripStartTime = null;
    this.currentTripPoints = [];
    this.movementStartTime = null;
    this.stationaryAnchor = null;
    this.stationaryStartTime = null;
  }
}
