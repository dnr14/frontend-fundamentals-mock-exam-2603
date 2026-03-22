import { useRooms as useRoomsQuery } from 'hooks/useRooms';
import { useReservations } from 'hooks/useReservations';

interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  equipment: string[];
}

interface Reservation {
  roomId: string;
  date: string;
  start: string;
  end: string;
}

export interface RoomFilter {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: string[];
  preferredFloor: number | null;
}

function hasEnoughCapacity(room: Room, attendees: number) {
  return room.capacity >= attendees;
}

function hasRequiredEquipment(room: Room, equipment: string[]) {
  return equipment.every(eq => room.equipment.includes(eq));
}

function isOnPreferredFloor(room: Room, preferredFloor: number | null) {
  return preferredFloor === null || room.floor === preferredFloor;
}

function hasNoTimeConflict(room: Room, reservations: Reservation[], date: string, startTime: string, endTime: string) {
  return !reservations.some(r => r.roomId === room.id && r.date === date && r.start < endTime && r.end > startTime);
}

function byFloorThenName(a: Room, b: Room) {
  if (a.floor !== b.floor) return a.floor - b.floor;
  return a.name.localeCompare(b.name);
}

function filterRooms(rooms: Room[], reservations: Reservation[], filter: RoomFilter): Room[] {
  const { date, startTime, endTime, attendees, equipment, preferredFloor } = filter;

  return rooms.filter(
    room =>
      hasEnoughCapacity(room, attendees) &&
      hasRequiredEquipment(room, equipment) &&
      isOnPreferredFloor(room, preferredFloor) &&
      hasNoTimeConflict(room, reservations, date, startTime, endTime)
  );
}

interface UseRoomsParams {
  filter: RoomFilter;
}

export function useRooms({ filter }: UseRoomsParams) {
  const rooms = useRoomsQuery();
  const reservations = useReservations(filter.date);

  const availableRooms = filterRooms(rooms, reservations, filter).sort(byFloorThenName);

  return { rooms, availableRooms };
}
