import { NextResponse } from 'next/server';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// OTP를 임시로 저장할 인메모리 저장소 (실제 운영 환경에서는 Redis나 DB 권장)
// 이 저장소는 서버가 재시작되면 초기화됩니다.
const otpStore = new Map<string, { code: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 6자리 랜덤 코드 생성
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 5분 후 만료
    const expires = Date.now() + 5 * 60 * 1000;
    otpStore.set(phoneNumber, { code: otpCode, expires });

    // AWS SNS 설정
    const snsClient = new SNSClient({
      region: process.env.AWS_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const message = `[500stayviet] Verification code: ${otpCode}`;

    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
      MessageAttributes: {
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: '500stay',
        },
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    // 실제 발송 (환경 변수가 설정된 경우에만)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      await snsClient.send(command);
      console.log(`OTP ${otpCode} sent to ${phoneNumber}`);
    } else {
      console.warn('AWS Credentials not found. OTP is:', otpCode);
      // 개발 편의를 위해 로그에만 출력
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
  }
}

// OTP 검증을 위한 별도의 GET 또는 POST 핸들러 (같은 파일 내에서 처리 가능하지만 명확성을 위해 분리 권장)
// 여기서는 편의상 같은 파일에 검증 로직을 위한 export를 추가하거나 별도 파일을 만듭니다.
export async function PUT(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();
    const storedData = otpStore.get(phoneNumber);

    if (!storedData) {
      return NextResponse.json({ error: 'No OTP found for this number' }, { status: 400 });
    }

    if (Date.now() > storedData.expires) {
      otpStore.delete(phoneNumber);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    if (storedData.code === code) {
      otpStore.delete(phoneNumber); // 사용 완료 후 삭제
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
