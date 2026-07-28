"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAthleteProfile,
  saveAthleteProfile,
} from "../services/athlete-profile.service";

import type { AthleteProfile } from "../types/athlete-profile";

const ATHLETE_PROFILE_QUERY_KEY = ["athlete-profile"];

export function useAthleteProfile() {
  return useQuery({
    queryKey: ATHLETE_PROFILE_QUERY_KEY,
    queryFn: getAthleteProfile,
  });
}

export function useSaveAthleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: AthleteProfile) =>
      saveAthleteProfile(profile),

    onSuccess: (savedProfile) => {
      queryClient.setQueryData(
        ATHLETE_PROFILE_QUERY_KEY,
        savedProfile,
      );

      queryClient.invalidateQueries({
        queryKey: ATHLETE_PROFILE_QUERY_KEY,
      });
    },
  });
}