# 리팩토링 설계 원칙

이번 리팩토링의 초점은 **변화에 유연한 구조**입니다. 요구사항이 바뀔 때 수정 범위를 최소화하고, 변경이 예상되는 지점을 열어두는 데 집중했습니다. 두 페이지(RoomBookingPage, ReservationStatusPage)에 일관된 원칙을 적용했습니다.

### "변화에 유연한 구조"란?

변경이 왔을 때 **수정 범위가 한 곳으로 좁혀지는 구조**입니다. 두 가지 사례로 설명합니다.

**사례 1: validate — 검증 규칙 추가가 배열에 한 줄 추가로 끝남**

"30분 이상 예약만 허용" 요구사항이 추가되면, 규칙 배열에 한 줄만 넣으면 됩니다. `validate` 함수나 호출부는 수정할 필요 없습니다.

```diff
 // useBookingFilter.ts — 규칙 배열에 한 줄 추가
 export const FILTER_VALIDATION_RULES: ValidationRule<FilterState>[] = [
   { check: f => f.endTime <= f.startTime, message: '종료 시간은 시작 시간보다 늦어야 합니다.' },
   { check: f => f.attendees < 1, message: '참석 인원은 1명 이상이어야 합니다.' },
+  { check: f => diffMinutes(f.startTime, f.endTime) < 30, message: '30분 이상 예약해야 합니다.' },
 ];

// validate 함수 — 수정 불필요
export function validate<T>(value: T, rules: ValidationRule<T>[]): string | null {
  const violated = rules.find(rule => rule.check(value));
  return violated?.message ?? null;
}
```

각 규칙이 `check + message`로 자체 완결적이고, 인터페이스 자체가 이미 제네릭한 구조라 `<T>`로 여는 비용이 거의 없었습니다.

**사례 2: FilterPanel 컴파운드 패턴 — 필터 항목 추가/제거에 유연한 구조**

필터는 비즈니스 요구사항에 따라 항목 추가/제거가 자주 발생하는 영역입니다. 기존 단일 props 방식(16개 props)에서는 필터 항목 하나를 제거할 때 FilterPanel 내부 JSX, Props 인터페이스, index.tsx 3곳을 수정해야 했습니다. 컴파운드 패턴에서는 소비자(index.tsx) 1곳에서 끝납니다.

```diff
 <FilterPanel validationError={validationError}>
   <FilterPanel.Date value={filter.date} min={getToday()} onChange={...} />
   <FilterPanel.TimeRange startTime={...} endTime={...} ... />
-  <FilterPanel.Row>
-    <FilterPanel.Attendees value={filter.attendees} onChange={...} />
-    <FilterPanel.Floor value={filter.preferredFloor} floors={floors} onChange={...} />
-  </FilterPanel.Row>
+  <FilterPanel.Floor value={filter.preferredFloor} floors={floors} onChange={...} />
   <FilterPanel.Equipment selected={filter.equipment} onToggle={...} />
 </FilterPanel>
```

FilterPanel 컴포넌트 내부 수정이나 props 인터페이스 변경 없이, 소비자 측에서 해당 줄만 지우면 됩니다. 추가도 마찬가지로 서브 컴포넌트를 한 줄 넣으면 끝입니다. 레이아웃 결정권도 소비자에게 있어서, `FilterPanel.Row`로 감쌀지 각각 배치할지도 소비자가 결정합니다.

**사례 3: updateFilter — FilterState 필드 추가 시 기존 호출부 수정 불필요**

`updateFilter`가 `Partial<FilterState>`를 받으므로, FilterState에 새 필드가 추가되어도 기존 `updateFilter` 호출부는 수정할 필요가 없습니다.

개별 핸들러 방식이었다면 필드 추가 시 보일러플레이트가 발생합니다:

