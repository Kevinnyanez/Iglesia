import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityService, type CreateCommunityPayload, type UpdateCommunityPayload } from '../services/community.service';
import { communityGoalsService, type CreateCommunityGoalPayload } from '../services/communityGoals.service';
import { communityMeetingsService, type CreateCommunityMeetingPayload } from '../services/communityMeetings.service';
import {
  communityEventsService,
  type CreateCommunityEventPayload,
} from '../services/communityEvents.service';
import { queryKeys } from '../utils/queryKeys';

export function useMyCommunities() {
  return useQuery({
    queryKey: queryKeys.myCommunities,
    queryFn: () => communityService.fetchUserCommunities(),
  });
}

export function useCommunityMembers(communityId?: string) {
  return useQuery({
    queryKey: queryKeys.communityMembers(communityId ?? ''),
    queryFn: () => communityService.fetchCommunityMembers(communityId as string),
    enabled: Boolean(communityId),
  });
}

export function useCommunityById(communityId?: string) {
  return useQuery({
    queryKey: ['community', communityId],
    queryFn: () => communityService.fetchCommunityById(communityId as string),
    enabled: Boolean(communityId),
  });
}

export function useCreateCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityPayload) => communityService.createCommunity(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.churches });
    },
  });
}

export function useUpdateCommunity(communityId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCommunityPayload) => communityService.updateCommunity(communityId!, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.publicCommunities });
      queryClient.invalidateQueries({ queryKey: ['community', data.id] });
    },
  });
}

export function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) => communityService.joinCommunity(communityId),
    onSuccess: (_data, communityId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.myJoinRequestStatus(communityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.communityJoinRequests(communityId) });
    },
  });
}

export function useLeaveCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) => communityService.leaveCommunity(communityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
    },
  });
}

export function useMyJoinRequestStatus(communityId?: string) {
  return useQuery({
    queryKey: queryKeys.myJoinRequestStatus(communityId ?? ''),
    queryFn: () => communityService.getMyJoinRequestStatus(communityId!),
    enabled: Boolean(communityId),
  });
}

export function useJoinRequests(communityId?: string) {
  return useQuery({
    queryKey: queryKeys.communityJoinRequests(communityId ?? ''),
    queryFn: () => communityService.fetchJoinRequests(communityId!),
    enabled: Boolean(communityId),
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => communityService.approveJoinRequest(requestId),
    onSuccess: (communityId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.communityJoinRequests(communityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.communityMembers(communityId) });
    },
  });
}

export function useRejectJoinRequest(communityId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => communityService.rejectJoinRequest(requestId),
    onSuccess: () => {
      if (communityId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.communityJoinRequests(communityId) });
      }
    },
  });
}

export function usePublicCommunities() {
  return useQuery({
    queryKey: queryKeys.publicCommunities,
    queryFn: () => communityService.listPublicCommunities(),
  });
}

export function useCommunityGoals(communityId?: string) {
  return useQuery({
    queryKey: queryKeys.communityGoals(communityId ?? ''),
    queryFn: () => communityGoalsService.fetchByCommunity(communityId!),
    enabled: Boolean(communityId),
  });
}

export function useCreateCommunityGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityGoalPayload) => communityGoalsService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityGoals(data.community_id) });
    },
  });
}

export function useDeleteCommunityGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, communityId }: { goalId: string; communityId: string }) =>
      communityGoalsService.delete(goalId, communityId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityGoals(communityId) });
    },
  });
}

export function useCommunityMeetings(communityId?: string) {
  return useQuery({
    queryKey: ['communities', 'meetings', communityId ?? ''],
    queryFn: () => communityMeetingsService.fetchByCommunity(communityId!),
    enabled: Boolean(communityId),
  });
}

export function useCreateCommunityMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityMeetingPayload) => communityMeetingsService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'meetings', data.community_id] });
    },
  });
}

export function useDeleteCommunityMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, communityId }: { meetingId: string; communityId: string }) =>
      communityMeetingsService.delete(meetingId, communityId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'meetings', communityId] });
    },
  });
}

export function useCommunityEvents(communityId?: string) {
  return useQuery({
    queryKey: ['communities', 'events', communityId ?? ''],
    queryFn: async () => {
      try {
        return await communityEventsService.fetchByCommunity(communityId!);
      } catch {
        return [];
      }
    },
    enabled: Boolean(communityId),
  });
}

export function useCreateCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityEventPayload) => communityEventsService.create(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'events', data.community_id] });
    },
  });
}

export function useDeleteCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, communityId }: { eventId: string; communityId: string }) =>
      communityEventsService.delete(eventId, communityId),
    onSuccess: (_, { communityId }) => {
      queryClient.invalidateQueries({ queryKey: ['communities', 'events', communityId] });
    },
  });
}
