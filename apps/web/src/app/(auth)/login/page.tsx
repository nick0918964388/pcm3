import { LoginForm } from '@/components/features/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            登入 PCM 平台
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            請輸入您的帳號密碼以繼續
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}