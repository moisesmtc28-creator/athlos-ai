import { Athlete } from "@/types/athlete";

export const mockAthlete: Athlete = {
  id: "1",

  name: "Moisés",

  age: 41,

  height: 192,

  currentWeight: 120,

  goalWeight: 105,

  maxHeartRate: 180,

  restingHeartRate: 60,

  ftp: 220,

  bike: "MTB",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
};