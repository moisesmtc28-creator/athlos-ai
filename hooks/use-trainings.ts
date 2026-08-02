"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainings } from "../services/training.service";

export function useTrainings() {
  return useQuery({
    queryKey: ["trainings"],
    queryFn: getTrainings,
  });
}