import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, MessageSquare, ShieldAlert, Trash2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const Chat: React.FC = () => {
  const { user, mode } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'agent',
      text: `Hello ${user?.name || 'there'}! I am **AcademeIQ**, your academic concierge. I can read your emails, check deadlines in your calendar, build structured study plans, and draft replies for your professors.\n\nWhat can I assist you with today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const location = useLocation();

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Prefill initial message if navigated from quick actions on dashboard
  useEffect(() => {
    if (location.state?.initialMessage) {
      setInputValue(location.state.initialMessage);
      // Clear state so it doesn't prefill again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userPrompt = inputValue.trim();
    setInputValue('');

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to state
    const userMessage: Message = {
      sender: 'user',
      text: userPrompt,
      timestamp: timeString
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Connect to backend stream with credentials (cookies) included
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userPrompt }),
        // Critical: include cookies so session ID matches
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('Response body reader is not available');
      }

      // Add a blank placeholder assistant message to fill during stream
      const placeholderAgentMessage: Message = {
        sender: 'agent',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, placeholderAgentMessage]);
      setIsTyping(false);

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse server-sent events split by double newlines
        const lines = buffer.split('\n\n');
        // Keep the last partial element in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const payload = JSON.parse(trimmedLine.slice(6));
              
              if (payload.type === 'text') {
                const chunkContent = payload.content;
                // Append text chunk to the last assistant message
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.sender === 'agent') {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      text: lastMsg.text + chunkContent
                    };
                  }
                  return updated;
                });
              } else if (payload.type === 'done') {
                // Done event
              } else if (payload.type === 'error') {
                console.error("Agent returned error:", payload.content);
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.sender === 'agent') {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      text: lastMsg.text + `\n\n*(Error: ${payload.content})*`
                    };
                  }
                  return updated;
                });
              }
            } catch (err) {
              console.error("Failed to parse SSE payload", err, trimmedLine);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Streaming failed:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        sender: 'agent',
        text: `Error connecting to AcademeIQ. Please make sure the backend is running. (Detail: ${error.message || error})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleClearChat = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/clear`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        setMessages([
          {
            sender: 'agent',
            text: `Conversation cleared. I am ready to start fresh!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to clear chat history on backend', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] select-none">
      {/* Top Info Bar */}
      <div className="h-11 bg-surface border-b border-border flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-text-primary tracking-wide">AcademeIQ Assistant</span>
          </div>
          {/* Active Model Indicator */}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5 ${
            mode === 'real' 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-warning/10 text-warning border border-warning/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${mode === 'real' ? 'bg-success animate-pulse' : 'bg-warning'}`}></span>
            {mode === 'real' ? 'gemini-2.5-flash' : 'offline-simulation'}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-text-secondary">
            <ShieldAlert className="w-3.5 h-3.5 text-warning" />
            <span>All writes require your approval</span>
          </div>
          <button
            onClick={handleClearChat}
            disabled={isClearing}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-danger border border-border hover:border-danger/35 px-2.5 py-1 rounded transition-colors duration-150 active:scale-95 bg-surface/50 disabled:opacity-50"
            title="Reset Chat Session"
          >
            {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>New Chat</span>
          </button>
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
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface flex-shrink-0">
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
                  {msg.sender === 'agent' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.text || 'Thinking...'}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  )}
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

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-surface flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="2" className="w-5 h-5">
                  <path d="M2 10L12 5L22 10L12 15L2 10Z" />
                  <path d="M6 12.5V16C6 17.5 8.5 19 12 19C15.5 19 18 17.5 18 16V12.5" />
                </svg>
              </div>
              <div className="bg-surface border border-border p-4 rounded-xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-text-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-border bg-background flex-shrink-0">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto flex items-center gap-3 relative"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              placeholder="Ask AcademeIQ to check deadlines, draft email extensions..."
              className="w-full h-11 bg-surface border border-border rounded-md px-4 pr-10 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary disabled:opacity-50 transition-colors duration-150"
            />
            <div className="absolute right-3.5 top-3.5">
              <MessageSquare className="w-4 h-4 text-text-disabled" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="w-11 h-11 bg-primary hover:bg-primary-hover disabled:bg-primary/45 disabled:text-text-disabled text-text-primary flex items-center justify-center rounded-md active:scale-95 transition-all duration-120 focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
