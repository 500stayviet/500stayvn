/** 지도 페이지·슬라이더에서 공유하는 매물 썸네일 타입 */
export interface MapProperty {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  images?: string[];
  address?: string;
  priceUnit?: string;
  checkInDate?: string | Date;
}
