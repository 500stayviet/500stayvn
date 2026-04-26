/**
 * `/api/app/*` 성공 봉투 `{ ok: true, data }` 와 레거시(평면) JSON 겸용.
 */
export function unwrapAppApiData<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === 'object' &&
    'ok' in json &&
    (json as { ok: unknown }).ok === true &&
    'data' in json &&
    (json as { data: unknown }).data !== undefined
  ) {
    return (json as { data: T }).data;
  }
  return json as T;
}
