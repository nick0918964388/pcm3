'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface LoginFormData {
  username: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError('請輸入帳號');
      return false;
    }
    if (!formData.password.trim()) {
      setError('請輸入密碼');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        username: formData.username.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Generic error message for security - don't reveal if username exists
        setError('帳號或密碼錯誤，請重新輸入');
        // Clear form on failed authentication for security
        setFormData({ username: formData.username, password: '' });
      } else if (result?.ok) {
        // Clear form data on successful login
        setFormData({ username: '', password: '' });
        router.push('/projects');
      } else {
        setError('登入發生錯誤，請稍後再試');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('登入發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-green-700">
          PCM 平台登入
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="username">帳號</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="請輸入您的帳號"
              className="w-full"
              autoComplete="username"
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="請輸入您的密碼"
              className="w-full"
              autoComplete="current-password"
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription id="login-error">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-700 hover:bg-green-800 focus:ring-green-500"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登入中...
              </>
            ) : (
              '登入'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}