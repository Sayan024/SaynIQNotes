'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Play, BookOpen, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleGoogleLogin = async () => {
    setLoading('google');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  const handleDemoLogin = async () => {
    setLoading('demo');
    try {
      await signIn('credentials', { callbackUrl: '/' });
    } catch (err) {
      console.error(err);
      setLoading(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-medium animate-pulse">Loading SaynIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 shadow-lg shadow-blue-500/30">
            <BrainCircuit className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
              SaynIQ Notes
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              "Capture Ideas. Organize Knowledge. Accelerate Learning."
            </p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl font-bold tracking-tight text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Access your personal knowledge hub and sync to Google Sheets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2 h-11"
              onClick={handleGoogleLogin}
              disabled={loading !== null}
            >
              {loading === 'google' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or test locally</span>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-medium flex items-center justify-center gap-2 h-11 shadow-lg shadow-blue-500/20"
              onClick={handleDemoLogin}
              disabled={loading !== null}
            >
              {loading === 'demo' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
              Enter Demo Mode (No Setup Required)
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-4">
            <div className="flex justify-center items-center gap-1.5 text-slate-400">
              <BookOpen className="h-3.5 w-3.5 text-teal-400" />
              <span>Free, personal knowledge management platform.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