```tsx
// Before — 필드마다 개별 핸들러 (보일러플레이트)
// 1. 훅 내부에 핸들러 추가
const changeDate = (value: string) => updateFilter({ date: value });
const changeStartTime = (value: string) => updateFilter({ startTime: value });
const changePurpose = (value: string) => updateFilter({ purpose: value }); // 새 필드 — 핸들러 추가

// 2. 훅 return에 export 추가
return { changeDate, changeStartTime, ..., changePurpose };

// 3. 소비하는 쪽에서 import 연결
const { changeDate, changeStartTime, ..., changePurpose } = useBookingFilter(...);
<FilterPanel.Purpose onChange={changePurpose} />
```

`updateFilter`를 직접 노출하면 이 보일러플레이트가 사라집니다:

```tsx
// After — Partial<FilterState>를 받는 updateFilter
const updateFilter = (patch: Partial<FilterState>) => {
  setFilter(prev => {
    const next = { ...prev, ...patch };
    onFilterChange?.(next);
    return next;
  });
};

// 소비하는 쪽 — 기존 코드 수정 없이 새 필드만 추가
<FilterPanel.Date onChange={value => updateFilter({ date: value })} />       // 기존 — 변경 없음
<FilterPanel.Purpose onChange={value => updateFilter({ purpose: value })} /> // 새 필드 — 추가만
```

훅에 핸들러 추가 → export → import 연결의 3단계가 사라지고, 소비하는 쪽에서 `updateFilter({ newField: value })` 한 줄이면 됩니다. FilterState 인터페이스에 필드를 추가하면, `DEFAULT_FILTER`, `FILTER_PARAMS_CONFIG`, `FILTER_VALIDATION_RULES`가 같은 파일(`useBookingFilter.ts`)에 응집되어 있으므로 한 파일에서 수정이 끝납니다.

---

이 세 사례의 공통점은 **변경 지점이 열려 있고, 수정 범위가 한 곳으로 좁혀진다**는 것입니다. 아래에서 이 원칙을 뒷받침하는 설계 결정들을 설명합니다.

## 1. 관심사 분리: UI <- State/Logic <- Data

페이지 컴포넌트는 **조합 레이어**입니다. 훅에서 데이터를 받고 UI 컴포넌트에 내려주는 역할만 합니다.

```
페이지(index.tsx) — 훅 조합 + 상태 연결 + 이벤트 핸들링
  ├── 공통 쿼리 훅 (useRooms, useReservations) — 데이터 조회
  ├── 페이지 레벨 훅 (useAvailableRooms, useCancelReservation) — 비즈니스 로직
  └── UI 컴포넌트 (Timeline, MyReservationList, FilterPanel) — 렌더링
```

## 2. 훅은 상태 관리만, 부수효과는 콜백으로 위임

훅이 비즈니스로 좁혀져 있어도(`useCreateBooking`, `useCancelReservation`), 성공/실패 시 동작을 소비자가 결정하도록 콜백으로 열어뒀습니다.

```tsx
// 훅은 mutation만 담당
const { createBooking, isBooking } = useCreateBooking({
  onBookingSuccess: () => navigate('/', { state: { message: '예약이 완료되었습니다!' } }),
  onBookingFailed: message => {
    setErrorMessage(message);
    setSelectedRoomId(null);
  },
});

// 필터 훅도 동일한 패턴 — URL 동기화는 소비자가 결정
const { filter, updateFilter } = useBookingFilter({
  onFilterChange: nextFilter => {
    setSearchParams(toSearchParams(nextFilter, FILTER_PARAMS_CONFIG), { replace: true });
  },
});
```

훅이 `useNavigate`, `useSearchParams` 등 페이지 컨텍스트에 결합되지 않습니다. 메시지 상태, 라우팅, 에러 처리 등 부수효과의 제어권이 소비자에게 있으므로 역할이 단일하고 테스트가 쉽습니다.

## 3. UI 컴포넌트의 자율성

컴포넌트마다 적절한 수준의 자율성을 부여했습니다.

