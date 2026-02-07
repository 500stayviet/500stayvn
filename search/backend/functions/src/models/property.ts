/**
 * 부동산 모델
 * Property Model
 */

import { prisma } from '../config/database';
import { Property, PropertySearchFilter } from '../types/property.types';

export class PropertyModel {
  /**
   * 부동산 저장
   */
  static async save(propertyData: any): Promise<any> {
    return await prisma.property.create({
      data: {
        title: propertyData.title,
        original_description: propertyData.description,
        price: propertyData.price,
        priceUnit: propertyData.priceUnit || 'vnd',
        area: propertyData.area,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        address: typeof propertyData.address === 'string' ? propertyData.address : propertyData.address?.fullAddress || '',
        images: propertyData.images || [],
        ownerId: propertyData.ownerId,
        status: 'active',
        // 기타 필요한 필드 추가...
      }
    });
  }

  /**
   * ID로 부동산 조회
   */
  static async findById(id: string): Promise<any | null> {
    return await prisma.property.findUnique({
      where: { id },
      include: { owner: true }
    });
  }

  /**
   * 필터로 부동산 검색
   */
  static async search(filter: PropertySearchFilter, limit: number = 20, offset: number = 0): Promise<any[]> {
    const where: any = { status: 'active' };
    
    if (filter.minPrice) where.price = { gte: filter.minPrice };
    if (filter.maxPrice) where.price = { ...where.price, lte: filter.maxPrice };
    if (filter.bedrooms) where.bedrooms = filter.bedrooms;

    return await prisma.property.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 부동산 업데이트
   */
  static async update(id: string, updates: any): Promise<any | null> {
    return await prisma.property.update({
      where: { id },
      data: updates
    });
  }

  /**
   * 부동산 삭제
   */
  static async delete(id: string): Promise<boolean> {
    await prisma.property.delete({
      where: { id }
    });
    return true;
  }

  /**
   * 사용자의 부동산 목록 조회
   */
  static async findByUserId(userId: string): Promise<any[]> {
    return await prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * 조회수 증가
   */
  static async incrementViews(id: string): Promise<void> {
    // TODO: Implement actual database update
  }

  /**
   * 고유 ID 생성
   */
  private static generateId(): string {
    return `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
