import { useQuery } from '@tanstack/react-query';
import { getRooms } from 'pages/remotes';

interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipment: string[];
}

export function useRooms() {
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ['rooms'], queryFn: getRooms });
  return rooms;
}
