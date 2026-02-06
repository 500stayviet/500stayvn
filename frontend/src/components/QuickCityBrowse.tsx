/**
 * QuickCityBrowse 컴포넌트
 * 
 * 인기 도시를 빠르게 선택할 수 있는 가로 스크롤 섹션
 * - 각 도시 카드 클릭 시 해당 도시의 검색 결과로 이동
 */

'use client';

import { useRouter } from 'next/navigation';
import { SupportedLanguage } from '@/lib/api/translation';
import { VIETNAM_CITIES } from '@/lib/data/vietnam-regions';
import type { VietnamRegion } from '@/lib/data/vietnam-regions';

interface QuickCityBrowseProps {
  currentLanguage: SupportedLanguage;
}

// 홈화면에 표시할 인기 도시 (순서대로)
const FEATURED_CITY_IDS = ['hcmc', 'hanoi', 'danang', 'nhatrang', 'dalat', 'hoian', 'phuquoc', 'vungtau'];

// 도시별 대표 이미지
const CITY_IMAGES: Record<string, string> = {
  hcmc: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=300&h=200&fit=crop',
  hanoi: 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=300&h=200&fit=crop',
  danang: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=300&h=200&fit=crop',
  nhatrang: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=300&h=200&fit=crop',
  dalat: 'https://images.unsplash.com/photo-1555921015-5532091f6026?w=300&h=200&fit=crop',
  hoian: 'https://images.unsplash.com/photo-1536086845220-f5f87e4e92ec?w=300&h=200&fit=crop',
  phuquoc: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&h=200&fit=crop',
  vungtau: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&h=200&fit=crop',
};

function getCityDisplayName(region: VietnamRegion, lang: SupportedLanguage): string {
  if (lang === 'ko') return region.nameKo ?? region.name ?? '';
  if (lang === 'vi') return region.nameVi ?? region.name ?? '';
  if (lang === 'ja') return region.nameJa ?? region.name ?? '';
  if (lang === 'zh') return region.nameZh ?? region.name ?? '';
  return region.name ?? '';
}

// 섹션 타이틀 다국어
function getSectionTitle(lang: SupportedLanguage): string {
  const titles: Record<SupportedLanguage, string> = {
    ko: '인기 도시 둘러보기',
    vi: 'Khám phá thành phố',
    en: 'Explore Popular Cities',
    ja: '人気都市を探索',
    zh: '探索热门城市',
  };
  return titles[lang] || titles.en;
}

const VN = {
  green: '#2D6A4F',
  gold: '#D4A017',
  text: '#1A2E1A',
  textSub: '#3D5C3D',
  muted: '#8A9E8A',
  cream: '#FBF8F3',
  surface: '#FFFFFF',
  border: '#E8E0D4',
  chipBg: '#F5F0E8',
};

export default function QuickCityBrowse({ currentLanguage }: QuickCityBrowseProps) {
  const router = useRouter();

  const featuredCities = FEATURED_CITY_IDS
    .map(id => VIETNAM_CITIES.find(c => c.id === id))
    .filter((c): c is VietnamRegion => !!c);

  const handleCityClick = (city: VietnamRegion) => {
    const name = getCityDisplayName(city, currentLanguage);
    const params = new URLSearchParams({ q: name, cityId: city.id });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section style={{ backgroundColor: VN.cream }} className="pb-3">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: VN.gold }} />
          <p className="text-xs font-bold tracking-wide uppercase" style={{ color: VN.green }}>
            {getSectionTitle(currentLanguage)}
          </p>
        </div>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-5 pb-2">
        {featuredCities.map((city) => (
          <button
            key={city.id}
            onClick={() => handleCityClick(city)}
            className="flex-shrink-0 group"
          >
            <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden shadow-sm" style={{ border: `1.5px solid ${VN.border}` }}>
              <img
                src={CITY_IMAGES[city.id] || ''}
                alt={getCityDisplayName(city, currentLanguage)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(27,67,50,0.5) 0%, transparent 60%)' }} />
            </div>
            <p className="text-[11px] font-semibold mt-1.5 text-center truncate w-[72px]" style={{ color: VN.text }}>
              {getCityDisplayName(city, currentLanguage)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
