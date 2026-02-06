# Next.js 컴포넌트 구조 이해 가이드

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 메인 페이지 (/ 경로)
│   │   ├── layout.tsx         # 레이아웃 (모든 페이지에 공통 적용)
│   │   └── admin/
│   │       └── page.tsx       # 관리자 페이지 (/admin 경로)
│   ├── components/            # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx        # 헤더 컴포넌트
│   │   └── PropertyCard.tsx  # 매물 카드 컴포넌트
│   ├── lib/                   # 유틸리티 및 설정
│   │   ├── firebase-config.ts
│   │   └── api/
│   │       └── translation.ts
│   ├── utils/                 # 유틸리티 함수
│   │   └── mapMarker.ts      # 지도 마커 생성 유틸리티
│   └── types/                 # TypeScript 타입 정의
│       └── property.ts
```

## 🧩 컴포넌트란?

컴포넌트는 **재사용 가능한 UI 블록**입니다. React/Next.js의 핵심 개념입니다.

### 컴포넌트의 특징

1. **재사용성**: 한 번 만든 컴포넌트를 여러 곳에서 사용 가능
2. **독립성**: 각 컴포넌트는 독립적으로 동작
3. **조합성**: 작은 컴포넌트를 조합하여 큰 컴포넌트 생성

### 컴포넌트 예시

```tsx
// 간단한 컴포넌트
function Button() {
  return <button>클릭</button>;
}

// Props를 받는 컴포넌트
function Button({ text }: { text: string }) {
  return <button>{text}</button>;
}

// 사용
<Button text="로그인" />
```

## 📝 컴포넌트 작성 방법

### 1. 함수형 컴포넌트 (Function Component)

```tsx
// 기본 형태
export default function MyComponent() {
  return <div>내용</div>;
}

// Props를 받는 형태
interface MyComponentProps {
  title: string;
  count: number;
}

export default function MyComponent({ title, count }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p>개수: {count}</p>
    </div>
  );
}
```

### 2. 'use client' 지시어

```tsx
'use client';

export default function MyComponent() {
  // 클라이언트 사이드에서만 실행되는 코드
  // - useState, useEffect 등 React Hooks 사용
  // - 이벤트 핸들러 (onClick, onChange 등)
  // - 브라우저 API 사용 (window, document 등)
}
```

**언제 사용하나요?**
- 상태 관리가 필요할 때 (`useState`)
- 이벤트 핸들러가 필요할 때 (`onClick`, `onChange`)
- 브라우저 API를 사용할 때 (`window`, `localStorage`)

## 🎣 React Hooks 이해하기

### useState: 상태 관리

```tsx
import { useState } from 'react';

function Counter() {
  // [상태값, 상태변경함수] = useState(초기값)
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>현재 값: {count}</p>
      <button onClick={() => setCount(count + 1)}>증가</button>
    </div>
  );
}
```

**동작 원리:**
1. `useState(0)`: 초기값 0으로 상태 생성
2. `count`: 현재 상태값 읽기
3. `setCount`: 상태값 변경 함수
4. 상태가 변경되면 컴포넌트가 자동으로 리렌더링

### useRef: 참조 저장

```tsx
import { useRef } from 'react';

function MyComponent() {
  // DOM 요소나 값의 참조 저장
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // 나중에 사용
  const focusInput = () => {
    inputRef.current?.focus();
  };

  return <input ref={inputRef} />;
}
```

**언제 사용하나요?**
- DOM 요소에 직접 접근할 때
- 컴포넌트 리렌더링 없이 값 저장이 필요할 때
- 외부 라이브러리 인스턴스 저장 (예: Google Maps)

### useCallback: 함수 메모이제이션

```tsx
import { useCallback } from 'react';

function MyComponent() {
  // 함수를 메모이제이션하여 불필요한 재생성 방지
  const handleClick = useCallback(() => {
    console.log('클릭됨');
  }, []); // 의존성 배열: 빈 배열 = 한 번만 생성

  return <button onClick={handleClick}>클릭</button>;
}
```

**왜 사용하나요?**
- 성능 최적화: 함수가 매번 재생성되지 않음
- 자식 컴포넌트에 props로 전달할 때 유용

## 🔄 컴포넌트 간 데이터 전달

### Props (Properties)

```tsx
// 부모 컴포넌트
function Parent() {
  const name = '홍길동';
  const age = 25;

  return <Child name={name} age={age} />;
}

