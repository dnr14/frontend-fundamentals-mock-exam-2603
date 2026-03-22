import { useQuery } from '@tanstack/react-query';
import { getRooms, getReservations, getMyReservations } from 'pages/remotes';

interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipment: string[];
}

interface Reservation {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

interface UseReservationStatusParams {
  date: string;
}

export function useReservationStatus({ date }: UseReservationStatusParams) {
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ['rooms'], queryFn: getRooms });
  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations', date],
    queryFn: () => getReservations(date),
    enabled: !!date,
  });
  const { data: myReservations = [] } = useQuery<Reservation[]>({
    queryKey: ['myReservations'],
    queryFn: getMyReservations,
  });

  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name ?? roomId;

  return { rooms, reservations, myReservations, getRoomName };
}
