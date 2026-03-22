import { useQuery } from '@tanstack/react-query';
import { getMyReservations } from 'pages/remotes';

interface Reservation {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

export function useMyReservations() {
  const { data: myReservations = [] } = useQuery<Reservation[]>({
    queryKey: ['myReservations'],
    queryFn: getMyReservations,
  });
  return myReservations;
}