// 자식 컴포넌트
interface ChildProps {
  name: string;
  age: number;
}

function Child({ name, age }: ChildProps) {
  return (
    <div>
      <p>이름: {name}</p>
      <p>나이: {age}</p>
    </div>
  );
}
```

### 콜백 함수 전달

```tsx
// 부모 컴포넌트
function Parent() {
  const [count, setCount] = useState(0);

  // 자식에게 함수 전달
  const handleIncrement = () => {
    setCount(count + 1);
  };

  return <Child onIncrement={handleIncrement} />;
}

// 자식 컴포넌트
interface ChildProps {
  onIncrement: () => void;
}

function Child({ onIncrement }: ChildProps) {
  return <button onClick={onIncrement}>증가</button>;
}
```

## 🎨 조건부 렌더링

```tsx
function MyComponent({ isLoggedIn }: { isLoggedIn: boolean }) {
  // 방법 1: 삼항 연산자
  return (
    <div>
      {isLoggedIn ? <p>로그인됨</p> : <p>로그인 필요</p>}
    </div>
  );

  // 방법 2: && 연산자
  return (
    <div>
      {isLoggedIn && <p>로그인됨</p>}
    </div>
  );
}
```

## 🔁 리스트 렌더링

```tsx
function PropertyList() {
  const properties = [
    { id: 1, title: '아파트 1' },
    { id: 2, title: '아파트 2' },
    { id: 3, title: '아파트 3' },
  ];

  return (
    <div>
      {properties.map((property) => (
        <div key={property.id}>{property.title}</div>
      ))}
    </div>
  );
}
```

**중요:**
- `key` prop은 필수! React가 각 요소를 구분하기 위해 사용
- `key`는 고유한 값이어야 함 (보통 `id` 사용)

## 📦 현재 프로젝트의 컴포넌트 구조

### 1. Header 컴포넌트 (`components/Header.tsx`)

```tsx
// Props 인터페이스 정의
interface HeaderProps {
  currentLanguage?: Language;
  onLanguageChange?: (lang: Language) => void;
}

// 컴포넌트 정의
export default function Header({ currentLanguage, onLanguageChange }: HeaderProps) {
  // 상태 관리
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  
  // JSX 반환
  return <header>...</header>;
}
```

**사용:**
```tsx
<Header 
  currentLanguage="ko" 
  onLanguageChange={(lang) => console.log(lang)} 
/>
```

### 2. PropertyCard 컴포넌트 (`components/PropertyCard.tsx`)

```tsx
interface PropertyCardProps {
  property: Property;
  isSelected: boolean;
  onClick: () => void;
}

export default function PropertyCard({ property, isSelected, onClick }: PropertyCardProps) {
  return <div onClick={onClick}>...</div>;
}
```

**사용:**
```tsx
<PropertyCard
  property={myProperty}
  isSelected={true}
  onClick={() => handleSelect(myProperty)}
/>
```

### 3. HomePage 컴포넌트 (`app/page.tsx`)

```tsx
export default function HomePage() {
  // 상태 관리
  const [selectedProperty, setSelectedProperty] = useState(...);
  
  // 이벤트 핸들러
  const handlePropertySelect = (property) => { ... };
  
  // 다른 컴포넌트 사용
  return (
    <div>
      <Header />
      <PropertyCard />
    </div>
  );
}
```

## 🎯 핵심 개념 정리

1. **컴포넌트 = 재사용 가능한 UI 블록**
2. **Props = 부모에서 자식으로 데이터 전달**
3. **State = 컴포넌트 내부 상태 관리**
4. **Hooks = React 기능 사용 (useState, useRef 등)**
5. **'use client' = 클라이언트 사이드 컴포넌트**

## 📚 추가 학습 자료

- [React 공식 문서](https://react.dev)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
