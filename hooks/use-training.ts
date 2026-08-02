"use client";

import { useQuery } from "@tanstack/react-query";
import { getTrainingById } from "../services/training-details.service";

export function useTraining(id: string) {
  return useQuery({
    queryKey: ["training", id],
    queryFn: () => getTrainingById(id),
    enabled: Boolean(id),
  });
}