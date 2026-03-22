# useBookingFilter 훅 설계

## 역할

예약 필터 상태 관리만 담당하는 훅. URL 동기화, 검증은 소비하는 쪽의 관심사.

## 관심사 분리 과정

### 1단계: 모놀리식 페이지

처음에는 `RoomBookingPage` 안에 필터 상태, URL 동기화(`useEffect`), 검증 로직, 에러 메시지, 선택된 방 ID가 모두 섞여 있었다.

### 2단계: 훅 추출 + 불필요한 관심사 제거

필터 훅으로 분리하면서 필터와 무관한 상태들을 밖으로 이동했다.

- `errorMessage` → 예약 요청 에러이므로 `useCreateBooking`으로 이동
- `selectedRoomId` → 방 선택 UI 상태이므로 `index.tsx`로 이동

### 3단계: URL 동기화를 소비자에게 위임

기존에는 `setSearchParams`를 훅 내부에서 직접 호출했다. 문제:

- 훅이 `react-router-dom`에 의존하게 됨
- 필터 상태 관리와 URL 동기화는 별개 관심사

`onFilterChange` 콜백으로 변경된 필터 상태를 소비자에게 전달하고, URL 동기화는 소비자가 처리하도록 변경했다.

```tsx
// 훅 내부
const updateFilter = (patch: Partial<FilterState>) => {
  setFilter(prev => {
    const next = { ...prev, ...patch };
    onFilterChange?.(next);
    return next;
  });
};

// 소비하는 쪽 (index.tsx)
const { filter, updateFilter, toggleEquipment } = useBookingFilter({
  initialFilter: parseFromParams(searchParams, FILTER_PARAMS_CONFIG),
  onFilterChange: nextFilter => {
    setSearchParams(toSearchParams(nextFilter, FILTER_PARAMS_CONFIG), { replace: true });
    setSelectedRoomId(null);
    clearError();
  },
});
```

### 4단계: 개별 핸들러 제거 → updateFilter 직접 노출

기존에는 필터 필드마다 개별 핸들러를 만들어 export했다.

```tsx
// Before — 필드마다 보일러플레이트
const changeDate = (value: string) => updateFilter({ date: value });
const changeStartTime = (value: string) => updateFilter({ startTime: value });
// ...

return { changeDate, changeStartTime, changeEndTime, changeAttendees, changeFloor, ... };
```

5개 모두 `updateFilter({ field: value })` 호출하는 것뿐인 보일러플레이트. 필터 추가 시 훅에 핸들러 추가 → export → index.tsx import 연결까지 3곳을 수정해야 했다.

`updateFilter`를 직접 노출하고, 소비하는 쪽에서 호출하도록 변경했다.

```tsx
// After
return { filter, updateFilter, toggleEquipment };

// 소비하는 쪽
<FilterPanel.Date onChange={value => updateFilter({ date: value })} />
```

`toggleEquipment`만 이전 상태 기반 토글 로직이 있어서 별도로 남겼다. 단순 set이 아닌 상태 조작은 훅의 관심사.

### 5단계: 검증/URL config를 범용 유틸 + FilterState 기반 상수로 분리

기존에는 `validationError`, `isFilterComplete`를 훅 함수 안에서 계산해 반환했다. 문제:

- 검증 실행은 필터 상태 관리와 별개 관심사
- 검증 규칙이 훅 로직에 하드코딩되어 확장이 어려움

**범용 유틸**(`validate<T>`, `parseFromParams<T>`, `toSearchParams<T>`)은 `src/utils/`로 분리하고, **FilterState 기반 상수**(`FILTER_VALIDATION_RULES`, `FILTER_PARAMS_CONFIG`)는 `useBookingFilter.ts`에 응집시켰다.

```tsx
// src/utils/validation.ts — 범용 유틸
export function validate<T>(value: T, rules: ValidationRule<T>[]): string | null { ... }

// src/utils/searchParams.ts — 범용 유틸
export function parseFromParams<T>(searchParams: URLSearchParams, config: ParamsConfig<T>): Partial<T> { ... }
export function toSearchParams<T>(filter: T, config: ParamsConfig<T>): URLSearchParams { ... }

// useBookingFilter.ts — FilterState 기반 상수 응집
export const FILTER_VALIDATION_RULES: ValidationRule<FilterState>[] = [ ... ];
export const FILTER_PARAMS_CONFIG: ParamsConfig<FilterState> = { ... };

// index.tsx — 소비하는 쪽에서 조합
const validationError = hasTimeInputs ? validate(filter, FILTER_VALIDATION_RULES) : null;
const isFilterComplete = hasTimeInputs && !validationError;
```

FilterState에 필드가 추가되면 `useBookingFilter.ts` 한 파일에서 인터페이스, 기본값, URL config, 검증 규칙을 모두 수정할 수 있다.

## 콜백 패턴: onFilterChange

훅 내부에서 필터 변경 후 추가 동작(URL 동기화, 선택 초기화, 에러 클리어 등)을 직접 하지 않고, 변경된 필터 상태를 콜백 파라미터로 전달해 소비하는 쪽에 위임한다.

```tsx
useBookingFilter({
  onFilterChange: nextFilter => {
    setSearchParams(toSearchParams(nextFilter, FILTER_PARAMS_CONFIG), { replace: true });
    setSelectedRoomId(null);
    clearError();
  },
});
```

훅이 URL, 방 선택, 에러 상태를 알 필요가 없다.

### 이 설계의 이점

1. **외부 의존성 제거** — 훅이 `react-router-dom`(`useSearchParams`)을 직접 import하지 않으므로, 라우팅 라이브러리 변경이나 테스트 시 훅에 영향이 없다.

2. **부수효과의 제어권이 소비자에게 있다** — 필터 변경 시 URL 동기화 외에 어떤 동작을 할지(선택 초기화, 에러 클리어 등)는 페이지마다 다를 수 있다. 훅이 이를 하드코딩하면 다른 페이지에서 재사용할 때 불필요한 동작이 따라온다. 콜백으로 위임하면 소비자가 자신의 컨텍스트에 맞게 조합할 수 있다.

3. **훅의 역할이 단일해진다** — 상태 관리(읽기/쓰기)만 책임지고, "변경되었을 때 무엇을 할지"는 알지 못한다. 역할이 명확하므로 동작을 예측하기 쉽다.

4. **동기화 타이밍이 보장된다** — `useEffect`로 상태 변경을 감지하면 렌더 사이클이 끼어들지만, `updateFilter` 내부에서 `onFilterChange(next)`를 직접 호출하므로 상태 업데이트와 부수효과가 같은 이벤트 핸들러 안에서 동기적으로 실행된다.

## 최종 훅 인터페이스

```tsx
interface UseBookingFilterOptions {
  initialFilter?: Partial<FilterState>;
  onFilterChange?: (filter: FilterState) => void;
}

function useBookingFilter(options?: UseBookingFilterOptions): {
  filter: FilterState;
  updateFilter: (patch: Partial<FilterState>) => void;
  toggleEquipment: (eq: string) => void;
}
```

## 필터 추가/제거 시 변경 범위

| 작업 | 변경 위치 |
|------|-----------|
| `FilterState`에 필드 추가 | `useBookingFilter.ts` — 인터페이스, `DEFAULT_FILTER`, `FILTER_PARAMS_CONFIG` |
| 검증 규칙 추가 | `useBookingFilter.ts` — `FILTER_VALIDATION_RULES`에 한 줄 추가 |
| UI 연결 | 소비하는 쪽에서 `updateFilter({ newField: value })` |
