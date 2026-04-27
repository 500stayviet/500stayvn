import type { SupportedLanguage } from '@/lib/api/translation';
import { getUIText } from '@/utils/i18n';

function formatAddressSuffix(
  language: SupportedLanguage,
  key:
    | 'addressPatternTower'
    | 'addressPatternZone'
    | 'addressPatternLobby'
    | 'addressPatternUnit',
  name: string,
): string {
  return getUIText(key, language).replace(/\{\{name\}\}/g, name);
}

/** 부수적 키워드만 현지화, 고유 명사는 원문 유지 */
export function translateBuildingTerms(text: string, language: SupportedLanguage): string {
  if (language === 'vi') {
    return text;
  }

  const toaPattern = /^Tòa\s+(.+)$/i;
  const toaMatch = text.match(toaPattern);
  if (toaMatch) {
    return formatAddressSuffix(language, 'addressPatternTower', toaMatch[1]);
  }

  const toaNhaPattern = /^Tòa nhà\s+(.+)$/i;
  const toaNhaMatch = text.match(toaNhaPattern);
  if (toaNhaMatch) {
    return formatAddressSuffix(language, 'addressPatternTower', toaNhaMatch[1]);
  }

  const khuPattern = /^Khu\s+(.+)$/i;
  const khuMatch = text.match(khuPattern);
  if (khuMatch) {
    return formatAddressSuffix(language, 'addressPatternZone', khuMatch[1]);
  }

  const sanhPattern = /^Sảnh\s+(.+)$/i;
  const sanhMatch = text.match(sanhPattern);
  if (sanhMatch) {
    return formatAddressSuffix(language, 'addressPatternLobby', sanhMatch[1]);
  }

  const canhoPattern = /^Căn hộ\s+(.+)$/i;
  const canhoMatch = text.match(canhoPattern);
  if (canhoMatch) {
    return formatAddressSuffix(language, 'addressPatternUnit', canhoMatch[1]);
  }

  return text;
}

/** 주소 자동완성 항목 → 제목/부제 (부동산 전문 처리) */
export function formatAddress(
  item: {
    Text?: string;
    text?: string;
    Label?: string;
    label?: string;
  },
  language: SupportedLanguage,
): { title: string; subtitle: string } {
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
        buildingInfo = translateBuildingTerms(buildingInfo, language);

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
    title = translateBuildingTerms(firstPart, language);
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
