/**
 * Firebase Bridge (가짜 파일)
 * Firebase에서 AWS S3/RDS로 전환하는 동안 빌드 에러를 방지하기 위한 파일입니다.
 */

// 1. 실제 라이브러리를 부르지 않도록 모두 가짜 객체로 대체합니다.
const app = {} as any;
const db = {} as any;
const auth = {} as any;
const storage = {} as any;

// 2. 다른 파일에서 import { db, auth } 로 쓸 수 있게 export 합니다.
export { app, db, auth, storage };

// 3. 기본 내보내기 설정
export default app;
