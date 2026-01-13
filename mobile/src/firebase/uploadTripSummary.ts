import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

type TripSummaryUpload = {
  city: string;
  distance_km: number;
  duration_min: number;
  avg_speed: number;
  mode: string;
  hour_bucket: string;
  date: string;
};

export async function uploadTripSummary(summary: TripSummaryUpload) {
  try {
    await addDoc(collection(db, "trip_summaries"), {
      ...summary,
      createdAt: serverTimestamp(),
    });

    console.log("☁️ Trip summary uploaded");
  } catch (error) {
    console.log("❌ Failed to upload trip summary:", error);
  }
}
