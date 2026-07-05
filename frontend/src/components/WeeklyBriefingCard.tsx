import React, { useState } from 'react';
import { Calendar, AlertCircle, Mail, Target, FileText, Download, Loader2, Check } from 'lucide-react';

interface WeeklyBriefing {
  deadlines: { title: string; due_date: string; subject: string }[];
  email_actions: { sender: string; subject: string; summary: string }[];
  study_sessions: { title: string; start: string; end: string }[];
  weekly_goals: string[];
  notes: string;
}

interface WeeklyBriefingCardProps {
  briefing: WeeklyBriefing;
  onExport: () => Promise<void>;
  exporting: boolean;
}

export const WeeklyBriefingCard: React.FC<WeeklyBriefingCardProps> = ({ briefing, onExport, exporting }) => {
  const [activeTab, setActiveTab] = useState<'deadlines' | 'emails' | 'study' | 'goals' | 'notes'>('deadlines');
  const [exported, setExported] = useState(false);

  const handleExport = async () => {
    await onExport();
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const tabs = [
    { id: 'deadlines', label: 'Deadlines', icon: AlertCircle, count: briefing.deadlines?.length || 0 },
    { id: 'emails', label: 'Emails', icon: Mail, count: briefing.email_actions?.length || 0 },
    { id: 'study', label: 'Study Sessions', icon: Calendar, count: briefing.study_sessions?.length || 0 },
    { id: 'goals', label: 'Weekly Goals', icon: Target, count: briefing.weekly_goals?.length || 0 },
    { id: 'notes', label: 'Advisor Notes', icon: FileText, count: null },
  ] as const;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden flex flex-col w-full max-w-4xl mx-auto select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-5 border-b border-border bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary tracking-tight">Weekly Academic Briefing</h3>
            <p className="text-xs text-text-secondary">Synthesized on-demand briefing for the upcoming 7 days.</p>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || exported}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-primary/45 disabled:text-text-disabled text-white font-semibold px-4 py-2 rounded-md shadow transition-all duration-120 text-xs active:scale-95 flex-shrink-0"
        >
          {exporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : exported ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{exporting ? 'Queueing Export...' : exported ? 'Export Queued' : 'Export to Drive (.md)'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border bg-surface/50 p-2 scrollbar-none gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-border text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-border/10'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-background text-text-secondary border border-border'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Pane */}
      <div className="p-6 min-h-[300px] max-h-[450px] overflow-y-auto bg-surface/20">
        
        {/* Deadlines Pane */}
        {activeTab === 'deadlines' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Upcoming Deadlines</h4>
            <div className="space-y-3">
              {briefing.deadlines && briefing.deadlines.length > 0 ? (
                briefing.deadlines.map((dl, idx) => (
                  <div key={idx} className="p-3.5 bg-background border border-border/60 rounded-lg flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 bg-danger/10 text-danger border border-danger/20 rounded">
                        {dl.subject || 'Academic'}
                      </span>
                      <p className="text-sm font-semibold text-text-primary">{dl.title}</p>
                    </div>
                    <span className="text-xs font-mono text-text-secondary flex-shrink-0 mt-1">
                      {new Date(dl.due_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-text-secondary">No upcoming deadlines found for the next 7 days.</div>
              )}
            </div>
          </div>
        )}

        {/* Emails Pane */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Professor Triage Summary</h4>
            <div className="space-y-3">
              {briefing.email_actions && briefing.email_actions.length > 0 ? (
                briefing.email_actions.map((em, idx) => (
                  <div key={idx} className="p-4 bg-background border border-border/60 rounded-lg space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-primary">{em.sender}</span>
                      <span className="text-[11px] text-text-secondary font-medium italic select-all truncate max-w-xs">{em.subject}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface/40 p-2.5 rounded border border-border/30">{em.summary}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-text-secondary">No professor emails requiring action in unread logs.</div>
              )}
            </div>
          </div>
        )}

        {/* Study Sessions Pane */}
        {activeTab === 'study' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Scheduled Study Blocks</h4>
            <div className="space-y-3">
              {briefing.study_sessions && briefing.study_sessions.length > 0 ? (
                briefing.study_sessions.map((session, idx) => (
                  <div key={idx} className="p-3.5 bg-background border border-border/60 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-7 rounded bg-success/80 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{session.title}</p>
                        <p className="text-[11px] text-text-secondary font-mono">
                          {new Date(session.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(session.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text-secondary">
                      {new Date(session.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-text-secondary">No study blocks scheduled in your calendar. Use the Chat assistant to build a plan.</div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Goals Pane */}
        {activeTab === 'goals' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Recommended Weekly Goals</h4>
            <div className="space-y-3">
              {briefing.weekly_goals && briefing.weekly_goals.length > 0 ? (
                briefing.weekly_goals.map((goal, idx) => (
                  <div key={idx} className="p-3.5 bg-background border border-border/60 rounded-lg flex items-center gap-3">
                    <input
                      type="checkbox"
                      readOnly
                      checked={false}
                      className="w-4 h-4 border-border rounded bg-surface text-primary focus:ring-0 focus:ring-offset-0 pointer-events-none"
                    />
                    <span className="text-xs text-text-primary font-medium">{goal}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-xs text-text-secondary">No targets recommended.</div>
              )}
            </div>
          </div>
        )}

        {/* Notes Pane */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Advisor Reflection & Notes</h4>
            <div className="p-4 bg-background border border-border/60 rounded-lg text-xs text-text-primary leading-relaxed whitespace-pre-wrap font-sans">
              {briefing.notes || "No reflection logged."}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
