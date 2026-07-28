"use client";

import { useMutation } from "@tanstack/react-query";
import { generateWeeklyPlan } from "@/app/services/ai-coach.service";

export function useAiCoach() {
  return useMutation({
    mutationFn: generateWeeklyPlan,
  });
}