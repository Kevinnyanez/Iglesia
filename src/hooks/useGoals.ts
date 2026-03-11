import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsService, type CreateGoalPayload, type MarkGoalProgressPayload } from '../services/goals.service';
import { queryKeys } from '../utils/queryKeys';

export function useUserGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => goalsService.fetchUserGoals(),
  });
}

export function useGoalProgress(goalId?: string) {
  return useQuery({
    queryKey: queryKeys.goalProgress(goalId ?? ''),
    queryFn: () => goalsService.fetchGoalProgress(goalId as string),
    enabled: Boolean(goalId),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => goalsService.createGoal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
    },
  });
}

export function useMarkGoalProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkGoalProgressPayload) => goalsService.markGoalProgress(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goalProgress(result.goal_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStreak });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => goalsService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.userStreak });
    },
  });
}
