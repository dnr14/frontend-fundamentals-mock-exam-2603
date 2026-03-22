# useRooms 훅 설계

## 역할

방(rooms) 데이터 조회, 예약(reservations) 데이터 조회, 필터링을 담당하는 훅. rooms라는 상위 개념 아래 availableRooms까지 포함한다.

## 관심사 분리 과정

### 1단계: 모놀리식 페이지

처음에는 `RoomBookingPage` 안에 rooms 조회, reservations 조회, 필터링 로직, floors 파생이 모두 섞여 있었다.

### 2단계: useRooms + useAvailableRooms 분리

두 개의 API 요청(rooms, reservations)이 하나의 훅에 묶여 있어서 분리했다.

- `useRooms` — rooms 조회 + floors 파생
- `useAvailableRooms` — reservations 조회 + 필터링

`useAvailableRooms`는 `AvailableRoomList` 컴포넌트 내부에 응집시켜, `isFilterComplete`일 때만 컴포넌트가 마운트되면서 불필요한 API 요청을 방지했다.

### 3단계: AvailableRoomList을 순수 UI 컴포넌트로 변경

`useAvailableRooms`를 부모(`index.tsx`)로 이동해서 `AvailableRoomList`는 `availableRooms`를 props로 받아 렌더링만 담당하도록 변경했다.

### 4단계: useRooms에 통합

availableRooms는 rooms에 의존하고, rooms를 필터링한 결과다. rooms가 더 높은 개념이라 availableRooms도 포함할 수 있다.

`useAvailableRooms`를 `useRooms`에 통합해서 한 훅에서 `{ rooms, availableRooms }`를 반환하도록 변경했다.

```tsx
export function useRooms({ filter }: UseRoomsParams) {
  const { data: rooms = [] } = useQuery<Room[]>({ queryKey: ['rooms'], queryFn: getRooms });

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ['reservations', filter.date],
    queryFn: () => getReservations(filter.date),
    enabled: !!filter.date,
  });

  const availableRooms = filterRooms(rooms, reservations, filter).sort(byFloorThenName);

  return { rooms, availableRooms };
}
```

### 5단계: floors 파생을 소비자에게 위임

`floors`는 FilterPanel UI에서 층 선택 드롭다운에 쓰이는 값으로, rooms 훅의 관심사가 아니다. 소비자가 rooms에서 직접 파생하도록 변경했다.

```tsx
// index.tsx
const { rooms, availableRooms } = useRooms({ filter });
const floors = [...new Set(rooms.map((r: { floor: number }) => r.floor))].sort((a, b) => a - b);
```

## 필터링 가독성: 조건 함수 분리

`filterRooms` 내부의 필터 조건을 이름이 있는 함수로 분리해서, `.filter()` 안을 읽으면 코드가 아니라 의도가 보이도록 했다.

```tsx
rooms.filter(
  room =>
    hasEnoughCapacity(room, attendees) &&
    hasRequiredEquipment(room, equipment) &&
    isOnPreferredFloor(room, preferredFloor) &&
    hasNoTimeConflict(room, reservations, date, startTime, endTime)
);
```

정렬도 `byFloorThenName`으로 분리해서 "층 순서대로, 같은 층이면 이름 순서대로"라는 의도를 이름으로 드러냈다. 필터링과 정렬은 별개 관심사이므로 호출부에서 조합한다.

```tsx
const availableRooms = filterRooms(rooms, reservations, filter).sort(byFloorThenName);
```

## 확장성에 대한 판단: 규칙 배열 패턴 미적용

`validate(filter, VALIDATION_RULES)` 패턴처럼 필터 조건도 규칙 배열로 받는 방안을 검토했으나 적용하지 않았다. 이유:

- `ValidationRule`은 `check + message`로 각 규칙이 **자체 완결적**이다
- `RoomFilterRule`은 `RoomFilterContext`라는 묶음 객체에 결합되어 자체 완결적이지 않다
- 방 필터 조건은 검증 규칙만큼 자주 변경되지 않는다
- 추상화 비용을 회수할 곳이 이 훅뿐이다

실제 확장 가능성 대비 추가되는 복잡도가 맞지 않으므로, 단순한 함수 분리로 가독성만 확보했다.
