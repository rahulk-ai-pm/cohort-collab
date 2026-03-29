import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

export default function LoginPage() {
  const { user } = useAuth();

  if (user) {
    window.location.href = user.role === 'admin' ? '/admin' : '/dashboard';
    return null;
  }

  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left: Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1741766936431-406804fc36c8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYnVpbGRpbmclMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzQ3NjM2MDF8MA&ixlib=rb-4.1.0&q=85"
          alt="Modern campus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="text-sm font-mono tracking-widest uppercase text-slate-300 mb-3">IIM Kozhikode</p>
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Advanced Product Management
          </h2>
          <p className="mt-2 text-slate-300 text-base">Batch 06 Cohort Platform</p>
        </div>
      </div>

      {/* Right: Sign In */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">APM Cohort</h1>
                <p className="text-xs text-slate-500 font-mono">BATCH 06</p>
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-3 text-slate-500 text-base leading-relaxed">
              Sign in with your Google account to connect with your cohort.
            </p>
          </div>

          <Button
            data-testid="google-signin-btn"
            onClick={handleLogin}
            className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-base font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-xs text-slate-400 mt-6">
            Only cohort members can sign in. Your profile will be visible to other batch mates.
          </p>
        </div>
      </div>
    </div>
  );
}
