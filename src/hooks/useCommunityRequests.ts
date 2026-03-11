import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { communityRequestService, type SubmitCommunityRequestPayload } from '../services/communityRequest.service';
import { queryKeys } from '../utils/queryKeys';

export function useCommunityRequests() {
  return useQuery({
    queryKey: queryKeys.communityRequests,
    queryFn: () => communityRequestService.fetchUserRequests(),
  });
}

export function useSubmitCommunityRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitCommunityRequestPayload) => communityRequestService.submitRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityRequests });
    },
  });
}

export function useApproveCommunityRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => communityRequestService.approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityRequests });
      queryClient.invalidateQueries({ queryKey: queryKeys.churches });
      queryClient.invalidateQueries({ queryKey: queryKeys.myCommunities });
    },
  });
}

export function useRejectCommunityRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => communityRequestService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.communityRequests });
    },
  });
}
