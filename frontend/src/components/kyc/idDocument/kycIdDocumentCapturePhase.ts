/**
 * 신분증 촬영 마법사 단계 (`useIdDocumentStepState` / `IdDocumentStepView`).
 *
 * **전이 (요약)** — 실제 전이는 `useIdDocumentStepState` 구현을 기준으로 한다.
 *
 * - `select` → `camera` : 신분증 유형 선택(주민증/여권)
 * - `camera` + `captureStep === 'front'` → 동일 phase, `back`으로 촬영 순서만 진행(주민증)
 * - `camera` : 앞/뒤(또는 여권 앞면) 촬영 완료 시 → `preview`
 * - `preview` → `form` : 미리보기 확정
 * - `preview` → `camera` : 뒷면 미촬영 시 뒷면 촬영으로 복귀
 * - `camera` / `preview` → `select` : 유형 선택으로 되돌리기(카메라 정지)
 * - `form` : 제출 시 부모 `onComplete` (phase 종료)
 */
export type KycIdDocumentPhase = 'select' | 'camera' | 'preview' | 'form';

export type KycIdDocumentCaptureSide = 'front' | 'back';
