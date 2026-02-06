// Load environment variables from .env file
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file from functions directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { TranslationService } from './services/translationService';
import { SupportedLanguage } from './types/translation.types';

/**
 * Test runner for translation service with Gemini API
 */
async function runTests() {
  console.log('🚀 Starting Translation Service Tests with Gemini API...\n');

  // Check if API key is set
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('⚠️  Warning: GEMINI_API_KEY environment variable is not set.');
    console.log('   Please set it in .env file or as environment variable:');
    console.log('   GEMINI_API_KEY=your_api_key_here\n');
    process.exit(1);
  } else {
    console.log('✅ GEMINI_API_KEY loaded successfully\n');
  }

  const translationService = new TranslationService({
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ko', 'ja', 'zh', 'vi'],
  });

  // Test: 베트남 부동산 정보 번역 (부동산 용어 사전 적용)
  console.log('🏠 Test: Vietnamese Real Estate Translation with Terms Dictionary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const vietnameseText = 'Căn hộ 2PN Quận 7, Miễn phí quản lý, Không cần đặt cọc';
  console.log('📝 원문 (베트남어):');
  console.log(`   "${vietnameseText}"\n`);
  
  try {
    const result = await translationService.translate(
      vietnameseText,
      'ko', // 한국어로 번역
      'vi'  // 베트남어에서
    );
    
    console.log('✅ 번역 결과:');
    console.log(`   원문: ${result.originalText}`);
    console.log(`   번역: ${result.translatedText}`);
    console.log(`   출발 언어: ${result.sourceLanguage}`);
    console.log(`   목표 언어: ${result.targetLanguage}`);
    console.log(`   신뢰도: ${result.confidence}\n`);
    
    // 부동산 용어 사전 적용 확인
    console.log('🔍 부동산 용어 사전 적용 확인:');
    const expectedTerms = [
      { vi: 'Căn hộ', ko: '아파트' },
      { vi: '2PN', ko: '2베드룸' },
      { vi: 'Quận 7', ko: '7구' },
      { vi: 'Miễn phí quản lý', ko: '관리비 포함' },
      { vi: 'Không cần đặt cọc', ko: '보증금 없음' },
    ];
    
    expectedTerms.forEach(term => {
      const isIncluded = result.translatedText.includes(term.ko);
      console.log(`   ${term.vi} → ${term.ko}: ${isIncluded ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error instanceof Error) {
      console.log('Error Name:', error.name);
      console.log('Error Message:', error.message);
      console.log('Error Stack:', error.stack);
      
      // Additional error details if available
      if ('status' in error) {
        console.log('HTTP Status:', (error as any).status);
      }
      if ('statusText' in error) {
        console.log('HTTP Status Text:', (error as any).statusText);
      }
      if ('errorDetails' in error) {
        console.log('Error Details:', JSON.stringify((error as any).errorDetails, null, 2));
      }
      
      // Check for API key related errors
      if (error.message.includes('API key') || error.message.includes('401') || error.message.includes('403')) {
        console.log('\n💡 Hint: API 키 문제일 수 있습니다. GEMINI_API_KEY를 확인해주세요.');
      }
      
      // Check for model not found errors
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.log('\n💡 Hint: 모델을 찾을 수 없습니다. 모델 이름을 확인해주세요.');
        console.log('   현재 사용 중인 모델: gemini-1.5-flash');
        console.log('   API 버전: v1beta (SDK 기본값)');
        console.log('\n   가능한 원인:');
        console.log('   1. API 키가 Gemini API에 접근 권한이 없을 수 있습니다');
        console.log('   2. Google AI Studio에서 API 키 활성화 확인 필요');
        console.log('   3. 사용 가능한 모델 목록 확인 필요');
      }
    } else {
      console.log('Unknown Error:', JSON.stringify(error, null, 2));
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Test completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch((error) => {
    console.error('\n💥 Test runner failed with unhandled error:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error instanceof Error) {
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      
      // Additional error details
      if ('status' in error) {
        console.error('HTTP Status:', (error as any).status);
      }
      if ('statusText' in error) {
        console.error('HTTP Status Text:', (error as any).statusText);
      }
      if ('errorDetails' in error) {
        console.error('Error Details:', JSON.stringify((error as any).errorDetails, null, 2));
      }
    } else {
      console.error('Unknown Error:', JSON.stringify(error, null, 2));
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  });
}

export { runTests };
