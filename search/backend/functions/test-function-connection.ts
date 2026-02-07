/**
 * Firebase Functions 연결 테스트
 * 실제 API 호출을 통해 함수가 정상 작동하는지 확인
 */

const BASE_URL = 'https://us-central1-stayviet-26ae4.cloudfunctions.net';

interface TestResult {
  functionName: string;
  success: boolean;
  statusCode?: number;
  message: string;
  response?: any;
}

async function testFunction(functionName: string, payload: any): Promise<TestResult> {
  try {
    const url = `${BASE_URL}/${functionName}`;
    console.log(`\n🔍 Testing ${functionName}...`);
    console.log(`   URL: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let responseData: any = null;
    try {
      const text = await response.text();
      if (text) {
        responseData = JSON.parse(text);
      }
    } catch (e) {
      // JSON 파싱 실패는 무시
    }

    if (response.status === 200) {
      return {
        functionName,
        success: true,
        statusCode: response.status,
        message: '✅ 정상 작동',
        response: responseData,
      };
    } else if (response.status === 400) {
      return {
        functionName,
        success: true, // 400은 함수가 작동하지만 잘못된 요청
        statusCode: response.status,
        message: '✅ 함수 작동 중 (잘못된 요청)',
        response: responseData,
      };
    } else if (response.status === 403) {
      return {
        functionName,
        success: false,
        statusCode: response.status,
        message: '❌ 403 Forbidden - 결제 계정 또는 권한 문제',
      };
    } else {
      return {
        functionName,
        success: false,
        statusCode: response.status,
        message: `❌ HTTP ${response.status}`,
        response: responseData,
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        functionName,
        success: false,
        message: '❌ 타임아웃: 요청이 10초 내에 완료되지 않음',
      };
    } else {
      return {
        functionName,
        success: false,
        message: `❌ 오류: ${error.message}`,
      };
    }
  }
}

async function runTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🧪 Firebase Functions 연결 테스트');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results: TestResult[] = [];

  // 1. getSupportedLanguages 테스트 (가장 간단한 함수)
  const test1 = await testFunction('getSupportedLanguages', {});
  results.push(test1);
  console.log(`   ${test1.message}`);

  // 2. detectLanguage 테스트
  const test2 = await testFunction('detectLanguage', {
    text: 'Hello world',
  });
  results.push(test2);
  console.log(`   ${test2.message}`);

  // 3. translate 테스트
  const test3 = await testFunction('translate', {
    text: 'Căn hộ 2PN Quận 7',
    targetLanguage: 'ko',
    sourceLanguage: 'vi',
  });
  results.push(test3);
  console.log(`   ${test3.message}`);

  // 4. translateBatch 테스트
  const test4 = await testFunction('translateBatch', {
    texts: ['Hello', 'World'],
    targetLanguage: 'ko',
  });
  results.push(test4);
  console.log(`   ${test4.message}`);

  // 결과 요약
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 테스트 결과 요약\n');

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`   ${icon} ${result.functionName.padEnd(25)} ${result.message}`);
    if (result.statusCode) {
      console.log(`      HTTP Status: ${result.statusCode}`);
    }
  });

  console.log(`\n   총 ${totalCount}개 함수 중 ${successCount}개 정상 작동\n`);

  if (successCount === totalCount) {
    console.log('🎉 모든 함수가 정상적으로 작동하고 있습니다!');
    console.log('   결제 계정이 정상적으로 활성화되어 있습니다.\n');
  } else if (successCount > 0) {
    console.log('⚠️  일부 함수만 작동 중입니다.');
    console.log('   결제 계정 또는 권한 설정을 확인해주세요.\n');
  } else {
    console.log('❌ 모든 함수가 작동하지 않습니다.');
    console.log('   결제 계정이 비활성화되었거나 권한 문제가 있습니다.\n');
    console.log('   확인 링크:');
    console.log('   - 결제 계정: https://console.cloud.google.com/billing?project=stayviet-26ae4');
    console.log('   - API 대시보드: https://console.cloud.google.com/apis/dashboard?project=stayviet-26ae4\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// 스크립트 실행
if (require.main === module) {
  runTests().catch((error) => {
    console.error('\n💥 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

export { runTests };
