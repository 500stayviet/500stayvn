'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { refreshAdminBadges } from '@/lib/adminBadgeCounts';
import { useAdminMe } from '@/contexts/AdminMeContext';
import { getUsers } from '@/lib/api/auth';
import { addSharedMemo, deleteSharedMemo, getSharedMemos } from '@/lib/api/adminMemos';
import { setPropertyHidden } from '@/lib/api/adminModeration';
import { getPropertyForAdmin } from '@/lib/api/properties';
import type { PropertyData } from '@/types/property';

const PROPERTY_HIDDEN_REASON = '법규를 위반했으니 관리자에게 문의 하시기 바랍니다';
const OWNER_BLOCKED_RESTORE_MESSAGE = '계정이 차단되어 있어 매물 숨김을 해제할 수 없습니다.';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 border-b border-slate-200 pb-2 text-sm font-bold text-slate-900">{children}</h2>
  );
}

function formatWhen(v: unknown): string {
  if (v == null) return '—';
  try {
    const d = new Date(v as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}

function statusBadge(p: PropertyData): { text: string; className: string } {
  if (p.hidden) {
    return { text: '숨김', className: 'bg-amber-100 text-amber-800' };
  }
  if (p.status === 'INACTIVE_SHORT_TERM') {
    return { text: '광고종료', className: 'bg-orange-100 text-orange-900' };
  }
  if (p.status === 'active') {
    return { text: '고객 노출', className: 'bg-emerald-100 text-emerald-800' };
  }
  return { text: p.status || '—', className: 'bg-slate-100 text-slate-700' };
}

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : '';
  const id = rawId ? decodeURIComponent(rawId) : '';
  const { me: admin } = useAdminMe();

  const [property, setProperty] = useState<PropertyData | null | undefined>(undefined);
  const [memoInput, setMemoInput] = useState('');
  const [memos, setMemos] = useState<Array<{ id: string; text: string; createdAt: string }>>([]);

  const reload = useCallback(async () => {
    if (!id) return;
    const p = await getPropertyForAdmin(id);
    setProperty(p);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setProperty(undefined);
        return;
      }
      setProperty(undefined);
      const p = await getPropertyForAdmin(id);
      if (!cancelled) {
        setProperty(p);
        const rows = await getSharedMemos('property', id, 'property');
        setMemos(rows.map((m) => ({ id: m.id, text: m.content, createdAt: m.createdAt })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">잘못된 경로입니다.</p>
      </AdminRouteGuard>
    );
  }

  if (property === undefined) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-slate-600">불러오는 중…</p>
      </AdminRouteGuard>
    );
  }

  if (!property) {
    return (
      <AdminRouteGuard>
        <p className="text-sm text-red-600">매물을 찾을 수 없습니다.</p>
        <Link href="/admin/properties" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          매물 목록으로
        </Link>
      </AdminRouteGuard>
    );
  }

  const st = statusBadge(property);
  const owner = property.ownerId
    ? getUsers().find((u) => u.uid === property.ownerId && !u.deleted)
    : undefined;
  const formatMemoDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd} ${hh}:${min}`;
  };

  return (
    <AdminRouteGuard>
      <div id="div-1">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 lg:flex-1">
            <Link
              href="/admin/properties"
              className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              매물 목록
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{property.title || '제목 없음'}</h1>
              <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}>
                {st.text}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-500">{property.id}</p>
          </div>

          <div className="w-full rounded-lg border border-slate-200 bg-white p-3 lg:mx-4 lg:w-[440px] lg:flex-none">
            <p className="text-xs font-semibold text-slate-700">관리자 메모</p>
            <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-slate-50">
              {memos.length === 0 ? (
                <p className="px-2 py-2 text-xs text-slate-500">메모 없음</p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {memos.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 px-2 py-1.5">
                      <span className="shrink-0 font-mono text-[10px] text-slate-500">
                        {formatMemoDate(m.createdAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-800" title={m.text}>
                        {m.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            await deleteSharedMemo(m.id);
                            const next = await getSharedMemos('property', id, 'property');
                            setMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
                          })();
                        }}
                        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <textarea
              id="property-memo"
              value={memoInput}
              onChange={(e) => setMemoInput(e.target.value)}
              rows={2}
              placeholder="매물 관련 관리자 메모"
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    if (!memoInput.trim()) return;
                    await addSharedMemo('property', id, 'property', memoInput);
                    setMemoInput('');
                    const next = await getSharedMemos('property', id, 'property');
                    setMemos(next.map((x) => ({ id: x.id, text: x.content, createdAt: x.createdAt })));
                  })();
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Save className="h-3.5 w-3.5" />
                저장
              </button>
              <span className="text-xs text-slate-500">최신 메모가 맨 앞에 표시됩니다.</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:ml-4 lg:flex-row lg:items-center lg:justify-end">
            {property.ownerId ? (
              <Link
                href={`/admin/users/${encodeURIComponent(property.ownerId)}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                호스트 계정 보기
              </Link>
            ) : null}
            {property.hidden ? (
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username || !property.id) return;
                  const ok = setPropertyHidden(property.id, false, admin.username);
                  if (!ok) {
                    window.alert(OWNER_BLOCKED_RESTORE_MESSAGE);
                    return;
                  }
                  refreshAdminBadges();
                  reload();
                }}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                숨김 해제
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!admin?.username || !property.id) return;
                  setPropertyHidden(property.id, true, admin.username, PROPERTY_HIDDEN_REASON);
                  refreshAdminBadges();
                  reload();
                }}
                className="rounded-md bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                숨김
              </button>
            )}
          </div>
        </div>

        <div id="div-2" className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>호스트 · 식별</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">Owner ID</dt>
                <dd className="min-w-0 break-all font-mono text-xs text-slate-900">{property.ownerId || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">표시명</dt>
                <dd className="text-slate-900">{owner?.displayName || '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">이메일</dt>
                <dd className="min-w-0 break-all text-slate-900">{owner?.email || '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>가격 · 면적 · 인원</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">주간 요금</dt>
                <dd className="text-slate-900">
                  {property.price != null ? property.price.toLocaleString() : '—'}{' '}
                  {property.priceUnit === 'usd' ? 'USD' : '₫'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">면적</dt>
                <dd className="text-slate-900">{property.area != null ? `${property.area} m²` : '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">방·욕실</dt>
                <dd className="text-slate-900">
                  침실 {property.bedrooms ?? '—'} · 욕실 {property.bathrooms ?? '—'}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-slate-500">최대 인원</dt>
                <dd className="text-slate-900">
                  성인 {property.maxAdults ?? '—'} · 어린이 {property.maxChildren ?? '—'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="div-3" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>위치</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">주소</dt>
              <dd className="text-slate-900">{property.address || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">동·호수</dt>
              <dd className="text-slate-900">{property.unitNumber || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">city / district</dt>
              <dd className="font-mono text-xs text-slate-900">
                {property.cityId || '—'} / {property.districtId || '—'}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">좌표</dt>
              <dd className="font-mono text-xs text-slate-900">
                {property.coordinates
                  ? `${property.coordinates.lat}, ${property.coordinates.lng}`
                  : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div id="div-4" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>설명</SectionTitle>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">베트남어 원문</p>
          <p className="mb-6 whitespace-pre-wrap text-sm text-slate-800">
            {property.original_description || '—'}
          </p>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">번역(한국어)</p>
          <p className="whitespace-pre-wrap text-sm text-slate-800">{property.translated_description || '—'}</p>
        </div>

        <div id="div-5" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>사진</SectionTitle>
          {property.images && property.images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {property.images.map((src, i) => (
                <a key={`${src}-${i}`} href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-40 w-full rounded-md border border-slate-200 object-cover" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">등록된 이미지 없음</p>
          )}
        </div>

        <div id="div-6" className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>편의시설 · 유형</SectionTitle>
            <p className="mb-2 text-sm text-slate-600">
              유형: <span className="font-medium text-slate-900">{property.propertyType || '—'}</span>
            </p>
            {property.amenities && property.amenities.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {property.amenities.map((a) => (
                  <li key={a} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-800">
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">—</p>
            )}
            <p className="mt-3 text-sm text-slate-600">
              주간 청소:{' '}
              <span className="font-medium text-slate-900">{property.cleaningPerWeek ?? '—'}</span>회
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>반려동물</SectionTitle>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">허용</dt>
                <dd className="text-slate-900">{property.petAllowed ? '예' : '아니오'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">추가 요금(VND/마리)</dt>
                <dd className="text-slate-900">{property.petFee ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 text-slate-500">최대 마리</dt>
                <dd className="text-slate-900">{property.maxPets ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div id="div-7" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>일정 · 체크인</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">임대 희망 시작</dt>
              <dd className="text-slate-900">{formatWhen(property.checkInDate)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">임대 희망 종료</dt>
              <dd className="text-slate-900">{formatWhen(property.checkOutDate)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">체크인 시간</dt>
              <dd className="text-slate-900">{property.checkInTime || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-36 shrink-0 text-slate-500">체크아웃 시간</dt>
              <dd className="text-slate-900">{property.checkOutTime || '—'}</dd>
            </div>
          </dl>
        </div>

        <div id="div-8" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
          <SectionTitle>외부 캘린더(iCal)</SectionTitle>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">플랫폼</dt>
              <dd className="text-slate-900">{property.icalPlatform || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">캘린더 이름</dt>
              <dd className="text-slate-900">{property.icalCalendarName || '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-slate-500">URL</dt>
              <dd className="min-w-0 break-all font-mono text-xs text-slate-900">{property.icalUrl || '—'}</dd>
            </div>
          </dl>
        </div>

        {property.history && property.history.length > 0 ? (
          <div id="div-9" className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
            <SectionTitle>변경 이력</SectionTitle>
            <ul className="space-y-2 text-sm">
              {property.history.map((h, i) => (
                <li key={`${h.timestamp}-${i}`} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-900">{h.action}</span>
                  <span className="ml-2 text-xs text-slate-500">{h.timestamp}</span>
                  <p className="mt-0.5 text-slate-700">{h.details}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div id="div-10" className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 text-xs text-slate-600">
          <p>생성: {formatWhen(property.createdAt)}</p>
          <p>수정: {formatWhen(property.updatedAt)}</p>
          {property.deleted ? <p className="mt-1 font-semibold text-amber-800">호스트 삭제 플래그: deleted</p> : null}
        </div>
      </div>
    </AdminRouteGuard>
  );
}
