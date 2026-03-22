import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelReservation } from 'pages/remotes';

interface UseCancelReservationOptions {
  onCancelSuccess: (message: string) => void;
  onCancelFailed: (message: string) => void;
}

export function useCancelReservation({ onCancelSuccess, onCancelFailed }: UseCancelReservationOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cancelReservation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['myReservations'] });
      onCancelSuccess('예약이 취소되었습니다.');
    },
    onError: () => {
      onCancelFailed('취소에 실패했습니다.');
    },
  });

  const cancelReservationById = (id: string) => mutation.mutate(id);

  return {
    cancelReservationById,
    isCancelling: mutation.isPending,
  };
}
