/**
 * 부동산 서비스
 * Property Service with Vietnamese Input Processing
 */

import { logger } from '../utils/logger';
import { Property, CreatePropertyRequest } from '../types/property.types';
import { PropertyType, TransactionType, FurnitureOption, Direction } from '../types/property.types';
import { VietnamAddress } from '../types/address.types';
import { getProvinceByCode, getDistrictByCode } from '../constants/vietnam-addresses';

/**
 * 베트남어 필드 매핑
 * Vietnamese field mappings for AI extraction
 */
const VIETNAMESE_FIELD_MAPPINGS = {
  // 면적
  'diện tích': 'area',
  'dt': 'area',
  'm²': 'area',
  'm2': 'area',
  'sqm': 'area',
  
  // 가격
  'giá thuê': 'price',
  'giá bán': 'price',
  'tiền thuê': 'price',
  'giá': 'price',
  'price': 'price',
  
  // 방 개수
  'phòng ngủ': 'bedrooms',
  'pn': 'bedrooms',
  'phòng tắm': 'bathrooms',
  'pt': 'bathrooms',
  'phòng khách': 'livingRooms',
  'phòng bếp': 'kitchens',
  
  // 보증금
  'cọc': 'deposit',
  'đặt cọc': 'deposit',
  'tiền cọc': 'deposit',
  'không cần đặt cọc': 'noDeposit',
  'không cần cọc': 'noDeposit',
  
  // 관리비
  'quản lý': 'managementFee',
  'phí quản lý': 'managementFee',
  'miễn phí quản lý': 'managementFeeIncluded',
  
  // 가구
  'nội thất': 'furniture',
  'không nội thất': 'unfurnished',
  'đầy đủ nội thất': 'fullyFurnished',
  
  // 핑크북
  'sổ hồng': 'pinkBook',
  'có sổ hồng': 'pinkBookAvailable',
  'chưa có sổ hồng': 'pinkBookPending',
  
  // 오토바이 주차
  'xe máy': 'motorcycleParking',
  'đậu xe máy': 'motorcycleParking',
  'bãi đậu xe máy': 'motorcycleParking',
  
  // 방향
  'hướng đông': 'directionEast',
  'hướng tây': 'directionWest',
  'hướng nam': 'directionSouth',
  'hướng bắc': 'directionNorth',
  
  // 지역
  'quận': 'district',
  'huyện': 'district',
  'phường': 'ward',
  'xã': 'ward',
  'tỉnh': 'province',
  'thành phố': 'province',
};

export class PropertyService {
  private apiKey: string;

