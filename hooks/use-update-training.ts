"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  updateTraining,
  type UpdateTrainingInput,
} from "@/services/training-update.service";

export function useUpdateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTrainingInput) =>
      updateTraining(input),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["training", variables.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["trainings"],
      });
    },
  });
}