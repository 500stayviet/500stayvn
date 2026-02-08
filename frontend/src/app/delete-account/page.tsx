export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">계정 삭제 안내</h1>
        <div className="text-gray-600 mb-6">
          <p className="mb-4">
            계정 삭제를 원하시면 아래 이메일로 문의해주세요.
          </p>
          <p className="text-lg font-semibold text-blue-600">
            bek94909490@gmail.com
          </p>
        </div>
        <div className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            문의 시 계정 정보와 삭제 사유를 함께 알려주시면 빠른 처리에 도움이 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}