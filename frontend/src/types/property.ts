/**
 * 부동산 매물 타입 정의
 */

export interface Property {
  id: string;
  title: string;
  titleKo?: string;
  description: string;
  descriptionKo?: string;
  price: number;
  priceUnit: 'vnd' | 'usd';
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    lat: number;
    lng: number;
  };
  images?: string[];
  address?: string;
}

export interface PropertyFilter {
  provinceCode?: string;
  districtCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  transactionType?: 'rent' | 'sale' | 'both';
}
