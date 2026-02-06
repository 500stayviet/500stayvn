'use client';

import { useRef, useEffect, useState } from 'react';

/**
 * 앱 전용 스크롤 컨테이너
 * - 브라우저 스크롤과 분리된 430px 앱 박스 내부 스크롤
 * - 스크롤 시에만 커스텀 스크롤바 표시
 */
export default function AppBox({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      setScrolling(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setScrolling(false);
        timeoutRef.current = null;
      }, 800);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`app-box ${scrolling ? 'scrolling' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
