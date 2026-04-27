/** 5방향 얼굴 촬영: 정면, 상, 하, 좌, 우 (안내 문구 + 유지 시간 ms) */
export const faceDirections = [
  {
    key: 'front',
    text: {
      ko: '정면을 보세요',
      vi: 'Nhìn thẳng về phía trước',
      en: 'Look straight ahead',
      ja: '正面を向いてください',
      zh: '请正视前方',
    },
    duration: 3000,
  },
  {
    key: 'up',
    text: {
      ko: '위를 보세요',
      vi: 'Nhìn lên trên',
      en: 'Look up',
      ja: '上を向いてください',
      zh: '请向上看',
    },
    duration: 3000,
  },
  {
    key: 'down',
    text: {
      ko: '아래를 보세요',
      vi: 'Nhìn xuống dưới',
      en: 'Look down',
      ja: '下を向いてください',
      zh: '请向下看',
    },
    duration: 3000,
  },
  {
    key: 'left',
    text: {
      ko: '왼쪽을 보세요',
      vi: 'Nhìn sang trái',
      en: 'Look to the left',
      ja: '左を向いてください',
      zh: '请向左看',
    },
    duration: 3000,
  },
  {
    key: 'right',
    text: {
      ko: '오른쪽을 보세요',
      vi: 'Nhìn sang phải',
      en: 'Look to the right',
      ja: '右を向いてください',
      zh: '请向右看',
    },
    duration: 3000,
  },
] as const;
