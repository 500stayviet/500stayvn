'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { loginAdmin } from '@/lib/api/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await loginAdmin(username.trim(), password);
    if (!ok) {
      setError('관리자 아이디 또는 비밀번호가 올바르지 않습니다. (DB 미연결 시 서버 로그 확인)');
      return;
    }
    router.replace('/admin/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 sm:p-8">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">관리자 로그인</h1>
            <p className="text-xs text-slate-500">500 STAY Admin · PC 전용</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">아이디</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            로그인
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-400">
          최초 1회: ADMIN_BOOTSTRAP_* 또는 NEXT_PUBLIC_ADMIN_* 와 동일 계정으로 로그인 시 슈퍼 관리자가 DB에
          생성됩니다.
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline">
            서비스 홈으로
          </Link>
        </p>
      </div>
    </div>
  );
}
