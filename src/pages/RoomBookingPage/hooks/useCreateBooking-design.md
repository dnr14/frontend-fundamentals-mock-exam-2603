# useCreateBooking 훅 설계

## 역할

예약 생성 요청(mutation)만 담당하는 훅. 에러 상태, 라우팅은 소비하는 쪽의 관심사.

## 관심사 분리 과정

### 1단계: 모놀리식 페이지

처음에는 `RoomBookingPage` 안에 `useMutation`, `errorMessage` 상태, `navigate`, 에러 파싱 로직이 모두 섞여 있었다.

### 2단계: errorMessage를 어디에 둘 것인가

처음에는 `useBookingFilter` 훅에 `errorMessage`가 있었다. 하지만 이 상태의 목적은 **예약 요청 실패 시 에러 메시지를 보여주는 것**이지, 필터 관련 관심사가 아니다. 필터 훅 안에서 `setErrorMessage(null)`로 초기화만 하고 있었고, 실제로 메시지를 설정하는 곳은 mutation 쪽이었다.

> 상태는 그 상태를 만들어내는 로직 근처에 두는 것이 관심사 분리에 맞다.

`errorMessage`를 `useCreateBooking`으로 이동했다.

### 3단계: navigate 의존성 제거

훅 내부에서 `useNavigate`를 직접 호출해 성공 시 라우팅하고 있었다. 문제:

- 라우터 경로가 바뀌면 훅을 수정해야 한다
- 훅이 라우팅이라는 외부 관심사에 의존한다
- 테스트할 때 라우터 mock이 필요하다

콜백 패턴으로 변경해서 **소비하는 쪽에서 결정권**을 갖도록 했다.

### 4단계: errorMessage 상태를 소비자에게 위임

훅 내부에서 `errorMessage` 상태를 관리하면서 `setErrorMessage`까지 외부에 노출하고 있었다. 문제:

- 상태 소유권이 애매하다 — 훅이 만들고, 소비자가 직접 set/clear한다
- 예약과 무관한 에러(`'회의실을 선택해주세요.'`)도 이 훅의 상태에 넣고 있었다

`onBookingFailed(message)` 콜백으로 에러 메시지를 전달하고, 상태 관리는 소비자가 하도록 변경했다.

```tsx
// Before — 훅이 에러 상태를 소유하고 setter를 노출
const { createBooking, isBooking, errorMessage, setErrorMessage, clearError } = useCreateBooking({
  onBookingSuccess: () => navigate('/'),
  onBookingFailed: () => setSelectedRoomId(null),
});

// After — 소비자가 에러 상태를 소유
const [errorMessage, setErrorMessage] = useState<string | null>(null);
const { createBooking, isBooking } = useCreateBooking({
  onBookingSuccess: () => navigate('/', { state: { message: '예약이 완료되었습니다!' } }),
  onBookingFailed: message => {
    setErrorMessage(message);
    setSelectedRoomId(null);
  },
});
```

## 에러 처리 전략: onSuccess에서 throw → onError로 통합

서버가 HTTP 200으로 응답하지만 body에 실패 정보를 담는 경우가 있다.

```tsx
onSuccess: (result, variables) => {
  queryClient.invalidateQueries({ queryKey: ['reservations', variables.date] });
  queryClient.invalidateQueries({ queryKey: ['myReservations'] });

  if ('ok' in result && result.ok) {
    onBookingSuccess();
    return;
  }

  // 200이지만 실패인 경우 → throw로 onError에서 통합 처리
  const errResult = result as { message?: string };
  throw new Error(errResult.message ?? '예약에 실패했습니다.');
},
```

`onSuccess`에서 `throw`하면 `onError`로 흘러간다. 이렇게 하면:

- 에러 메시지 파싱과 콜백 호출이 `onError` 한 곳에서 처리된다
- HTTP 에러든 비즈니스 로직 실패든 동일한 경로로 처리된다

## 반환값

```tsx
return {
  createBooking,   // mutation 실행 함수
  isBooking,       // mutation.isPending
};
```

에러 상태, 라우팅, 방 선택 초기화 등 부수효과는 모두 콜백으로 소비자에게 위임한다.

## 콜백 패턴의 이점

| 관점 | 설명 |
|------|------|
| 재사용성 | 라우팅, 에러 상태 로직이 없으므로 다른 페이지에서도 사용 가능 |
| 테스트 | 콜백을 jest.fn()으로 넘기면 라우터 mock 없이 테스트 가능 |
| 확장성 | 성공/실패 시 동작을 소비하는 쪽에서 자유롭게 결정 |
| 역할 단일화 | 훅은 mutation 실행만 담당, 상태 관리는 소비자 |
