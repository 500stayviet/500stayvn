/**
 * 얼굴 다각도 촬영 단계 (`useFaceVerificationStepState` / `FaceVerificationStepView`).
 *
 * **전이 (요약)**
 *
 * - `ready` → `capturing` : 세션 시작(카운트다운·카메라)
 * - `capturing` → `capturing` : 방향별 촬영 성공 시 인덱스만 증가(동일 phase)
 * - `capturing` → `preview` : 마지막 방향 촬영까지 완료
 * - `capturing` → `ready` : 취소(`handleCancelCapture`)
 * - `preview` → `ready` : 재촬영(`handleRetake`)
 * - `preview` → (부모 `onComplete`) : 완료 버튼 → 짧은 AI 오버레이(`showAIAnalysis`) 후 제출  
 *   ※ 오버레이는 **별도 플래그**이며 phase는 `preview`에 머문다.
 *
 * **복구:** 촬영 중 프레임 실패 시 `captureError`에 메시지를 두고 phase는 `capturing` 유지.
 */
export type KycFaceCapturePhase = 'ready' | 'capturing' | 'preview';
