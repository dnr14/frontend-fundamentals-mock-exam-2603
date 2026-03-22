import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { css } from '@emotion/react';
import { Top, Spacing, Border, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { BackButton } from './components/BackButton';
import { FilterPanel } from './components/FilterPanel';
import { AvailableRoomList } from './components/AvailableRoomList';
import { useBookingFilter, FILTER_PARAMS_CONFIG, FILTER_VALIDATION_RULES } from './hooks/useBookingFilter';
import { getStartTimeSlots, getEndTimeSlots } from './utils/time';
import { getToday } from 'utils/date';
import { parseFromParams, toSearchParams } from 'utils/searchParams';
import { validate } from 'utils/validation';
import { useRooms } from './hooks/useRooms';
import { useCreateBooking } from './hooks/useCreateBooking';

export function RoomBookingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { createBooking, isBooking } = useCreateBooking({
    onBookingSuccess: () => navigate('/', { state: { message: '예약이 완료되었습니다!' } }),
    onBookingFailed: message => {
      setErrorMessage(message);
      setSelectedRoomId(null);
    },
  });

  const { filter, updateFilter, toggleEquipment } = useBookingFilter({
    initialFilter: parseFromParams(searchParams, FILTER_PARAMS_CONFIG),
    onFilterChange: nextFilter => {
      setSearchParams(toSearchParams(nextFilter, FILTER_PARAMS_CONFIG), { replace: true });
      setSelectedRoomId(null);
      setErrorMessage(null);
    },
  });

  const { rooms, availableRooms } = useRooms({ filter });
  const floors = [...new Set(rooms.map((r: { floor: number }) => r.floor))].sort((a, b) => a - b);

  const hasTimeInputs = filter.startTime !== '' && filter.endTime !== '';
  const validationError = hasTimeInputs ? validate(filter, FILTER_VALIDATION_RULES) : null;
  const isFilterComplete = hasTimeInputs && !validationError;

  const handleBook = () => {
    if (!selectedRoomId) {
      setErrorMessage('회의실을 선택해주세요.');
      return;
    }
    createBooking({
      roomId: selectedRoomId,
      date: filter.date,
      start: filter.startTime,
      end: filter.endTime,
      attendees: filter.attendees,
      equipment: filter.equipment,
    });
  };

  return (
    <div
      css={css`
        background: ${colors.white};
        padding-bottom: 40px;
      `}
    >
      <BackButton onClick={() => navigate('/')} />
      <Top.Top03
        css={css`
          padding-left: 24px;
          padding-right: 24px;
        `}
      >
        예약하기
      </Top.Top03>

      {errorMessage && (
        <div
          css={css`
            padding: 0 24px;
          `}
        >
          <Spacing size={12} />
          <div
            css={css`
              padding: 10px 14px;
              border-radius: 10px;
              background: ${colors.red50};
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <Text typography="t7" fontWeight="medium" color={colors.red500}>
              {errorMessage}
            </Text>
          </div>
        </div>
      )}

      <Spacing size={24} />

      <FilterPanel validationError={validationError}>
        <FilterPanel.Date value={filter.date} min={getToday()} onChange={value => updateFilter({ date: value })} />
        <FilterPanel.TimeRange
          startTime={filter.startTime}
          endTime={filter.endTime}
          startTimeSlots={getStartTimeSlots()}
          endTimeSlots={getEndTimeSlots()}
          onStartTimeChange={value => updateFilter({ startTime: value })}
          onEndTimeChange={value => updateFilter({ endTime: value })}
        />
        <FilterPanel.Row>
          <FilterPanel.Attendees value={filter.attendees} onChange={value => updateFilter({ attendees: value })} />
          <FilterPanel.Floor
            value={filter.preferredFloor}
            floors={floors}
            onChange={value => updateFilter({ preferredFloor: value })}
          />
        </FilterPanel.Row>
        <FilterPanel.Equipment selected={filter.equipment} onToggle={toggleEquipment} />
      </FilterPanel>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {isFilterComplete && (
        <AvailableRoomList
          availableRooms={availableRooms}
          selectedRoomId={selectedRoomId}
          isBooking={isBooking}
          onSelectRoom={setSelectedRoomId}
          onBook={handleBook}
        />
      )}

      <Spacing size={24} />
    </div>
  );
}
