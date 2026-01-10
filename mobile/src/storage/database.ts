import * as SQLite from "expo-sqlite";

/**
 * Use modern synchronous DB opening
 * (recommended for Expo SDK 49+)
 */
const db = SQLite.openDatabaseSync("travel_diary.db");

// --------------------
// Initialize database
// --------------------

export function initDatabase() {
  db.execAsync(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trip_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips (id)
    );
  `);
}

// --------------------
// Save completed trip
// --------------------

export async function saveTrip(
  startTime: number,
  endTime: number,
  points: {
    latitude: number;
    longitude: number;
    speed: number | null;
    timestamp: number;
  }[]
) {
  // Insert trip metadata
  const result = await db.runAsync(
    "INSERT INTO trips (start_time, end_time) VALUES (?, ?);",
    [startTime, endTime]
  );

  const tripId = result.lastInsertRowId;
  if (!tripId) return;

  // Insert GPS points
  for (const p of points) {
    await db.runAsync(
      `
      INSERT INTO trip_points
        (trip_id, latitude, longitude, speed, timestamp)
      VALUES (?, ?, ?, ?, ?);
      `,
      [tripId, p.latitude, p.longitude, p.speed, p.timestamp]
    );
  }
}
