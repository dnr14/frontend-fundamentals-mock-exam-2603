import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReservation } from 'pages/remotes';
import axios from 'axios';

interface BookingParams {
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

interface UseCreateBookingOptions {
  onBookingSuccess: () => void;
  onBookingFailed: () => void;
}

export function useCreateBooking({ onBookingSuccess, onBookingFailed }: UseCreateBookingOptions) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: BookingParams) => createReservation(data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['myReservations'] });

      if ('ok' in result && result.ok) {
        onBookingSuccess();
        return;
      }

      const errResult = result as { message?: string };
      throw new Error(errResult.message ?? '예약에 실패했습니다.');
    },
    onError: (err: unknown) => {
      let message = '예약에 실패했습니다.';
      if (err instanceof Error) {
        message = err.message;
      } else if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        message = data?.message ?? message;
      }
      setErrorMessage(message);
      onBookingFailed();
    },
  });

  const createBooking = (params: BookingParams) => mutation.mutate(params);

  return {
    createBooking,
    isBooking: mutation.isPending,
    errorMessage,
    setErrorMessage,
    clearError: () => setErrorMessage(null),
  };
}
