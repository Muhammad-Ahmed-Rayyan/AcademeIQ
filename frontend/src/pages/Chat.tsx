import React, { useState } from 'react';
import { Send, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Chat: React.FC = () => {
  const { user } = useAuthStore();
  const [messages] = useState([
    {
      sender: 'agent',
      text: `Hello ${user?.name || 'there'}! I am **AcademeIQ**, your academic concierge. I can read your emails, check deadlines in your calendar, build structured study plans, and draft replies for your professors.\n\nWhat can I assist you with today?`,
      timestamp: '11:00 AM'
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] select-none">
      {/* Top Info Bar */}
      <div className="h-11 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-text-primary tracking-wide">AcademeIQ Agent Session</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-warning">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Writes require explicit confirmation</span>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-background flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="2" className="w-5 h-5">
                    <path d="M2 10L12 5L22 10L12 15L2 10Z" />
                    <path d="M6 12.5V16C6 17.5 8.5 19 12 19C15.5 19 18 17.5 18 16V12.5" />
                  </svg>
                </div>
              )}

              <div className={`space-y-1.5 max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-xl text-base ${
                    msg.sender === 'user'
                      ? 'bg-primary text-text-primary rounded-tr-none'
                      : 'bg-surface border border-border text-text-primary rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
                {/* Meta details */}
                <div className={`text-[10px] font-mono text-text-secondary flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              {msg.sender === 'user' && (
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=96&h=96'}
                  alt="User avatar"
                  className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0 order-3"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-border bg-background flex-shrink-0">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="max-w-3xl mx-auto flex items-center gap-3 relative"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask AcademeIQ to schedule a study plan, check your inbox..."
              className="w-full h-11 bg-surface border border-border rounded-md px-4 pr-10 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary transition-colors duration-150"
            />
            <div className="absolute right-3.5 top-3.5">
              <MessageSquare className="w-4 h-4 text-text-disabled" />
            </div>
          </div>
          <button
            type="submit"
            className="w-11 h-11 bg-primary hover:bg-primary-hover text-text-primary flex items-center justify-center rounded-md active:scale-95 transition-all duration-120 focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
