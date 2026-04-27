import type { BaseUITextKey } from '@/utils/i18n';

/** 5방향 얼굴 촬영: 안내는 `getUIText(textKey)` (i18n.ts `kycFaceDir*`). */
export const faceDirections: ReadonlyArray<{
  key: string;
  textKey: BaseUITextKey;
  duration: number;
}> = [
  { key: 'front', textKey: 'kycFaceDirFront', duration: 3000 },
  { key: 'up', textKey: 'kycFaceDirUp', duration: 3000 },
  { key: 'down', textKey: 'kycFaceDirDown', duration: 3000 },
  { key: 'left', textKey: 'kycFaceDirLeft', duration: 3000 },
  { key: 'right', textKey: 'kycFaceDirRight', duration: 3000 },
];
