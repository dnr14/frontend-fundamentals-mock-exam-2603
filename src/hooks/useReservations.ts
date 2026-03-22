import { useQuery } from '@tanstack/react-query';
import { getReservations } from 'pages/remotes';

interface Reservation {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

export function useReservations(date: string) {
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations', date],
    queryFn: () => getReservations(date),
    enabled: !!date,
  });
  return reservations;
}
