import { useState } from 'react';
import { type ParamsConfig } from 'utils/searchParams';
import { type ValidationRule } from 'utils/validation';
import { getToday } from 'utils/date';

interface FilterState {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: string[];
  preferredFloor: number | null;
}

const DEFAULT_FILTER: FilterState = {
  date: getToday(),
  startTime: '',
  endTime: '',
  attendees: 1,
  equipment: [],
  preferredFloor: null,
};

export const FILTER_VALIDATION_RULES: ValidationRule<FilterState>[] = [
  {
    check: filter => filter.endTime <= filter.startTime,
    message: '종료 시간은 시작 시간보다 늦어야 합니다.',
  },
  {
    check: filter => filter.attendees < 1,
    message: '참석 인원은 1명 이상이어야 합니다.',
  },
];

export const FILTER_PARAMS_CONFIG: ParamsConfig<FilterState> = {
  date: { urlKey: 'date', defaultValue: getToday(), parse: v => v, serialize: v => v || null },
  startTime: { urlKey: 'startTime', defaultValue: '', parse: v => v, serialize: v => v || null },
  endTime: { urlKey: 'endTime', defaultValue: '', parse: v => v, serialize: v => v || null },
  attendees: {
    urlKey: 'attendees',
    defaultValue: 1,
    parse: v => Number(v),
    serialize: v => (v > 1 ? String(v) : null),
  },
  equipment: {
    urlKey: 'equipment',
    defaultValue: [],
    parse: v => v.split(',').filter(Boolean),
    serialize: v => (v.length > 0 ? v.join(',') : null),
  },
  preferredFloor: {
    urlKey: 'floor',
    defaultValue: null,
    parse: v => Number(v),
    serialize: v => (v !== null ? String(v) : null),
  },
};

interface UseBookingFilterOptions {
  initialFilter?: Partial<FilterState>;
  onFilterChange?: (filter: FilterState) => void;
}

export function useBookingFilter({ initialFilter, onFilterChange }: UseBookingFilterOptions = {}) {
  const [filter, setFilter] = useState<FilterState>({ ...DEFAULT_FILTER, ...initialFilter });

  const updateFilter = (patch: Partial<FilterState>) => {
    setFilter(prev => {
      const next = { ...prev, ...patch };
      onFilterChange?.(next);
      return next;
    });
  };

  const toggleEquipment = (eq: string) => {
    const prev = filter.equipment;
    const next = prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq];
    updateFilter({ equipment: next });
  };

  return {
    filter,
    updateFilter,
    toggleEquipment,
  };
}
