import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import { Top, Spacing, Border, Button, Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { MessageBanner } from 'components/MessageBanner';
import { getToday } from 'utils/date';
import { useRooms } from 'hooks/useRooms';
import { useReservations } from 'hooks/useReservations';
import { useMyReservations } from './hooks/useMyReservations';
import { useNavigationMessage } from './hooks/useNavigationMessage';
import { useCancelReservation } from './hooks/useCancelReservation';
import { Timeline } from './components/Timeline';
import { MyReservationList } from './components/MyReservationList';

export function ReservationStatusPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(getToday());

  const navigationMessage = useNavigationMessage();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    navigationMessage ? { type: 'success', text: navigationMessage } : null
  );

  const rooms = useRooms();
  const reservations = useReservations(date);
  const myReservations = useMyReservations();
  const { cancelReservationById } = useCancelReservation({
    onCancelSuccess: text => setMessage({ type: 'success', text }),
    onCancelFailed: text => setMessage({ type: 'error', text }),
  });

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
        <Timeline rooms={rooms} reservations={reservations} />
      </div>

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {message && <MessageBanner type={message.type} text={message.text} />}

      <MyReservationList reservations={myReservations} rooms={rooms} onCancel={cancelReservationById} />

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
