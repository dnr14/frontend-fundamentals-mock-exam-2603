# searchParams 유틸 설계

## 역할

URL 쿼리스트링 파싱/직렬화를 config 기반으로 처리하는 범용 유틸.

## 설계 과정

### 1단계: 훅 내부에 하드코딩

처음에는 `useBookingFilter` 훅 안에서 `searchParams.get('date')`, `searchParams.get('attendees')` 등을 직접 호출하고, `Number()`, `split(',')` 같은 파싱을 인라인으로 처리했다.

### 2단계: config 기반으로 추출

필터 필드마다 URL 키, 기본값, 파싱, 직렬화 로직이 반복되었다. 필드별 설정을 `FieldConfig`로 정의하고, config를 순회하며 자동 처리하도록 변경했다.

```tsx
export interface FieldConfig<T> {
  urlKey: string;
  defaultValue: T;
  parse: (value: string) => T;
  serialize: (value: T) => string | null;
}

export type ParamsConfig<T> = { [K in keyof T]: FieldConfig<T[K]> };
```

### 3단계: 제네릭으로 범용화

처음에는 `FilterState` 전용이었다. 인터페이스가 이미 제네릭하게 설계되어 있었으므로, 타입 파라미터를 `<T>`로 열어서 다른 페이지에서도 재사용 가능하게 했다. 파일 위치도 `pages/RoomBookingPage/utils/`에서 `src/utils/`로 이동했다.

## 타입 단언에 대한 판단

함수 내부에 타입 단언이 다수 존재한다.

```tsx
const entries = Object.entries(config) as [keyof T, FieldConfig<unknown>][];
(result as unknown as Record<string, unknown>)[key as string] = fieldConfig.parse(raw);
```

이는 `Object.entries`가 `[string, unknown][]`을 반환하는 TypeScript 설계 한계 때문이다. TS는 런타임에 객체가 타입 선언보다 더 많은 키를 가질 수 있으므로(구조적 서브타이핑), `Object.keys`/`Object.entries`의 키를 의도적으로 `string`으로 넓힌다.

타입 가드로는 해결할 수 없다 — 가드를 만들어도 단언을 가드 안으로 옮긴 것뿐이지 실제로 더 안전해지지 않는다.

**소비자 인터페이스(`ParamsConfig<T>`)에서 타입 안전성을 보장**하고, 내부 구현의 단언은 이 함수 안에 격리시키는 것이 현실적 최선이다.

## 소비 예시

```tsx
// config 정의 (useBookingFilter.ts에 응집)
export const FILTER_PARAMS_CONFIG: ParamsConfig<FilterState> = {
  date: { urlKey: 'date', defaultValue: getToday(), parse: v => v, serialize: v => v || null },
  attendees: { urlKey: 'attendees', defaultValue: 1, parse: v => Number(v), serialize: v => v > 1 ? String(v) : null },
  // ...
};

// 사용 (index.tsx)
const initialFilter = parseFromParams(searchParams, FILTER_PARAMS_CONFIG);
setSearchParams(toSearchParams(nextFilter, FILTER_PARAMS_CONFIG), { replace: true });
```

필드 추가 시 config에 한 줄만 추가하면 파싱/직렬화가 자동으로 처리된다.
