# FilterPanel 리팩토링 기록

## 1단계: 컴포넌트 추출 — 왜 FilterPanel을 만들었는가

### 출발점: 599줄짜리 단일 페이지 컴포넌트

`RoomBookingPage/index.tsx` 하나에 모든 것이 들어있었다.

- URL 파라미터 동기화
- 필터 상태 관리 + 검증
- API 호출 (rooms, reservations, create)
- 필터링/정렬 로직
- 예약 생성 + 에러 처리
- **필터 입력 UI + 회의실 목록 UI + 페이지 레이아웃**

**문제**: 하나의 관심사를 수정하려면 599줄 전체를 읽어야 했다. 필터 UI를 수정하는데 예약 생성 로직이 같은 스코프에 있고, 회의실 목록 렌더링과 필터 검증이 뒤섞여 있었다.

### 해결: UI 관심사 분리

페이지에서 **UI만 컴포넌트로 분리**하는 1단계를 진행했다. 로직은 페이지에 두고, 순수하게 그리기만 하는 컴포넌트를 추출했다.

```
RoomBookingPage/
├── index.tsx              ← 페이지 조합 (로직 + 컴포넌트 연결)
├── components/
│   ├── BackButton.tsx     ← 뒤로가기 버튼
│   ├── FilterPanel.tsx    ← 필터 입력 UI
│   └── AvailableRoomList.tsx ← 회의실 목록 UI
```

이후 2단계로 로직도 커스텀 훅(`useBookingFilter`, `useAvailableRooms`, `useCreateBooking`)으로 추출하여 페이지를 ~130줄의 조합 레이어로 축소했다.

---

## 2단계: 단일 props 방식의 FilterPanel

### 구조

```tsx
<FilterPanel
  date={filter.date}
  minDate={getToday()}
  startTime={filter.startTime}
  endTime={filter.endTime}
  attendees={filter.attendees}
  equipment={filter.equipment}
  preferredFloor={filter.preferredFloor}
  floors={floors}
  startTimeSlots={getStartTimeSlots()}
  endTimeSlots={getEndTimeSlots()}
  validationError={validationError}
  onDateChange={changeDate}
  onStartTimeChange={changeStartTime}
  onEndTimeChange={changeEndTime}
  onAttendeesChange={changeAttendees}
  onEquipmentToggle={toggleEquipment}
  onFloorChange={changeFloor}
/>
```

UI 분리 목적은 달성했지만, 사용하다 보니 새로운 문제가 드러났다.

### 문제: 필터 항목 변경 시 수정 범위가 넓음

필터 항목 하나를 제거하려면 3곳을 수정해야 한다.

1. `FilterPanel` 내부 JSX에서 해당 UI 제거
2. `FilterPanelProps` 인터페이스에서 관련 props 제거
3. `index.tsx`에서 해당 prop 전달 제거

예를 들어 "참석 인원"이 요구사항에서 빠지면:
- `FilterPanel.tsx`에서 attendees 관련 JSX 삭제
- `FilterPanelProps`에서 `attendees`, `onAttendeesChange` 제거
- `index.tsx`에서 `attendees={...}`, `onAttendeesChange={...}` 제거

**반대로 항목 추가도 동일하게 3곳을 건드려야 한다.**

추가로, props가 16개에 달해 FilterPanel의 인터페이스가 비대하고 어떤 props가 어떤 필터 항목에 대응하는지 한눈에 파악하기 어렵다.

---

## 3단계: 컴파운드 패턴 적용

```tsx
<FilterPanel
  date={filter.date}
  minDate={getToday()}
  startTime={filter.startTime}
  endTime={filter.endTime}
  attendees={filter.attendees}
  equipment={filter.equipment}
  preferredFloor={filter.preferredFloor}
  floors={floors}
  startTimeSlots={getStartTimeSlots()}
  endTimeSlots={getEndTimeSlots()}
  validationError={validationError}
  onDateChange={changeDate}
  onStartTimeChange={changeStartTime}
  onEndTimeChange={changeEndTime}
  onAttendeesChange={changeAttendees}
  onEquipmentToggle={toggleEquipment}
  onFloorChange={changeFloor}
/>
```

**문제**: 필터 항목 하나를 제거하려면 3곳을 수정해야 한다.

1. `FilterPanel` 내부 JSX에서 해당 UI 제거
2. `FilterPanelProps` 인터페이스에서 관련 props 제거
3. `index.tsx`에서 해당 prop 전달 제거

예를 들어 "참석 인원"이 요구사항에서 빠지면:
- `FilterPanel.tsx`에서 attendees 관련 JSX 삭제
- `FilterPanelProps`에서 `attendees`, `onAttendeesChange` 제거
- `index.tsx`에서 `attendees={...}`, `onAttendeesChange={...}` 제거

**반대로 항목 추가도 동일하게 3곳을 건드려야 한다.**

추가로, props가 16개에 달해 FilterPanel의 인터페이스가 비대하고 어떤 props가 어떤 필터 항목에 대응하는지 한눈에 파악하기 어렵다.

