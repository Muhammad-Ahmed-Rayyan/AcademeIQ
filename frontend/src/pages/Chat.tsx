import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, MessageSquare, ShieldAlert, Trash2, Loader2, Shield, Check, X, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useLocation } from 'react-router-dom';
import { useAuditStore } from '../store/auditStore';

interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

const formatEventDateTime = (startStr: string, endStr: string) => {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime())) return startStr;
    
    const dayOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    
    const dayPart = start.toLocaleDateString('en-US', dayOptions);
    const startTimePart = start.toLocaleTimeString('en-US', timeOptions);
    const endTimePart = !isNaN(end.getTime()) ? end.toLocaleTimeString('en-US', timeOptions) : '';
    
    return `${dayPart} · ${startTimePart}${endTimePart ? ` – ${endTimePart}` : ''}`;
  } catch (e) {
    return `${startStr} - ${endStr}`;
  }
};

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
  const [pendingAction, setPendingAction] = useState<any | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreview, setEditedPreview] = useState<any>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recover pending action on mount/refresh
  useEffect(() => {
    const recoverPendingAction = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/actions/pending`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pending_actions && data.pending_actions.length > 0) {
            const action = data.pending_actions[0];
            setPendingAction({
              actionId: action.action_id,
              actionType: action.action_type,
              description: action.description,
              preview: action.preview
            });
          }
        }
      } catch (err) {
        console.error("Failed to recover pending actions:", err);
      }
    };
    recoverPendingAction();
  }, []);

  // Intercept Escape key when modal is open to block closing it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pendingAction) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [pendingAction]);

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
        let errorDetail = '';
        try {
          const errData = await response.json();
          errorDetail = errData.detail || errData.message || JSON.stringify(errData);
        } catch {
          try {
            errorDetail = await response.text();
          } catch {
            errorDetail = `HTTP ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errorDetail || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error('Response body reader is not available');
      }

      // Maintain isTyping=true to keep the bouncing dots active until first text chunk
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse server-sent events split by line boundaries
        const lines = buffer.split(/\r?\n/);
        // Keep the last partial element in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith('data:')) {
            try {
              const dataStr = trimmedLine.slice(trimmedLine.indexOf(':') + 1).trim();
              if (!dataStr) continue;
              const payload = JSON.parse(dataStr);
              
              if (payload.type === 'text') {
                const chunkContent = payload.content;
                setIsTyping(false); // Remove dots bubble now that we have text content
                setMessages(prev => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.sender === 'agent') {
                    updated[updated.length - 1] = {
                      ...lastMsg,
                      text: lastMsg.text + chunkContent
                    };
                  } else {
                    updated.push({
                      sender: 'agent',
                      text: chunkContent,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                  }
                  return updated;
                });
              } else if (payload.type === 'pending_action') {
                setPendingAction({
                  actionId: payload.action_id,
                  actionType: payload.action_type,
                  description: payload.description,
                  preview: payload.preview
                });
              } else if (payload.type === 'audit_entry') {
                useAuditStore.getState().addLogEntry(payload.content);
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
      setIsTyping(false);

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

  const handleConfirmAction = async (decision: 'approved' | 'rejected') => {
    if (!pendingAction) return;
    setConfirming(true);
    try {
      const payload: any = {
        action_id: pendingAction.actionId,
        decision: decision
      };
      if (decision === 'approved' && isEditing) {
        payload.modified_data = editedPreview;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/actions/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to execute action');
      }
      
      const data = await response.json();
      if (data.status === 'success' || data.status === 'rejected') {
        if (data.audit_entry) {
          useAuditStore.getState().addLogEntry(data.audit_entry);
        }
        // Build a specific, meaningful toast
        let toastMsg = 'Action cancelled.';
        if (data.status === 'success') {
          const result = data.result || {};
          if (pendingAction.actionType === 'CREATE_CALENDAR_EVENTS') {
            const count = result.created_count ?? (pendingAction.preview?.events?.length ?? 1);
            toastMsg = `${count} event${count !== 1 ? 's' : ''} added to your calendar`;
          } else if (pendingAction.actionType === 'SEND_EMAIL') {
            toastMsg = 'Email sent successfully';
          } else if (pendingAction.actionType === 'CREATE_DRAFT') {
            toastMsg = 'Draft saved to Gmail';
          } else if (pendingAction.actionType === 'SAVE_TO_DRIVE') {
            toastMsg = `File saved to Google Drive`;
          } else {
            toastMsg = 'Action executed successfully';
          }
        }

        setToast({
          type: data.status === 'success' ? 'success' : 'error',
          message: toastMsg
        });
        
        setMessages(prev => [
          ...prev,
          {
            sender: 'agent',
            text: data.status === 'success'
              ? `*✓ Done:* ${toastMsg}.`
              : `*✕ Rejected:* ${pendingAction.description} was cancelled.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      console.error("Action confirmation failed:", err);
      setToast({
        type: 'error',
        message: `Action execution failed: ${err.message}`
      });
    } finally {
      setConfirming(false);
      setPendingAction(null);
      setIsEditing(false);
      setTimeout(() => setToast(null), 4000);
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
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
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
              disabled={isTyping || !!pendingAction}
              placeholder="Ask AcademeIQ to check deadlines, draft email extensions..."
              className="w-full h-11 bg-surface border border-border rounded-md px-4 pr-10 text-[13px] text-text-primary placeholder-text-disabled focus:outline-none focus:border-primary disabled:opacity-50 transition-colors duration-150"
            />
            <div className="absolute right-3.5 top-3.5">
              <MessageSquare className="w-4 h-4 text-text-disabled" />
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping || !!pendingAction}
            className="w-11 h-11 bg-primary hover:bg-primary-hover disabled:bg-primary/45 disabled:text-text-disabled text-text-primary flex items-center justify-center rounded-md active:scale-95 transition-all duration-120 focus:outline-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border select-none ${
          toast.type === 'success' 
            ? 'bg-success/15 border-success/30 text-success' 
            : 'bg-danger/15 border-danger/30 text-danger'
        }`}>
          <div className="font-semibold text-xs tracking-wide">
            {toast.message}
          </div>
        </div>
      )}

      {/* Action Preview Modal */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-background border-b border-border">
              <Shield className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Security Review Required</h3>
                <p className="text-[11px] text-text-secondary">{pendingAction.description || 'AcademeIQ is requesting permission to execute a write action.'}</p>
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[350px]">
              <div className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                <span className="text-text-secondary font-mono">ACTION TYPE:</span>
                <span className="font-mono px-2 py-0.5 bg-border text-text-primary rounded text-[10px] uppercase font-bold">
                  {pendingAction.actionType}
                </span>
              </div>

              {/* Form / Details */}
              <div className="space-y-3">
                {/* Email / Draft Preview */}
                {(pendingAction.actionType === 'SEND_EMAIL' || pendingAction.actionType === 'CREATE_DRAFT') && (
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="block text-text-secondary mb-1">Recipient (To):</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPreview.to || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, to: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-sans text-text-primary"
                        />
                      ) : (
                        <div className="p-2 bg-background border border-border/50 rounded font-medium text-text-primary font-mono">
                          {pendingAction.preview.to || 'No Recipient'}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-text-secondary mb-1">Subject:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPreview.subject || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, subject: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-sans text-text-primary"
                        />
                      ) : (
                        <div className="p-2 bg-background border border-border/50 rounded font-medium text-text-primary font-semibold">
                          {pendingAction.preview.subject || 'No Subject'}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-text-secondary mb-1">Email Body:</span>
                      {isEditing ? (
                        <textarea
                          rows={6}
                          value={editedPreview.body || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, body: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-sans resize-none text-text-primary"
                        />
                      ) : (
                        <div className="p-3 bg-background border border-border/50 rounded font-sans text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                          {pendingAction.preview.body}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Calendar Events Preview */}
                {pendingAction.actionType === 'CREATE_CALENDAR_EVENTS' && (
                  <div className="space-y-3">
                    <span className="block text-xs font-semibold text-text-secondary">Proposed Calendar Events:</span>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {(editedPreview.events || pendingAction.preview.events || []).map((ev: any, idx: number) => (
                        <div key={idx} className="p-3 bg-background border border-border/50 rounded-lg space-y-2">
                          {isEditing ? (
                            <div className="space-y-2 text-xs">
                              <div>
                                <span className="block text-[10px] text-text-secondary mb-0.5">Title:</span>
                                <input
                                  type="text"
                                  value={ev.title || ev.summary || ''}
                                  onChange={(e) => {
                                    const events = [...(editedPreview.events || [])];
                                    events[idx] = { ...events[idx], title: e.target.value };
                                    setEditedPreview({ ...editedPreview, events });
                                  }}
                                  className="w-full bg-surface border border-border focus:outline-none rounded px-2.5 py-1.5 text-xs text-text-primary"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="block text-[10px] text-text-secondary mb-0.5">Start:</span>
                                  <input
                                    type="text"
                                    value={ev.start || ev.start_time || ''}
                                    onChange={(e) => {
                                      const events = [...(editedPreview.events || [])];
                                      events[idx] = { ...events[idx], start: e.target.value };
                                      setEditedPreview({ ...editedPreview, events });
                                    }}
                                    className="w-full bg-surface border border-border focus:outline-none rounded px-2 py-1 text-[11px] font-mono text-text-primary"
                                  />
                                </div>
                                <div>
                                  <span className="block text-[10px] text-text-secondary mb-0.5">End:</span>
                                  <input
                                    type="text"
                                    value={ev.end || ev.end_time || ''}
                                    onChange={(e) => {
                                      const events = [...(editedPreview.events || [])];
                                      events[idx] = { ...events[idx], end: e.target.value };
                                      setEditedPreview({ ...editedPreview, events });
                                    }}
                                    className="w-full bg-surface border border-border focus:outline-none rounded px-2 py-1 text-[11px] font-mono text-text-primary"
                                  />
                                </div>
                              </div>
                              <div>
                                <span className="block text-[10px] text-text-secondary mb-0.5">Description:</span>
                                <textarea
                                  rows={2}
                                  value={ev.description || ''}
                                  onChange={(e) => {
                                    const events = [...(editedPreview.events || [])];
                                    events[idx] = { ...events[idx], description: e.target.value };
                                    setEditedPreview({ ...editedPreview, events });
                                  }}
                                  className="w-full bg-surface border border-border focus:outline-none rounded px-2.5 py-1.5 text-xs text-text-primary resize-none"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1 text-xs">
                              <div className="font-semibold text-text-primary">{ev.title || ev.summary}</div>
                              <div className="text-[10px] text-text-secondary font-mono">
                                {formatEventDateTime(ev.start || ev.start_time, ev.end || ev.end_time)}
                              </div>
                              {ev.description && (
                                <div className="text-[10px] text-text-disabled leading-normal mt-0.5 whitespace-pre-wrap">{ev.description}</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drive File Preview */}
                {pendingAction.actionType === 'SAVE_TO_DRIVE' && (
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="block text-text-secondary mb-1">Filename:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPreview.filename || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, filename: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-sans text-text-primary"
                        />
                      ) : (
                        <div className="p-2 bg-background border border-border/50 rounded font-medium text-text-primary font-mono">
                          {pendingAction.preview.filename}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-text-secondary mb-1">Mime Type:</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedPreview.mime_type || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, mime_type: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-mono text-text-primary"
                        />
                      ) : (
                        <div className="p-2 bg-background border border-border/50 rounded font-mono text-text-primary text-[10px]">
                          {pendingAction.preview.mime_type || 'text/plain'}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="block text-text-secondary mb-1">File Content:</span>
                      {isEditing ? (
                        <textarea
                          rows={6}
                          value={editedPreview.content || ''}
                          onChange={(e) => setEditedPreview({ ...editedPreview, content: e.target.value })}
                          className="w-full bg-background border border-border focus:border-primary/50 focus:outline-none rounded px-2.5 py-1.5 font-mono resize-none text-text-primary"
                        />
                      ) : (
                        <div className="p-3 bg-background border border-border/50 rounded font-mono text-text-secondary whitespace-pre-wrap max-h-40 overflow-y-auto text-[11px] leading-relaxed">
                          {pendingAction.preview.content}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-background border-t border-border p-3.5 flex justify-between select-none text-xs">
              <button
                disabled={confirming}
                onClick={() => handleConfirmAction('rejected')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-transparent hover:bg-danger/10 text-danger rounded transition-colors duration-150 disabled:opacity-50 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>

              <div className="flex gap-2.5">
                {!isEditing ? (
                  <>
                    <button
                      disabled={confirming}
                      onClick={() => {
                        setEditedPreview({ ...pendingAction.preview });
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-primary bg-background hover:bg-border/30 rounded transition-colors duration-150"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      disabled={confirming}
                      onClick={() => handleConfirmAction('approved')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded shadow transition-all duration-150 active:scale-95 disabled:opacity-50"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Approve
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled={confirming}
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-text-primary bg-background hover:bg-border/30 rounded transition-colors duration-150"
                    >
                      Cancel Edit
                    </button>
                    <button
                      disabled={confirming}
                      onClick={() => handleConfirmAction('approved')}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded shadow transition-all duration-150 active:scale-95 disabled:opacity-50"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Confirming...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" /> Confirm Edit
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
