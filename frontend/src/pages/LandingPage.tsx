import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Shield, BookOpen } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[#4F8EF7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#8B90A7] font-mono text-sm animate-pulse">LOADING ACADEMEIQ...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#F0F2F8] font-sans flex flex-col overflow-x-hidden selection:bg-[#4F8EF7]/20 selection:text-[#4F8EF7]">
      {/* Navbar */}
      <nav className="h-14 border-b border-[#2A2D3A] bg-[#0F1117] sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 select-none">
          <div className="w-6 h-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
              <path d="M2 10L12 5L22 10L12 15L2 10Z" />
              <path d="M6 12.5V16C6 17.5 8.5 19 12 19C15.5 19 18 17.5 18 16V12.5" />
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
          <span className="text-[16px] font-semibold text-[#F0F2F8] tracking-tight">AcademeIQ</span>
        </div>

        <button
          onClick={login}
          className="flex items-center gap-2 bg-[#4F8EF7] hover:bg-[#6BA3FF] text-[#F0F2F8] font-semibold py-1.5 px-4 rounded text-xs transition-all duration-150 active:scale-95 shadow-sm"
        >
          <svg className="w-3.5 h-3.5 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#F0F2F8] leading-tight select-none">
          Your Academic Life,<br />Intelligently Managed
        </h1>
        <p className="text-sm sm:text-base text-[#8B90A7] leading-relaxed max-w-2xl mx-auto">
          AcademeIQ connects to your Gmail, Calendar, and Drive to help you stay ahead of deadlines, draft emails, and plan your studies — all with your explicit approval.
        </p>
        <div className="pt-4">
          <button
            onClick={login}
            className="inline-flex items-center gap-2.5 bg-[#4F8EF7] hover:bg-[#6BA3FF] text-[#F0F2F8] font-semibold py-3 px-6 rounded shadow-md transition-all duration-150 active:scale-97 text-sm select-none"
          >
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Get Started with Google</span>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 border-t border-[#2A2D3A] bg-[#0F1117]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold text-center text-[#F0F2F8] mb-12 uppercase tracking-wider select-none">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-[#4F8EF7] transition-all duration-150 group">
              <div className="w-10 h-10 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                <Calendar className="w-5 h-5 text-[#4F8EF7]" />
              </div>
              <h3 className="text-base font-bold text-[#F0F2F8]">Smart Deadline Tracking</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Automatically surfaces upcoming exams, submissions, and vivas from your calendar and email.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-[#4F8EF7] transition-all duration-150 group">
              <div className="w-10 h-10 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                <Shield className="w-5 h-5 text-[#4F8EF7]" />
              </div>
              <h3 className="text-base font-bold text-[#F0F2F8]">Confirm Before Any Action</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Every write operation requires your explicit approval. Nothing is sent or created without you seeing it first.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-[#4F8EF7] transition-all duration-150 group">
              <div className="w-10 h-10 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                <BookOpen className="w-5 h-5 text-[#4F8EF7]" />
              </div>
              <h3 className="text-base font-bold text-[#F0F2F8]">Personalized Study Plans</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Generate day-by-day study schedules that fit around your existing classes and commitments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 border-t border-[#2A2D3A] bg-[#0F1117] select-none">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold text-center text-[#F0F2F8] mb-12 uppercase tracking-wider">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative p-5 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3">
              <span className="text-xs font-mono text-[#4F8EF7] font-bold">STEP 01</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Sign in with Google</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Authenticate securely. AcademeIQ acts statelessly and does not store your personal academic data on databases.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-5 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3">
              <span className="text-xs font-mono text-[#4F8EF7] font-bold">STEP 02</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Ask AcademeIQ Anything</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Chat with your academic concierge. Draft emails, generate schedules, triages unread updates, or protected focus blocks.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-5 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3">
              <span className="text-xs font-mono text-[#4F8EF7] font-bold">STEP 03</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Review and Approve</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Any writes trigger the ActionPreview modal. Approve, edit inline, or reject before any change hits your Google account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#2A2D3A] bg-[#0F1117] py-8 text-center text-xs text-[#8B90A7] font-mono select-none">
        <p>AcademeIQ — Built for students, by a student. Kaggle AI Agents Capstone 2026</p>
      </footer>
    </div>
  );
};