---

### 변경 후 구조

```tsx
<FilterPanel validationError={validationError}>
  <FilterPanel.Date value={filter.date} min={getToday()} onChange={changeDate} />
  <FilterPanel.TimeRange
    startTime={filter.startTime}
    endTime={filter.endTime}
    startTimeSlots={getStartTimeSlots()}
    endTimeSlots={getEndTimeSlots()}
    onStartTimeChange={changeStartTime}
    onEndTimeChange={changeEndTime}
  />
  <FilterPanel.Row>
    <FilterPanel.Attendees value={filter.attendees} onChange={changeAttendees} />
    <FilterPanel.Floor value={filter.preferredFloor} floors={floors} onChange={changeFloor} />
  </FilterPanel.Row>
  <FilterPanel.Equipment selected={filter.equipment} onToggle={toggleEquipment} />
</FilterPanel>
```

### 컴파운드 구성 요소

| 컴포넌트 | 역할 |
|---|---|
| `FilterPanel` (Root) | 제목("예약 조건"), 레이아웃(gap), validationError 표시 |
| `FilterPanel.Date` | 날짜 입력 필드 |
| `FilterPanel.TimeRange` | 시작/종료 시간 셀렉트 (가로 배치) |
| `FilterPanel.Attendees` | 참석 인원 숫자 입력 |
| `FilterPanel.Floor` | 선호 층 셀렉트 |
| `FilterPanel.Equipment` | 장비 토글 버튼 그룹 |
| `FilterPanel.Row` | 자식을 가로 배치하는 레이아웃 헬퍼 |

---

## 이점 (컴파운드 패턴)

### 1. 항목 추가/제거가 소비자 측 1곳에서 끝남

"참석 인원" 제거 시:

```diff
 <FilterPanel validationError={validationError}>
   <FilterPanel.Date ... />
   <FilterPanel.TimeRange ... />
-  <FilterPanel.Row>
-    <FilterPanel.Attendees value={filter.attendees} onChange={changeAttendees} />
-    <FilterPanel.Floor ... />
-  </FilterPanel.Row>
+  <FilterPanel.Floor ... />
   <FilterPanel.Equipment ... />
 </FilterPanel>
```

FilterPanel 컴포넌트 내부를 수정할 필요 없음. props 인터페이스 변경도 없음.

### 2. 레이아웃 결정권이 소비자에게 있음

- 기존: Attendees와 Floor가 가로 배치인지 세로 배치인지 FilterPanel 내부에서 결정
- 변경 후: `FilterPanel.Row`로 감쌀지, 각각 따로 배치할지 소비자가 결정

```tsx
// 가로 배치
<FilterPanel.Row>
  <FilterPanel.Attendees ... />
  <FilterPanel.Floor ... />
</FilterPanel.Row>

// 세로 배치 (Row 제거만 하면 됨)
<FilterPanel.Attendees ... />
<FilterPanel.Floor ... />
```

### 3. 각 서브 컴포넌트의 props가 명확

- 기존: 16개 props가 하나의 인터페이스에 평탄하게 나열 → 어떤 props가 어떤 UI에 대응하는지 불명확
- 변경 후: `FilterPanel.Date`는 `value`, `min`, `onChange`만 받음 → 해당 필드에 필요한 것만 명시적

---

## 불편점 / 트레이드오프

### 1. 소비자 코드가 길어짐

단일 props 방식은 `<FilterPanel ... />` 한 줄이지만, 컴파운드 패턴은 자식 컴포넌트를 나열해야 해서 JSX가 늘어남. 다만 이 늘어난 코드가 "어떤 필터 항목이 어떤 순서로 배치되는지"를 명시적으로 보여주므로 가독성은 오히려 올라간다고 판단.

### 2. 잘못된 조합을 컴파일 타임에 막을 수 없음

`FilterPanel` 안에 `FilterPanel.Date`를 두 번 넣거나, 전혀 관련 없는 컴포넌트를 넣어도 타입 에러가 나지 않음. `children: ReactNode`이기 때문. 다만 이것은 대부분의 컴파운드 패턴이 가진 한계이며, 코드 리뷰로 충분히 방어 가능.

### 3. FilterPanel 내부 파일이 커짐

서브 컴포넌트들이 하나의 파일에 있어서 파일 길이가 늘어남. 규모가 더 커지면 `FilterPanel/Date.tsx`, `FilterPanel/TimeRange.tsx` 등으로 파일을 분리하고 `index.tsx`에서 `Object.assign`으로 조합하는 방식으로 전환 가능.

---

## 판단 기준: 언제 컴파운드 패턴이 적합한가

- 구성 항목이 **추가/제거/순서 변경**될 가능성이 높을 때
- 하나의 컴포넌트에 **props가 과도하게 몰릴 때** (10개 이상이면 의심)
- **레이아웃 결정권**이 내부가 아닌 소비자에게 있어야 할 때
- 항목 간 **의존 관계가 적을 때** (각 서브 컴포넌트가 독립적으로 동작)
