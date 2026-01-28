/**
 * iCal URL 파싱 API
 * .ics URL을 가져와 VEVENT의 DTSTART/DTEND를 파싱해 예약 불가 구간으로 반환
 */

import { NextResponse } from 'next/server';

function parseICS(icsText: string): { start: string; end: string }[] {
  const events: { start: string; end: string }[] = [];
  const veventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/gi;
  const matches = icsText.match(veventRegex) || [];

  for (const block of matches) {
    const dtStartMatch = block.match(/DTSTART(?:;.*?)?:([^\r\n]+)/i);
    const dtEndMatch = block.match(/DTEND(?:;.*?)?:([^\r\n]+)/i);
    if (!dtStartMatch || !dtEndMatch) continue;

    let startStr = dtStartMatch[1].trim();
    let endStr = dtEndMatch[1].trim();

    // format: 20250130T140000Z or 20250130
    const normalizeToDate = (s: string): string => {
      const cleaned = s.replace(/\s/g, '');
      if (/^\d{8}$/.test(cleaned)) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
      }
      if (/^\d{8}T\d{6}/.test(cleaned)) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
      }
      return s;
    };

    const start = normalizeToDate(startStr);
    const end = normalizeToDate(endStr);
    if (start && end && start < end) {
      events.push({ start, end });
    }
  }

  return events;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { Accept: 'text/calendar, text/plain, */*' },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch iCal: ${res.status}` },
        { status: 502 }
      );
    }
    const icsText = await res.text();
    const events = parseICS(icsText);
    return NextResponse.json({ events });
  } catch (e) {
    console.error('[ical/parse]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Parse failed' },
      { status: 500 }
    );
  }
}
