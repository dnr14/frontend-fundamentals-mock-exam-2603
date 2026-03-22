import { css } from '@emotion/react';
import { Text } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { EQUIPMENT_LABELS } from 'constants/equipment';

const TIMELINE_START = 9;
const TIMELINE_END = 20;
const TOTAL_MINUTES = (TIMELINE_END - TIMELINE_START) * 60;
const HOUR_LABELS = Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) =>
  `${String(TIMELINE_START + i).padStart(2, '0')}:00`
);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - TIMELINE_START) * 60 + m;
}

interface Room {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

interface TimelineProps {
  rooms: Room[];
  reservationsByRoom: Record<string, Reservation[]>;
  activeReservationId: string | null;
  onReservationClick: (id: string | null) => void;
}

export function Timeline({ rooms, reservationsByRoom, activeReservationId, onReservationClick }: TimelineProps) {
  return (
    <div
      css={css`
        background: ${colors.grey50};
        border-radius: 14px;
        padding: 16px;
      `}
    >
      <div
        css={css`
          display: flex;
          align-items: flex-end;
          margin-bottom: 8px;
        `}
      >
        <div
          css={css`
            width: 80px;
            flex-shrink: 0;
            padding-right: 8px;
          `}
        />
        <div
          css={css`
            flex: 1;
            position: relative;
            height: 18px;
          `}
        >
          {HOUR_LABELS.map(t => {
            const left = (timeToMinutes(t) / TOTAL_MINUTES) * 100;
            return (
              <Text
                key={t}
                typography="t7"
                fontWeight="regular"
                color={colors.grey400}
                css={css`
                  position: absolute;
                  left: ${left}%;
                  transform: translateX(-50%);
                  font-size: 10px;
                  letter-spacing: -0.3px;
                `}
              >
                {t.slice(0, 2)}
              </Text>
            );
          })}
        </div>
      </div>

      {rooms.map((room, index) => {
        const roomReservations = reservationsByRoom[room.id] ?? [];
        return (
          <div
            key={room.id}
            css={css`
              display: flex;
              align-items: center;
              height: 32px;
              ${index > 0 ? 'margin-top: 4px;' : ''}
            `}
          >
            <div
              css={css`
                width: 80px;
                flex-shrink: 0;
                padding-right: 8px;
              `}
            >
              <Text
                typography="t7"
                fontWeight="medium"
                color={colors.grey700}
                ellipsisAfterLines={1}
                css={css`
                  font-size: 12px;
                `}
              >
                {room.name}
              </Text>
            </div>
            <div
              css={css`
                flex: 1;
                height: 24px;
                background: ${colors.white};
                border-radius: 6px;
                position: relative;
                overflow: visible;
              `}
            >
              {roomReservations.map(res => {
                const left = (timeToMinutes(res.start) / TOTAL_MINUTES) * 100;
                const width = ((timeToMinutes(res.end) - timeToMinutes(res.start)) / TOTAL_MINUTES) * 100;
                const isActive = activeReservationId === res.id;
                return (
                  <div
                    key={res.id}
                    css={css`
                      position: absolute;
                      left: ${left}%;
                      width: ${width}%;
                      height: 100%;
                    `}
                  >
                    <div
                      role="button"
                      aria-label={`${room.name} ${res.start}-${res.end} 예약 상세`}
                      onClick={() => onReservationClick(isActive ? null : res.id)}
                      css={css`
                        width: 100%;
                        height: 100%;
                        background: ${colors.blue400};
                        border-radius: 4px;
                        opacity: ${isActive ? 1 : 0.75};
                        cursor: pointer;
                        transition: opacity 0.15s;
                        &:hover {
                          opacity: 1;
                        }
                      `}
                    />
                    {isActive && (
                      <div
                        role="tooltip"
                        css={css`
                          position: absolute;
                          top: 100%;
                          left: 50%;
                          transform: translateX(-50%);
                          margin-top: 6px;
                          background: ${colors.grey900};
                          color: ${colors.white};
                          padding: 8px 12px;
                          border-radius: 8px;
                          font-size: 12px;
                          white-space: nowrap;
                          z-index: 10;
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
                          line-height: 1.6;
                        `}
                      >
                        <div>
                          {res.start} ~ {res.end}
                        </div>
                        <div>{res.attendees}명</div>
                        {res.equipment.length > 0 && (
                          <div>{res.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
