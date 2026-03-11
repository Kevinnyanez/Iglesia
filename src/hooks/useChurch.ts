import { useQuery } from '@tanstack/react-query';
import { churchService } from '../services/church.service';
import { queryKeys } from '../utils/queryKeys';

export function useCurrentUserChurch() {
  return useQuery({
    queryKey: queryKeys.churches,
    queryFn: () => churchService.getCurrentUserChurch(),
  });
}
