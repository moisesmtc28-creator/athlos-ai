"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Athlete = {
  name: string;
  age: number;
  height: number;
  currentWeight: number;
  goalWeight: number;
  maxHeartRate: number;
};

type AthleteStore = {
  athlete: Athlete;
  updateAthlete: (data: Partial<Athlete>) => void;
  resetAthlete: () => void;
};

const initialAthlete: Athlete = {
  name: "",
  age: 0,
  height: 0,
  currentWeight: 0,
  goalWeight: 0,
  maxHeartRate: 0,
};

export const useAthleteStore = create<AthleteStore>()(
  persist(
    (set) => ({
      athlete: initialAthlete,

      updateAthlete: (data) =>
        set((state) => ({
          athlete: {
            ...state.athlete,
            ...data,
          },
        })),

      resetAthlete: () =>
        set({
          athlete: initialAthlete,
        }),
    }),
    {
      name: "athlos-athlete",
    },
  ),
);