import { type ReactNode } from 'react';
import { css } from '@emotion/react';
import { Spacing, Text, Select } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';


const inputStyle = css`
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
`;

const fieldColumnStyle = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const fieldRowStyle = css`
  display: flex;
  gap: 12px;
`;


interface FilterPanelProps {
  validationError?: string | null;
  children: ReactNode;
}

function FilterPanelRoot({ validationError, children }: FilterPanelProps) {
  return (
    <div
      css={css`
        padding: 0 24px;
      `}
    >
      <Text typography="t5" fontWeight="bold" color={colors.grey900}>
        예약 조건
      </Text>
      <Spacing size={16} />
      <div
        css={css`
          display: flex;
          flex-direction: column;
          gap: 14px;
        `}
      >
        {children}
      </div>
      {validationError && (
        <>
          <Spacing size={8} />
          <span
            css={css`
              color: ${colors.red500};
              font-size: 14px;
            `}
            role="alert"
          >
            {validationError}
          </span>
        </>
      )}
    </div>
  );
}


interface DateFieldProps {
  value: string;
  min: string;
  onChange: (value: string) => void;
}

function DateField({ value, min, onChange }: DateFieldProps) {
  return (
    <div css={fieldColumnStyle}>
      <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
        날짜
      </Text>
      <input
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        aria-label="날짜"
        css={inputStyle}
      />
    </div>
  );
}


interface TimeRangeProps {
  startTime: string;
  endTime: string;
  startTimeSlots: string[];
  endTimeSlots: string[];
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
}

function TimeRange({
  startTime,
  endTime,
  startTimeSlots,
  endTimeSlots,
  onStartTimeChange,
  onEndTimeChange,
}: TimeRangeProps) {
  return (
    <div css={fieldRowStyle}>
      <div css={css`${fieldColumnStyle}; flex: 1;`}>
        <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
          시작 시간
        </Text>
        <Select value={startTime} onChange={e => onStartTimeChange(e.target.value)} aria-label="시작 시간">
          <option value="">선택</option>
          {startTimeSlots.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
      <div css={css`${fieldColumnStyle}; flex: 1;`}>
        <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
          종료 시간
        </Text>
        <Select value={endTime} onChange={e => onEndTimeChange(e.target.value)} aria-label="종료 시간">
          <option value="">선택</option>
          {endTimeSlots.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

interface AttendeesProps {
  value: number;
  onChange: (value: number) => void;
}

function Attendees({ value, onChange }: AttendeesProps) {
  return (
    <div css={fieldColumnStyle}>
      <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
        참석 인원
      </Text>
      <input
        type="number"
        min={1}
        value={value}
        onChange={e => onChange(Math.max(1, Number(e.target.value)))}
        aria-label="참석 인원"
        css={inputStyle}
      />
    </div>
  );
}

interface FloorProps {
  value: number | null;
  floors: number[];
  onChange: (value: number | null) => void;
}

function Floor({ value, floors, onChange }: FloorProps) {
  return (
    <div css={fieldColumnStyle}>
      <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
        선호 층
      </Text>
      <Select
        value={value ?? ''}
        onChange={e => {
          const selected = e.target.value;
          onChange(selected === '' ? null : Number(selected));
        }}
        aria-label="선호 층"
      >
        <option value="">전체</option>
        {floors.map(f => (
          <option key={f} value={f}>{f}층</option>
        ))}
      </Select>
    </div>
  );
}

const EQUIPMENTS = [
  { key: 'tv', label: 'TV' },
  { key: 'whiteboard', label: '화이트보드' },
  { key: 'video', label: '화상장비' },
  { key: 'speaker', label: '스피커' },
] as const;

interface EquipmentProps {
  selected: string[];
  onToggle: (equipment: string) => void;
}

function Equipment({ selected, onToggle }: EquipmentProps) {
  return (
    <div>
      <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>
        필요 장비
      </Text>
      <Spacing size={8} />
      <div
        css={css`
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        `}
      >
        {EQUIPMENTS.map(({ key, label }) => {
          const isSelected = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-label={label}
              aria-pressed={isSelected}
              css={css`
                padding: 8px 16px;
                border-radius: 20px;
                border: 1px solid ${isSelected ? colors.blue500 : colors.grey200};
                background: ${isSelected ? colors.blue50 : colors.grey50};
                color: ${isSelected ? colors.blue600 : colors.grey700};
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
                &:hover {
                  border-color: ${isSelected ? colors.blue500 : colors.grey400};
                }
              `}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      css={css`
        ${fieldRowStyle};
        > * {
          flex: 1;
        }
      `}
    >
      {children}
    </div>
  );
}

export const FilterPanel = Object.assign(FilterPanelRoot, {
  Date: DateField,
  TimeRange,
  Attendees,
  Floor,
  Equipment,
  Row,
});
