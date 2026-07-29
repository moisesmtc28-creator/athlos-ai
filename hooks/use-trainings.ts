"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainings } from "@/app/services/training.service";

export function useTrainings() {
  return useQuery({
    queryKey: ["trainings"],
    queryFn: getTrainings,
  });
}