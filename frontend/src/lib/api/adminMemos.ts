export type AdminSharedMemo = {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
};

export type AdminMemoTargetType = 'user' | 'property';
export type AdminMemoCategory = 'host' | 'guest' | 'property';

function buildQuery(targetType: AdminMemoTargetType, targetId: string, category: AdminMemoCategory): string {
  const q = new URLSearchParams();
  q.set('targetType', targetType);
  q.set('targetId', targetId);
  q.set('category', category);
  return q.toString();
}

export async function getSharedMemos(
  targetType: AdminMemoTargetType,
  targetId: string,
  category: AdminMemoCategory
): Promise<AdminSharedMemo[]> {
  const res = await fetch(`/api/admin/memos?${buildQuery(targetType, targetId, category)}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { rows?: AdminSharedMemo[] };
  return Array.isArray(data.rows) ? data.rows : [];
}

export async function addSharedMemo(
  targetType: AdminMemoTargetType,
  targetId: string,
  category: AdminMemoCategory,
  content: string
): Promise<AdminSharedMemo | null> {
  const res = await fetch('/api/admin/memos', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetType, targetId, category, content }),
  });
  if (!res.ok) return null;
  return (await res.json()) as AdminSharedMemo;
}

export async function deleteSharedMemo(memoId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/memos/${encodeURIComponent(memoId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return res.ok;
}
