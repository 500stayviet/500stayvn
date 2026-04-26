import type { SupportedLanguage } from '@/lib/api/translation';

/** 부수적 키워드만 현지화, 고유 명사는 원문 유지 */
export function translateBuildingTerms(text: string, language: SupportedLanguage): string {
  if (language === 'vi') {
    return text;
  }

  const toaPattern = /^Tòa\s+(.+)$/i;
  const toaMatch = text.match(toaPattern);
  if (toaMatch) {
    const name = toaMatch[1];
    if (language === 'ko') {
      return `${name}동`;
    } else if (language === 'en') {
      return `${name} Building`;
    } else if (language === 'ja') {
      return `${name}棟`;
    } else if (language === 'zh') {
      return `${name}栋`;
    }
  }

  const toaNhaPattern = /^Tòa nhà\s+(.+)$/i;
  const toaNhaMatch = text.match(toaNhaPattern);
  if (toaNhaMatch) {
    const name = toaNhaMatch[1];
    if (language === 'ko') {
      return `${name}동`;
    } else if (language === 'en') {
      return `${name} Building`;
    } else if (language === 'ja') {
      return `${name}棟`;
    } else if (language === 'zh') {
      return `${name}栋`;
    }
  }

  const khuPattern = /^Khu\s+(.+)$/i;
  const khuMatch = text.match(khuPattern);
  if (khuMatch) {
    const name = khuMatch[1];
    if (language === 'ko') {
      return `${name}단지`;
    } else if (language === 'en') {
      return `${name} Zone`;
    } else if (language === 'ja') {
      return `${name}地区`;
    } else if (language === 'zh') {
      return `${name}社区`;
    }
  }

  const sanhPattern = /^Sảnh\s+(.+)$/i;
  const sanhMatch = text.match(sanhPattern);
  if (sanhMatch) {
    const name = sanhMatch[1];
    if (language === 'ko') {
      return `${name}로비/홀`;
    } else if (language === 'en') {
      return `${name} Lobby`;
    } else if (language === 'ja') {
      return `${name}ロビー`;
    } else if (language === 'zh') {
      return `${name}大厅`;
    }
  }

  const canhoPattern = /^Căn hộ\s+(.+)$/i;
  const canhoMatch = text.match(canhoPattern);
  if (canhoMatch) {
    const name = canhoMatch[1];
    if (language === 'ko') {
      return `${name}호`;
    } else if (language === 'en') {
      return `${name} Apt`;
    } else if (language === 'ja') {
      return `${name}号室`;
    } else if (language === 'zh') {
      return `${name}单元`;
    }
  }

  return text;
}

/** 주소 자동완성 항목 → 제목/부제 (부동산 전문 처리) */
export function formatAddress(item: {
  Text?: string;
  text?: string;
  Label?: string;
  label?: string;
}): { title: string; subtitle: string } {
  const fullLabel = item.Text || item.text || item.Label || item.label || '';

  if (!fullLabel) {
    return {
      title: '',
      subtitle: '',
    };
  }

  if (fullLabel.includes(' - ')) {
    const parts = fullLabel.split(' - ').map((p: string) => p.trim());

    if (parts.length >= 2) {
      const complexName = parts[0];
      const secondPart = parts[1];

      const secondPartCommas = secondPart.split(',').map((p: string) => p.trim());

      const firstCommaPart = secondPartCommas[0];
      const isBuildingInfo = /^(Tòa|Park|Landmark|Central|Aqua|Sảnh|Block)/i.test(firstCommaPart);

      let title = '';
      let subtitle = '';

      if (isBuildingInfo) {
        let buildingInfo = firstCommaPart;
        buildingInfo = translateBuildingTerms(buildingInfo, 'vi');

        title = `${complexName} - ${buildingInfo}`;

        subtitle = secondPartCommas.slice(1).join(', ');

        if (parts.length > 2) {
          subtitle = subtitle ? `${subtitle}, ${parts.slice(2).join(', ')}` : parts.slice(2).join(', ');
        }
      } else {
        title = complexName;

        subtitle = secondPart;

        if (parts.length > 2) {
          subtitle = `${subtitle}, ${parts.slice(2).join(', ')}`;
        }
      }

      return {
        title: title.trim(),
        subtitle: subtitle.trim(),
      };
    }
  }

  const parts = fullLabel.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);

  if (parts.length === 0) {
    return {
      title: fullLabel,
      subtitle: '',
    };
  }

  const firstPart = parts[0];
  const isBuildingInfo =
    /^(Tòa|Park|Landmark|Central|Aqua|Sảnh|Block|Vinhomes)/i.test(firstPart) || /[A-Z][a-z]+\s+[A-Z]/.test(firstPart);

  let title = '';
  let subtitle = '';

  if (isBuildingInfo) {
    title = translateBuildingTerms(firstPart, 'vi');
    subtitle = parts.slice(1).join(', ');
  } else {
    title = firstPart;
    subtitle = parts.slice(1).join(', ');
  }

  return {
    title: title.trim(),
    subtitle: subtitle.trim(),
  };
}