  constructor() {
    // Get API key from environment
    this.apiKey = process.env.GEMINI_API_KEY || process.env.TRANSLATION_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('PropertyService: GEMINI_API_KEY not found in environment variables');
    } else {
      logger.debug('PropertyService: API key configured (using direct HTTP calls)');
    }
  }

  /**
   * 베트남어 입력에서 부동산 정보 추출 (Gemini API v1 직접 호출)
   */
  async extractPropertyInfoFromVietnamese(vietnameseInput: string): Promise<Partial<CreatePropertyRequest>> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable in .env file.');
    }

    try {
      logger.debug('Calling Gemini API v1 (direct HTTP) for property extraction');

      // First, try to get available models
      let availableModels: string[] = [];
      try {
        const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${this.apiKey}`;
        const listResponse = await fetch(listUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (listResponse.ok) {
          const listData = await listResponse.json();
          if (listData.models) {
            availableModels = listData.models
              .map((m: any) => m.name?.replace('models/', '') || m.name)
              .filter((name: string) => name && name.includes('gemini'));
            logger.debug('Available models', { models: availableModels });
          }
        }
      } catch (e) {
        logger.debug('Could not fetch model list', { error: e });
      }

      const prompt = `다음 베트남어 부동산 매물 설명에서 구조화된 정보를 추출해주세요.

입력 텍스트:
${vietnameseInput}

다음 JSON 형식으로 정보를 추출해주세요:
{
  "type": "apartment" | "townhouse" | "villa" | "shophouse" | "land" | "office" | "warehouse",
  "transactionType": "rent" | "sale" | "both",
  "title": "제목",
  "description": "설명",
  "price": 숫자,
  "priceUnit": "vnd" | "usd",
  "area": 숫자 (m²),
  "bedrooms": 숫자,
  "bathrooms": 숫자,
  "address": {
    "provinceCode": "성/시 코드",
    "districtCode": "구/현 코드",
    "wardCode": "동/읍 코드",
    "street": "도로명",
    "houseNumber": "집 번호"
  },
  "vietnamOptions": {
    "motorcycleParking": true/false,
    "pinkBook": true/false,
    "pinkBookStatus": "available" | "pending" | "not_available",
    "furniture": "fully_furnished" | "partially_furnished" | "unfurnished",
    "managementFeeIncluded": true/false,
    "managementFee": 숫자,
    "depositRequired": true/false,
    "depositAmount": 숫자,
    "balcony": true/false,
    "security": true/false,
    "elevator": true/false,
    "swimmingPool": true/false,
    "gym": true/false,
    "parking": true/false
  },
  "contactPhone": "전화번호",
  "contactEmail": "이메일"
}

중요:
- 베트남어 용어를 정확히 인식하세요 (예: "2PN" = 2베드룸, "Miễn phí quản lý" = 관리비 포함)
- 숫자만 추출하세요 (예: "50m²" → 50, "10 triệu" → 10000000)
- 주소는 "Quận 7" → districtCode: "766" 형식으로 변환
- 핑크북: "Sổ hồng" 또는 "Có sổ hồng" → pinkBook: true
- 오토바이 주차: "Bãi đậu xe máy" → motorcycleParking: true
- 가구: "Nội thất" → furniture: "fully_furnished", "Không nội thất" → "unfurnished"
- 보증금: "Không cần đặt cọc" → depositRequired: false

JSON만 반환하고 다른 설명은 포함하지 마세요.`;

      logger.debug('Extracting property info from Vietnamese', { inputLength: vietnameseInput.length });

      // Direct HTTP call to Gemini API v1
      // Try different model names (prioritize available models if found)
      const defaultModels = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
      const modelNames = availableModels.length > 0 ? availableModels : defaultModels;
      let lastError: Error | null = null;
      
      for (const modelName of modelNames) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${this.apiKey}`;
          
          const requestBody = {
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          };

          logger.debug(`Trying model: ${modelName}`);

          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            logger.debug(`✅ Successfully using model: ${modelName}`);
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
              logger.error('Invalid Gemini API response', data);
              throw new Error('Invalid response format from Gemini API');
            }

            const text = data.candidates[0].content.parts[0].text.trim();

            // JSON 추출 (마크다운 코드 블록 제거)
            let jsonText = text;
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/```\n?/g, '');
            }

            const extractedData = JSON.parse(jsonText) as Partial<CreatePropertyRequest>;

            // 데이터 정규화
            return this.normalizeExtractedData(extractedData);
          } else {
            const errorText = await response.text();
            lastError = new Error(`Model ${modelName}: ${response.status} ${response.statusText}`);
            logger.debug(`Model ${modelName} failed (${response.status}), trying next...`);
            continue;
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
          logger.debug(`Model ${modelName} error, trying next...`, { error: lastError.message });
          continue;
        }
      }
      
      // All models failed
      logger.error('All Gemini models failed', { models: modelNames, lastError: lastError?.message });
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);

    } catch (error) {
      logger.error('Failed to extract property info from Vietnamese', error);
      throw new Error(
        `Property extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 추출된 데이터 정규화
   */
  private normalizeExtractedData(data: Partial<CreatePropertyRequest>): Partial<CreatePropertyRequest> {
    const normalized: Partial<CreatePropertyRequest> = { ...data };

    // 주소 코드 검증 및 변환
    if (normalized.address) {
      // Type assertion for address with code fields
      const addressWithCodes = normalized.address as Partial<VietnamAddress> & { 
        provinceCode?: string; 
        districtCode?: string; 
        wardCode?: string;
      };

      // Province 코드 검증
      if (addressWithCodes.provinceCode) {
        const province = getProvinceByCode(addressWithCodes.provinceCode);
        if (!province) {
          logger.warn('Invalid province code', { code: addressWithCodes.provinceCode });
          delete addressWithCodes.provinceCode;
        }
      }

      // District 코드 검증
      if (addressWithCodes.districtCode && addressWithCodes.provinceCode) {
        const district = getDistrictByCode(
          addressWithCodes.districtCode,
          addressWithCodes.provinceCode
        );
        if (!district) {
          logger.warn('Invalid district code', {
            code: addressWithCodes.districtCode,
            provinceCode: addressWithCodes.provinceCode,
          });
        }
      }
    }

    // 가격 단위 기본값
    if (normalized.price && !normalized.priceUnit) {
      normalized.priceUnit = 'vnd';
    }

    // 베트남 옵션 정규화
    if (normalized.vietnamOptions) {
      // Furniture 옵션 변환
      if (typeof normalized.vietnamOptions.furniture === 'string') {
        const furnitureMap: Record<string, FurnitureOption> = {
          'fully_furnished': FurnitureOption.FULLY_FURNISHED,
          'partially_furnished': FurnitureOption.PARTIALLY_FURNISHED,
          'unfurnished': FurnitureOption.UNFURNISHED,
        };
        normalized.vietnamOptions.furniture =
          furnitureMap[normalized.vietnamOptions.furniture] || FurnitureOption.UNFURNISHED;
      }
    }

    return normalized;
  }

  /**
   * 부동산 생성
   */
  async createProperty(request: CreatePropertyRequest): Promise<Property> {
    let propertyData: Partial<CreatePropertyRequest> = { ...request };

    // 베트남어 입력이 있으면 AI로 정보 추출
    if (request.vietnameseInput) {
      logger.info('Processing Vietnamese input', { inputLength: request.vietnameseInput.length });
      const extractedData = await this.extractPropertyInfoFromVietnamese(request.vietnameseInput);
      
      // 추출된 데이터와 명시적 입력 병합 (명시적 입력이 우선)
      propertyData = {
        ...extractedData,
        ...request,
        vietnameseInput: undefined, // 추출 후 제거
      };
    }

    // 필수 필드 검증
    this.validatePropertyData(propertyData);

    // Property 객체 생성
    const property: Property = {
      id: this.generatePropertyId(),
      type: propertyData.type || PropertyType.APARTMENT,
      transactionType: propertyData.transactionType || TransactionType.RENT,
      title: propertyData.title || '',
      description: propertyData.description || '',
      address: this.buildAddress(propertyData.address),
      price: propertyData.price || 0,
      priceUnit: propertyData.priceUnit || 'vnd',
      area: propertyData.area || 0,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      vietnamOptions: this.buildVietnamOptions(propertyData.vietnamOptions || {}),
      images: propertyData.images || [],
      contactPhone: propertyData.contactPhone,
      contactEmail: propertyData.contactEmail,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system', // TODO: 실제 사용자 ID
    };

    logger.info('Property created', { propertyId: property.id, type: property.type });

    return property;
  }

  /**
   * 주소 객체 생성
   */
  private buildAddress(addressData?: Partial<VietnamAddress>): VietnamAddress {
    // TODO: 실제 주소 데이터베이스에서 조회
    // 여기서는 기본 구조만 반환
    return {
      province: getProvinceByCode(addressData?.province?.code || '79') || {
        code: '79',
        name: 'Thành phố Hồ Chí Minh',
        nameEn: 'Ho Chi Minh City',
        type: 'city',
      },
      district: getDistrictByCode(addressData?.district?.code || '766') || {
        code: '766',
        name: 'Quận 7',
        nameEn: 'District 7',
        type: 'urban',
        provinceCode: '79',
      },
      ward: {
        code: '000',
        name: 'Unknown',
        nameEn: 'Unknown',
        type: 'urban',
        districtCode: addressData?.district?.code || '766',
        provinceCode: addressData?.province?.code || '79',
      },
      street: addressData?.street,
      houseNumber: addressData?.houseNumber,
    };
  }

  /**
   * 베트남 옵션 객체 생성
   */
  private buildVietnamOptions(
    options?: Partial<Property['vietnamOptions']>
  ): Property['vietnamOptions'] {
    return {
      motorcycleParking: options?.motorcycleParking || false,
      pinkBook: options?.pinkBook || false,
      pinkBookStatus: options?.pinkBookStatus,
      furniture: options?.furniture || FurnitureOption.UNFURNISHED,
      balcony: options?.balcony,
      security: options?.security,
      elevator: options?.elevator,
      swimmingPool: options?.swimmingPool,
      gym: options?.gym,
      parking: options?.parking,
      managementFeeIncluded: options?.managementFeeIncluded,
      managementFee: options?.managementFee,
      depositRequired: options?.depositRequired,
      depositAmount: options?.depositAmount,
    };
  }

  /**
   * 부동산 데이터 검증
   */
  private validatePropertyData(data: Partial<CreatePropertyRequest>): void {
    if (!data.type && !data.vietnameseInput) {
      throw new Error('Property type is required');
    }
    if (!data.price && !data.vietnameseInput) {
      throw new Error('Price is required');
    }
    if (!data.area && !data.vietnameseInput) {
      throw new Error('Area is required');
    }
  }

  /**
   * Property ID 생성
   */
  private generatePropertyId(): string {
    return `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
