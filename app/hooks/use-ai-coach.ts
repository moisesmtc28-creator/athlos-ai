"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateWeeklyPlan } from "@/app/services/ai-coach.service";

export function useAiCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateWeeklyPlan,
    onSuccess: (result) => {
      queryClient.setQueryData(["trainings"], result.trainings);
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
  });
}
