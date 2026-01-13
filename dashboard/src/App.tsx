import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type TripSummary = {
  city: string;
  distance_km: number;
  duration_min: number;
  avg_speed: number;
  mode: string;
  hour_bucket: string;
  date: string;
};

export default function App() {
  const [trips, setTrips] = useState<TripSummary[]>([]);

  useEffect(() => {
    async function loadTrips() {
      const snapshot = await getDocs(collection(db, "trip_summaries"));
      const data = snapshot.docs.map((doc) => doc.data() as TripSummary);
      setTrips(data);
    }

    loadTrips();
  }, []);

  // -----------------------------
  // Aggregations
  // -----------------------------

  // Trips per hour
  const tripsPerHour: Record<string, number> = {};
  trips.forEach((t) => {
    tripsPerHour[t.hour_bucket] =
      (tripsPerHour[t.hour_bucket] || 0) + 1;
  });

  const tripsPerHourData = Object.entries(tripsPerHour).map(
    ([hour, count]) => ({
      hour,
      trips: count,
    })
  );

  // Mode split
  const modeCount: Record<string, number> = {};
  trips.forEach((t) => {
    modeCount[t.mode] = (modeCount[t.mode] || 0) + 1;
  });

  const modeData = Object.entries(modeCount).map(
    ([mode, count]) => ({
      name: mode,
      value: count,
    })
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Travel Diary – Government Dashboard</h1>
      <p>Total trips collected: {trips.length}</p>

      {/* Trips per hour */}
      <h2>Trips per Hour</h2>
      <BarChart width={500} height={300} data={tripsPerHourData}>
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="trips" fill="#8884d8" />
      </BarChart>

      {/* Mode split */}
      <h2>Mode Split</h2>
      <PieChart width={400} height={300}>
        <Pie
          data={modeData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {modeData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}
