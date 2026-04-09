-- 앱 원장 초기화: 회원·매물·예약·채팅·KYC 프로필만 삭제 (AdminAccount, AdminSharedMemo 유지)
-- 실행: npx prisma db execute --file prisma/sql/reset_app_ledger.sql
DELETE FROM "Message";
DELETE FROM "ChatRoom";
DELETE FROM "Booking";
DELETE FROM "Property";
DELETE FROM "LessorProfile";
DELETE FROM "Session";
DELETE FROM "Account";
DELETE FROM "VerificationToken";
DELETE FROM "User";
