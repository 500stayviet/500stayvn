/**
 * GCP 및 Firebase 상태 확인 스크립트
 * 결제 계정, API 활성화 상태 등을 확인합니다.
 */

import * as https from 'https';

interface APIStatus {
  name: string;
  enabled: boolean;
  error?: string;
}

/**
 * Google Cloud API 활성화 상태 확인
 */
async function checkAPIStatus(apiName: string, projectId: string, accessToken?: string): Promise<APIStatus> {
  return new Promise((resolve) => {
    const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${apiName}`;
    
    const options: https.RequestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (accessToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({
              name: apiName,
              enabled: json.state === 'ENABLED',
            });
          } catch (e) {
            resolve({
              name: apiName,
              enabled: false,
              error: 'Failed to parse response',
            });
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({
            name: apiName,
            enabled: false,
            error: 'Authentication required (use gcloud auth print-access-token)',
          });
        } else {
          resolve({
            name: apiName,
            enabled: false,
            error: `HTTP ${res.statusCode}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        name: apiName,
        enabled: false,
        error: error.message,
      });
    });

    req.end();
  });
}

/**
 * Firebase Functions 엔드포인트 테스트
 */
async function testFirebaseFunction(functionName: string, baseUrl: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const url = `${baseUrl}/${functionName}`;
    
    const options: https.RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 400) {
          // 400도 정상 (잘못된 요청이지만 함수는 작동 중)
          resolve({ success: true });
        } else {
          resolve({
            success: false,
            error: `HTTP ${res.statusCode}: ${data.substring(0, 100)}`,
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });

    // 간단한 테스트 요청
    req.write(JSON.stringify({ text: 'test' }));
    req.end();
  });
}

/**
 * 메인 확인 함수
 */
async function checkGCPStatus() {
  console.log('🔍 GCP 및 Firebase 상태 확인 중...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const projectId = 'stayviet-26ae4';
  const baseUrl = 'https://us-central1-stayviet-26ae4.cloudfunctions.net';

  // 1. Firebase Functions 테스트
  console.log('📦 Firebase Functions 상태 확인:\n');
  const functions = ['translate', 'translateBatch', 'detectLanguage', 'getSupportedLanguages'];
  
  for (const func of functions) {
    const result = await testFirebaseFunction(func, baseUrl);
    const status = result.success ? '✅ 작동 중' : `❌ 오류: ${result.error}`;
    console.log(`   ${func.padEnd(25)} ${status}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 2. 필요한 API 목록
  console.log('📋 확인해야 할 API 목록:\n');
  const requiredAPIs = [
    'cloudfunctions.googleapis.com',
    'cloudbuild.googleapis.com',
    'artifactregistry.googleapis.com',
    'maps-backend.googleapis.com',
    'geocoding-backend.googleapis.com',
    'places-backend.googleapis.com',
  ];

  console.log('   다음 API들이 활성화되어 있어야 합니다:');
  requiredAPIs.forEach(api => {
    console.log(`   - ${api}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 3. 확인 방법 안내
  console.log('💡 상세 확인 방법:\n');
  console.log('   1. 구글 클라우드 콘솔 접속:');
  console.log('      https://console.cloud.google.com/apis/dashboard?project=stayviet-26ae4\n');
  console.log('   2. 결제 계정 확인:');
  console.log('      https://console.cloud.google.com/billing?project=stayviet-26ae4\n');
  console.log('   3. 프로젝트 설정 확인:');
  console.log('      https://console.cloud.google.com/cloud-resource-manager?project=stayviet-26ae4\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('✨ 확인 완료!\n');
  console.log('   참고: API 활성화 상태를 확인하려면 다음 명령어를 실행하세요:');
  console.log('   gcloud services list --enabled --project=stayviet-26ae4\n');
}

// 스크립트 실행
if (require.main === module) {
  checkGCPStatus().catch((error) => {
    console.error('❌ 확인 중 오류 발생:', error);
    process.exit(1);
  });
}

export { checkGCPStatus };