- **순수 UI** — `AvailableRoomList`는 필터링된 데이터를 받아 렌더링만 합니다.
- **표시 로직 코로케이션** — `MyReservationList`는 원본 데이터를 받고, 어떻게 보여줄지(`toDisplayReservation`)는 내부에서 결정합니다. 표시 방식 수정 요청이 오면 이 컴포넌트만 보면 됩니다.
- **자율적 상태 관리** — `Timeline`은 `activeReservationId`, `reservationsByRoom` 그룹핑을 내부에서 관리합니다. 형제 컴포넌트와 공유할 필요가 없는 상태를 부모로 올리면 페이지가 알아야 할 맥락만 늘어납니다.

## 4. 추상화 판단 기준

**적용한 추상화:**

- `validate<T>` — `check + message` 쌍의 규칙 배열 패턴. 각 규칙이 자체 완결적이고, 검증 규칙은 실제로 자주 추가됩니다. 인터페이스 자체가 이미 제네릭한 구조(`check + message`)라 `<T>`로 여는 비용이 거의 없었습니다.
- `parseFromParams<T>`, `toSearchParams<T>` — config 기반 URL 파라미터 유틸. config 구조(`urlKey + parse + serialize`)가 특정 타입에 의존하지 않아 제네릭화 비용이 거의 없었습니다.
- `MessageBanner` — 두 페이지에서 동일 구조 반복 확인 후 추출. `STYLE_MAP`으로 타입 기반 분기를 데이터로 전환했습니다.

**적용하지 않은 추상화:**

- 방 필터 조건을 규칙 배열로 받는 패턴 — `RoomFilterRule`은 `RoomFilterContext`라는 묶음 객체에 결합되어 자체 완결적이지 않고, 변경 빈도가 낮으며, 사용처가 이 훅뿐입니다. 이름 있는 함수 분리로 가독성만 확보했습니다.

## 5. 모듈 배치 기준

```
src/hooks/                          — 2개 이상 페이지에서 사용하는 쿼리 훅
  ├── useRooms.ts
  └── useReservations.ts

src/utils/                          — 범용 유틸
  ├── validation.ts
  ├── searchParams.ts
  └── date.ts

src/components/                     — 2개 이상 페이지에서 사용하는 UI
  └── MessageBanner.tsx

src/constants/                      — 공통 상수
  └── equipment.ts

src/pages/RoomBookingPage/hooks/    — 해당 페이지에서만 사용
  ├── useAvailableRooms.ts          — 공통 훅 조합 + 필터링/정렬
  ├── useBookingFilter.ts           — 필터 상태 + FilterState 기반 상수 코로케이션
  └── useCreateBooking.ts           — 예약 mutation + 콜백

src/pages/ReservationStatusPage/hooks/
  ├── useMyReservations.ts          — 단일 사용처이므로 페이지 레벨
  ├── useCancelReservation.ts       — 취소 mutation + 콜백
  └── useNavigationMessage.ts       — location.state 읽기 + 클리어 캡슐화
```

**기준**: 두 페이지 이상에서 사용하면 공통으로, 한 곳에서만 사용하면 페이지 레벨에 둡니다. `validate`, `searchParams`는 현재 단일 사용처이지만, 특정 도메인에 의존하지 않는 범용 유틸이라 공통에 배치했습니다.

## 6. 타입 기반 코로케이션

`FilterState` 인터페이스를 기준으로 관련 상수(`FILTER_VALIDATION_RULES`, `FILTER_PARAMS_CONFIG`, `DEFAULT_FILTER`)를 같은 파일(`useBookingFilter.ts`)에 배치했습니다. FilterState에 필드가 추가되면 한 파일에서 인터페이스, 기본값, URL config, 검증 규칙을 모두 수정할 수 있습니다.

## 7. 가독성을 위한 이름 있는 조건 함수

필터링 조건을 이름이 있는 함수로 분리해서, 코드가 아니라 의도가 읽히도록 했습니다. 필터링과 정렬은 별개 관심사이므로 호출부에서 조합합니다.

```tsx
rooms
  .filter(
    room =>
      hasEnoughCapacity(room, attendees) &&
      hasRequiredEquipment(room, equipment) &&
      isOnPreferredFloor(room, preferredFloor) &&
      hasNoTimeConflict(room, reservations, date, startTime, endTime)
  )
  .sort(byFloorThenName);
```
