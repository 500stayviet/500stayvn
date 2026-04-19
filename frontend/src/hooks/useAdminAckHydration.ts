'use client';

import { useEffect, useState } from 'react';
import { ADMIN_ACK_STATE_UPDATED } from '@/lib/adminAckConstants';

/** Bump when admin ack cache is hydrated or updated (server is source of truth). */
export function useAdminAckHydrationTick(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const onUpdate = () => setN((t) => t + 1);
    window.addEventListener(ADMIN_ACK_STATE_UPDATED, onUpdate);
    return () => window.removeEventListener(ADMIN_ACK_STATE_UPDATED, onUpdate);
  }, []);
  return n;
}
