import { TranslationResponse, SupportedLanguage } from '../types/translation.types';
import { TranslationConfig } from '../types/config.types';
import { cacheService } from './cacheService';
import { logger } from '../utils/logger';
import { getRealEstateTermsPrompt, applyRealEstateTerms } from '../utils/translationTerms';

/**
 * Translation Service
 * Handles translation operations for multiple languages
 */
export class TranslationService {
  private config: TranslationConfig;
  private apiKey: string;

  constructor(config?: Partial<TranslationConfig>) {
    this.config = {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'ko', 'ja', 'zh', 'vi'],
      apiKey: process.env.GEMINI_API_KEY || process.env.TRANSLATION_API_KEY || '',
      ...config,
    };
    
    this.apiKey = this.config.apiKey;
    
    if (!this.apiKey) {
      logger.warn('TranslationService: GEMINI_API_KEY not configured');
    } else {
      logger.debug('TranslationService: API key configured (using direct HTTP calls)');
    }
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResponse> {
    try {
      if (!text || !text.trim()) {
        throw new Error('Text to translate cannot be empty');
      }

      if (!this.isLanguageSupported(targetLanguage)) {
        throw new Error(`Target language ${targetLanguage} is not supported`);
      }

      // Check cache first
      const cacheKey = cacheService.generateTranslationKey(
        text,
        sourceLanguage || 'auto',
        targetLanguage
      );
      const cached = cacheService.get<TranslationResponse>(cacheKey);
      if (cached) {
        logger.debug('Translation cache hit', { cacheKey });
        return cached;
      }

      // If source language is not provided, try to detect it
      const detectedSourceLanguage = sourceLanguage || await this.detectLanguage(text);

      // If source and target are the same, return original text
      if (detectedSourceLanguage === targetLanguage) {
        const result: TranslationResponse = {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedSourceLanguage,
          targetLanguage,
          confidence: 1.0,
        };
        cacheService.set(cacheKey, result);
        return result;
      }

      // Perform translation
      const translatedText = await this.performTranslation(
        text,
        detectedSourceLanguage,
        targetLanguage
      );

      const result: TranslationResponse = {
        originalText: text,
        translatedText,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage,
        confidence: 0.95,
      };

      // Cache the result
      cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      logger.error('Translation failed', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Translate multiple texts at once
   */
  async translateBatch(
    texts: string[],
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResponse[]> {
    const promises = texts.map(text =>
      this.translate(text, targetLanguage, sourceLanguage)
    );

    return Promise.all(promises);
  }

  /**
   * Detect the language of the given text
   */
  async detectLanguage(text: string): Promise<SupportedLanguage> {
    // Simple language detection logic
    // In production, you would use a proper language detection API
    const koreanPattern = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    const japanesePattern = /[ひらがな|カタカナ|漢字]/;
    const chinesePattern = /[一-龯]/;
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    if (koreanPattern.test(text)) {
      return 'ko';
    }
    if (japanesePattern.test(text)) {
      return 'ja';
    }
    if (chinesePattern.test(text)) {
      return 'zh';
    }
    if (vietnamesePattern.test(text)) {
      return 'vi';
    }

    return 'en'; // Default to English
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: SupportedLanguage): boolean {
    return this.config.supportedLanguages.includes(language);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.config.supportedLanguages];
  }

  /**
   * Perform the actual translation using Gemini API v1 (direct HTTP call)
   */
  private async performTranslation(
    text: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY environment variable in .env file.');
    }

    try {
      // 언어 코드 매핑
      const languageNames: Record<SupportedLanguage, string> = {
        en: 'English',
        ko: 'Korean',
        ja: 'Japanese',
        zh: 'Chinese',
        vi: 'Vietnamese',
      };

      const sourceLangName = languageNames[sourceLanguage];
      const targetLangName = languageNames[targetLanguage];

      // 부동산 용어 사전 프롬프트 (베트남어 -> 한국어인 경우)
      const realEstatePrompt = 
        sourceLanguage === 'vi' && targetLanguage === 'ko' 
          ? getRealEstateTermsPrompt() + '\n\n'
          : '';

      const prompt = `${realEstatePrompt}다음 텍스트를 ${sourceLangName}에서 ${targetLangName}로 번역해주세요. 
번역할 때 원문의 의미와 톤을 정확히 유지해주세요.

원문:
${text}

번역:`;

      logger.debug('Calling Gemini API v1 (direct HTTP)', { sourceLanguage, targetLanguage, textLength: text.length });

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

            let translatedText = data.candidates[0].content.parts[0].text.trim();

            // 부동산 용어 사전 적용 (베트남어 -> 한국어인 경우)
            if (sourceLanguage === 'vi' && targetLanguage === 'ko') {
              translatedText = applyRealEstateTerms(translatedText, 'ko');
            }

            logger.debug('Translation completed', { 
              originalLength: text.length, 
              translatedLength: translatedText.length,
              model: modelName
            });

            return translatedText;
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
      logger.error('Gemini API error', error);
      throw new Error(
        `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

export default TranslationService;
