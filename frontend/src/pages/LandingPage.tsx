import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { Calendar, Shield, BookOpen, ArrowRight, Github, ChevronDown } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [visibleSections, setVisibleSections] = useState({
    capabilities: false,
    howItWorks: false,
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    const capabilities = document.getElementById('capabilities');
    const howItWorks = document.getElementById('how-it-works');

    if (capabilities) observer.observe(capabilities);
    if (howItWorks) observer.observe(howItWorks);

    return () => observer.disconnect();
  }, []);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.reload();
  };

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
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.95);
            opacity: 0.05;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
            opacity: 0.08;
          }
        }
        @keyframes bounceSlow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        .pulse-glow {
          animation: pulseGlow 6s ease-in-out infinite;
        }
        .bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
        .grid-pattern {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(79, 142, 247, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(79, 142, 247, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Navbar */}
      <nav className="h-14 border-b border-[#2A2D3A] bg-[#0F1117] sticky top-0 z-50 px-6 flex items-center justify-between">
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 select-none cursor-pointer"
        >
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
          onClick={handleLoginRedirect}
          className="flex items-center gap-1.5 bg-[#4F8EF7] hover:bg-[#6BA3FF] text-[#F0F2F8] font-semibold py-1.5 px-4 rounded text-xs transition-all duration-150 active:scale-95 shadow-sm"
        >
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[calc(100vh-56px)] w-full flex flex-col items-center justify-center overflow-hidden grid-pattern px-6">
        {/* Pulsing glow behind the content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4F8EF7] rounded-full filter blur-[120px] pointer-events-none pulse-glow"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center space-y-6">
          {/* Badge */}
          <div className="inline-block px-3 py-1 bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 rounded text-[10px] font-mono font-semibold tracking-widest text-[#4F8EF7] uppercase select-none">
            Kaggle AI Agents Capstone 2026
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold tracking-tight text-[#F0F2F8] leading-[1.1] select-none">
            Your Academic Life,<br />Intelligently Managed
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-[#8B90A7] leading-relaxed max-w-[560px] mx-auto">
            AcademeIQ connects to your Gmail, Calendar, and Drive to help you stay ahead of deadlines, draft emails, and plan your studies — all with your explicit approval.
          </p>

          {/* CTA Action */}
          <div className="pt-2 flex flex-col items-center gap-3 select-none">
            <button
              onClick={handleLoginRedirect}
              className="inline-flex items-center gap-2 bg-[#4F8EF7] hover:bg-[#6BA3FF] text-[#F0F2F8] font-semibold py-3.5 px-7 rounded shadow-md transition-all duration-150 active:scale-97 text-sm"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[10px] text-[#8B90A7] font-mono opacity-80">
              Works with your existing Google Workspace. No data stored on our servers.
            </span>
          </div>
        </div>

        {/* Scroll indicator arrow */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1.5 select-none opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
             onClick={() => document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="text-[10px] font-mono tracking-wider text-[#8B90A7]">SCROLL TO EXPLORE</span>
          <ChevronDown className="w-4 h-4 text-[#4F8EF7] bounce-slow" />
        </div>
      </section>

      {/* Features Section */}
      <section
        id="capabilities"
        className={`py-24 border-t border-[#2A2D3A] bg-[#0F1117] transition-all duration-700 ease-out transform ${
          visibleSections.capabilities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-mono tracking-widest text-[#8B90A7] text-center mb-2 uppercase select-none">Core Capabilities</h2>
          <h3 className="text-2xl font-bold text-center text-[#F0F2F8] mb-16 select-none">Designed for Serious Students</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className={`bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-t-2 hover:border-t-[#4F8EF7] hover:translate-y-[-4px] hover:shadow-lg transition-all duration-150 group delay-0 ${
              visibleSections.capabilities ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex justify-between items-center select-none">
                <div className="w-9 h-9 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                  <Calendar className="w-4.5 h-4.5 text-[#4F8EF7]" />
                </div>
                <span className="text-[10px] font-mono text-[#8B90A7]">FEATURE 01</span>
              </div>
              <h3 className="text-sm font-bold text-[#F0F2F8]">Smart Deadline Tracking</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Automatically surfaces upcoming exams, submissions, and vivas from your calendar and email.
              </p>
            </div>

            {/* Card 2 */}
            <div className={`bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-t-2 hover:border-t-[#4F8EF7] hover:translate-y-[-4px] hover:shadow-lg transition-all duration-150 group delay-[100ms] ${
              visibleSections.capabilities ? 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom duration-300' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex justify-between items-center select-none">
                <div className="w-9 h-9 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                  <Shield className="w-4.5 h-4.5 text-[#4F8EF7]" />
                </div>
                <span className="text-[10px] font-mono text-[#8B90A7]">FEATURE 02</span>
              </div>
              <h3 className="text-sm font-bold text-[#F0F2F8]">Confirm Before Any Action</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Every write operation requires your explicit approval. Nothing is sent or created without you seeing it first.
              </p>
            </div>

            {/* Card 3 */}
            <div className={`bg-[#1A1D27] border border-[#2A2D3A] rounded-lg p-6 space-y-4 hover:border-t-2 hover:border-t-[#4F8EF7] hover:translate-y-[-4px] hover:shadow-lg transition-all duration-150 group delay-[200ms] ${
              visibleSections.capabilities ? 'opacity-100 translate-y-0 animate-in fade-in slide-in-from-bottom duration-500' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex justify-between items-center select-none">
                <div className="w-9 h-9 rounded bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20">
                  <BookOpen className="w-4.5 h-4.5 text-[#4F8EF7]" />
                </div>
                <span className="text-[10px] font-mono text-[#8B90A7]">FEATURE 03</span>
              </div>
              <h3 className="text-sm font-bold text-[#F0F2F8]">Personalized Study Plans</h3>
              <p className="text-xs text-[#8B90A7] leading-relaxed">
                Generate day-by-day study schedules that fit around your existing classes and commitments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className={`py-24 border-t border-[#2A2D3A] bg-[#0F1117] transition-all duration-700 ease-out transform ${
          visibleSections.howItWorks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-mono tracking-widest text-[#8B90A7] text-center mb-2 uppercase select-none">Workflow</h2>
          <h3 className="text-2xl font-bold text-center text-[#F0F2F8] mb-16 select-none">How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className={`relative p-6 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3 overflow-hidden select-none hover:border-[#4F8EF7]/30 transition-colors duration-150 ${
              visibleSections.howItWorks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <span className="text-[120px] font-mono font-bold text-white opacity-[0.02] absolute top-[-30px] right-[-10px] leading-none pointer-events-none select-none">
                01
              </span>
              <span className="text-[10px] font-mono text-[#4F8EF7] font-bold">STEP 01</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Sign in with Google</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed relative z-10">
                Authenticate securely. AcademeIQ acts statelessly and does not store your personal academic data on databases.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`relative p-6 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3 overflow-hidden select-none hover:border-[#4F8EF7]/30 transition-colors duration-150 delay-[100ms] ${
              visibleSections.howItWorks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <span className="text-[120px] font-mono font-bold text-white opacity-[0.02] absolute top-[-30px] right-[-10px] leading-none pointer-events-none select-none">
                02
              </span>
              <span className="text-[10px] font-mono text-[#4F8EF7] font-bold">STEP 02</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Ask AcademeIQ Anything</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed relative z-10">
                Chat with your academic concierge. Draft emails, generate schedules, triages unread updates, or protected focus blocks.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`relative p-6 bg-[#1A1D27]/40 border border-[#2A2D3A] rounded-lg space-y-3 overflow-hidden select-none hover:border-[#4F8EF7]/30 transition-colors duration-150 delay-[200ms] ${
              visibleSections.howItWorks ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <span className="text-[120px] font-mono font-bold text-white opacity-[0.02] absolute top-[-30px] right-[-10px] leading-none pointer-events-none select-none">
                03
              </span>
              <span className="text-[10px] font-mono text-[#4F8EF7] font-bold">STEP 03</span>
              <h4 className="text-sm font-semibold text-[#F0F2F8]">Review and Approve</h4>
              <p className="text-xs text-[#8B90A7] leading-relaxed relative z-10">
                Any writes trigger the ActionPreview modal. Approve, edit inline, or reject before any change hits your Google account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2D3A] bg-[#0F1117] py-10 px-6 max-w-6xl mx-auto w-full select-none space-y-6">
        {/* Row 1 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 select-none cursor-pointer"
          >
            <div className="w-5 h-5">
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
            <span className="text-[14px] font-semibold text-[#F0F2F8] tracking-tight">AcademeIQ</span>
          </div>

          <a
            href="https://github.com/Muhammad-Ahmed-Rayyan/academeiq"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded border border-[#2A2D3A] bg-[#1A1D27] flex items-center justify-center text-[#8B90A7] hover:text-[#4F8EF7] hover:border-[#4F8EF7] transition-all duration-150 active:scale-95"
            aria-label="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

        {/* Row 2 */}
        <div className="text-center text-[11px] sm:text-xs text-[#8B90A7] font-sans leading-relaxed border-t border-[#2A2D3A]/40 pt-6">
          AcademeIQ is an open-source AI agent project built for the Kaggle 5-Day AI Agents Intensive Capstone 2026. Powered by Gemini 2.5 Flash, Google MCP Servers, and FastAPI.
        </div>
      </footer>
    </div>
  );
};
