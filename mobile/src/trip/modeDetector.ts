import { GPSPoint } from "./tripDetector";

export function detectMode(points: GPSPoint[]) {
  if (points.length < 2) return "unknown";

  let maxSpeed = 0;

  points.forEach((p) => {
    if (p.speed !== null && p.speed > maxSpeed) {
      maxSpeed = p.speed;
    }
  });

  // Convert m/s → km/h
  maxSpeed = maxSpeed * 3.6;

  const start = points[0];
  const end = points[points.length - 1];
  const durationMin =
    (end.timestamp - start.timestamp) / 60000;

  // distance will already be calculated elsewhere
  // avgSpeed will be passed separately

  return { maxSpeed, durationMin };
}
