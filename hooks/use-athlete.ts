"use client";

import { useQuery } from "@tanstack/react-query";
import { getAthlete } from "../services/athlete.service";

export function useAthlete() {
  return useQuery({
    queryKey: ["athlete"],
    queryFn: getAthlete,
  });
}