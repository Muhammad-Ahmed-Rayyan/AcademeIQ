import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, mode, isLoading } = useAuthStore();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative backdrop elements (academic/graph theme, no purple gradients) */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/3 rounded-full filter blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] bg-surface border border-border rounded-lg shadow-lg p-8 z-10 transition-all duration-200 hover:border-primary/30">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M2 10L12 5L22 10L12 15L2 10Z" strokeWidth="1.8" />
              <path d="M6 12.5V16C6 17.5 8.5 19 12 19C15.5 19 18 17.5 18 16V12.5" strokeWidth="1.8" />
              <circle cx="12" cy="12" r="1.5" fill="#4F8EF7" />
              <circle cx="8" cy="10" r="1" fill="#4F8EF7" />
              <circle cx="16" cy="10" r="1" fill="#4F8EF7" />
              <circle cx="12" cy="16.5" r="1" fill="#4F8EF7" />
              <path d="M12 12L8 10" strokeWidth="0.8" opacity="0.8" />
              <path d="M12 12L16 10" strokeWidth="0.8" opacity="0.8" />
              <path d="M12 12L12 16.5" strokeWidth="0.8" opacity="0.8" />
              <path d="M22 10v6" />
              <circle cx="22" cy="16.5" r="0.8" fill="#4F8EF7" />
            </svg>
          </div>
          <h1 className="font-sans font-bold text-xl text-text-primary tracking-tight mb-2">
            AcademeIQ
          </h1>
          <p className="text-sm text-text-secondary text-center px-4">
            Your intelligent academic life agent
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={login}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-[#4F8EF7] hover:bg-[#6BA3FF] text-text-primary font-medium py-3 px-4 rounded-md transition-all duration-120 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 select-none shadow-md"
        >
          {/* Custom Google Icon */}
          <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span className="text-[14px]">Sign in with Google</span>
        </button>

        {/* Development Mode Helper */}
        {mode === 'mock' && (
          <div className="mt-6 flex items-center justify-center gap-2 border border-dashed border-border rounded-md p-3 bg-border/20 text-xs text-text-secondary select-none">
            <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-center font-mono">
              OAuth mode: <strong className="text-primary">MOCK/DEV</strong>. Clicking will instantly log you in with a sample student profile.
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 text-xs text-text-disabled font-mono">
        AcademeIQ v0.1.0 • Concierge Agent Track
      </div>
    </div>
  );
};
