# validation 유틸 설계

## 역할

값과 규칙 배열을 받아 첫 번째 위반 메시지를 반환하는 범용 검증 함수.

## 설계 과정

### 1단계: 훅 내부에 하드코딩

처음에는 `useBookingFilter` 훅 안에서 `if (endTime <= startTime)`, `if (attendees < 1)` 같은 검증을 직접 수행하고 에러 메시지를 반환했다.

### 2단계: 규칙 배열로 분리

검증 조건이 늘어날 때마다 훅 로직을 수정해야 했다. `check + message` 쌍의 규칙 배열로 분리해서, 규칙 추가 시 배열에 한 줄만 넣으면 되도록 변경했다.

### 3단계: 제네릭으로 범용화

`FilterState` 전용이었던 것을 `<T>`로 열어서 어떤 타입에든 적용 가능하게 했다. 파일 위치도 `pages/RoomBookingPage/utils/`에서 `src/utils/`로 이동했다.

## 확장성 판단: 왜 여기엔 규칙 배열이 적절한가

`useRooms`의 `filterRooms`에도 동일한 패턴(조건을 규칙 배열로 받기)을 검토했으나 적용하지 않았다. 반면 validation에는 적용했다. 차이:

- `ValidationRule`은 `check + message`로 각 규칙이 **자체 완결적**이다. 외부 컨텍스트에 의존하지 않는다.
- 검증 규칙은 **실제로 자주 추가된다** — "30분 이상", "주말 예약 불가" 등
- `validate<T>`가 제네릭이라 **여러 곳에서 재사용** 가능하다. 추상화 비용을 회수할 곳이 많다.

## 인터페이스

```tsx
export interface ValidationRule<T> {
  check: (value: T) => boolean;  // true면 위반
  message: string;
}

export function validate<T>(value: T, rules: ValidationRule<T>[]): string | null;
```

## 소비 예시

```tsx
// 규칙 정의 (useBookingFilter.ts에 응집)
export const FILTER_VALIDATION_RULES: ValidationRule<FilterState>[] = [
  { check: filter => filter.endTime <= filter.startTime, message: '종료 시간은 시작 시간보다 늦어야 합니다.' },
  { check: filter => filter.attendees < 1, message: '참석 인원은 1명 이상이어야 합니다.' },
];

// 사용 (index.tsx)
const validationError = hasTimeInputs ? validate(filter, FILTER_VALIDATION_RULES) : null;
```

규칙만 바꿔 끼면 검증 로직이 바뀐다. 함수는 수정할 필요 없다.
