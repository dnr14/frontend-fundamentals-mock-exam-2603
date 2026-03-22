import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { css } from '@emotion/react';
import { Top, Spacing, Border, Button, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { getToday } from 'utils/date';
import { useReservationStatus } from './hooks/useReservationStatus';
import { useCancelReservation } from './hooks/useCancelReservation';
import { Timeline } from './components/Timeline';
import { MyReservationList } from './components/MyReservationList';

export function ReservationStatusPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [date, setDate] = useState(getToday());

  // 페이지 진입 시 일회성 알림 (예약 완료)
  const locationState = location.state as { message?: string } | null;
  const [navigationMessage, setNavigationMessage] = useState<string | null>(
    locationState?.message ?? null
  );

  useEffect(() => {
    if (locationState?.message) {
      window.history.replaceState({}, '');
    }
  }, [locationState]);

  // 취소 액션 피드백
  const [cancelMessage, setCancelMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { cancelReservationById } = useCancelReservation({
    onCancelSuccess: message => {
      setCancelMessage({ type: 'success', text: message });
      setNavigationMessage(null);
    },
    onCancelFailed: message => {
      setCancelMessage({ type: 'error', text: message });
    },
  });

  const { rooms, reservations, myReservations, getRoomName } = useReservationStatus({ date });

  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);

  const reservationsByRoom = useMemo(() => {
    const map: Record<string, typeof reservations> = {};
    for (const r of reservations) {
      if (!map[r.roomId]) map[r.roomId] = [];
      map[r.roomId].push(r);
    }
    return map;
  }, [reservations]);

  const handleCancel = (id: string) => {
    if (window.confirm('정말 취소하시겠습니까?')) {
      cancelReservationById(id);
    }
  };

  // 표시할 메시지 결정: cancel 메시지 우선, 없으면 navigation 메시지
  const displayMessage = cancelMessage
    ?? (navigationMessage ? { type: 'success' as const, text: navigationMessage } : null);

  return (
    <div
      css={css`
        background: ${colors.white};
        padding-bottom: 40px;
      `}
    >
      <Top.Top03
        css={css`
          padding-left: 24px;
          padding-right: 24px;
        `}
      >
        회의실 예약
      </Top.Top03>

      <Spacing size={24} />

      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          날짜 선택
        </Text>
        <Spacing size={16} />
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 6px;
          `}
        >
          <input
            type="date"
            value={date}
            min={getToday()}
            onChange={e => setDate(e.target.value)}
            aria-label="날짜"
            css={css`
              box-sizing: border-box;
              font-size: 16px;
              font-weight: 500;
              line-height: 1.5;
              height: 48px;
              background-color: ${colors.grey50};
              border-radius: 12px;
              color: ${colors.grey800};
              width: 100%;
              border: 1px solid ${colors.grey200};
              padding: 0 16px;
              outline: none;
              transition: border-color 0.15s;
              &:focus {
                border-color: ${colors.blue500};
              }
            `}
          />
        </div>
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 현황
        </Text>
        <Spacing size={16} />
        <Timeline
          rooms={rooms}
          reservationsByRoom={reservationsByRoom}
          activeReservationId={activeReservationId}
          onReservationClick={setActiveReservationId}
        />
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {displayMessage && (
        <div
          css={css`
            padding: 0 24px;
          `}
        >
          <div
            css={css`
              padding: 10px 14px;
              border-radius: 10px;
              background: ${displayMessage.type === 'success' ? colors.blue50 : colors.red50};
              display: flex;
              align-items: center;
              gap: 8px;
            `}
          >
            <Text
              typography="t7"
              fontWeight="medium"
              color={displayMessage.type === 'success' ? colors.blue600 : colors.red500}
            >
              {displayMessage.text}
            </Text>
          </div>
          <Spacing size={12} />
        </div>
      )}

      <MyReservationList reservations={myReservations} getRoomName={getRoomName} onCancel={handleCancel} />

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      <div
        css={css`
          padding: 0 24px;
        `}
      >
        <Button display="full" onClick={() => navigate('/booking')}>
          예약하기
        </Button>
      </div>
      <Spacing size={24} />
    </div>
  );
}
