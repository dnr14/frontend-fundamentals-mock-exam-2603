interface TimeSlotRange {
  startHour: number;
  startMinute: 0 | 30;
  endHour: number;
  endMinute: 0 | 30;
}

function generateTimeSlots({ startHour, startMinute, endHour, endMinute }: TimeSlotRange): string[] {
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const slotCount = Math.floor((endTotal - startTotal) / 30) + 1;

  return Array.from({ length: slotCount }, (_, i) => {
    const minutes = startTotal + i * 30;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  });
}

export function getStartTimeSlots() {
  return generateTimeSlots({ startHour: 9, startMinute: 0, endHour: 19, endMinute: 30 });
}

export function getEndTimeSlots() {
  return generateTimeSlots({ startHour: 9, startMinute: 30, endHour: 20, endMinute: 0 });
}
