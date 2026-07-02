import React, { useState } from 'react';
import { Mail, ChevronDown, ChevronUp, AlertCircle, Volume2, Info, Calendar } from 'lucide-react';

export interface EmailDigestItem {
  id: string;
  category: 'action_required' | 'announcement' | 'fyi';
  sender: string;
  subject: string;
  summary: string;
  dates_mentioned: string[];
  email_id: string;
}

interface EmailDigestCardProps {
  item: EmailDigestItem;
}

export const EmailDigestCard: React.FC<EmailDigestCardProps> = ({ item }) => {
  const { sender, subject, summary, dates_mentioned, category } = item;
  const [expanded, setExpanded] = useState(false);

  // Set category badges & indicators
  let indicatorColor = 'bg-text-disabled';
  let badgeText = 'FYI';
  let Icon = Info;
  let textTheme = 'text-text-secondary';

  if (category === 'action_required') {
    indicatorColor = 'bg-warning';
    badgeText = 'Action Required';
    Icon = AlertCircle;
    textTheme = 'text-warning';
  } else if (category === 'announcement') {
    indicatorColor = 'bg-primary';
    badgeText = 'Announcement';
    Icon = Volume2;
    textTheme = 'text-primary';
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden select-none hover:border-border/80 transition-colors duration-150">
      {/* Header bar (always visible) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center justify-between gap-4 focus:outline-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Status Dot */}
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${indicatorColor}`} />
          
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-text-secondary font-medium truncate max-w-[150px]">
                {sender.split('<')[0].trim()}
              </span>
              <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border border-current flex items-center gap-1 ${textTheme}`}>
                <Icon className="w-2.5 h-2.5" />
                {badgeText}
              </span>
            </div>
            <h4 className="text-[13px] font-semibold text-text-primary leading-tight truncate">
              {subject}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Mail className="w-4 h-4 text-text-disabled" />
          {expanded ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
        </div>
      </button>

      {/* Expandable summary pane */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-background/25 space-y-3 animate-in fade-in duration-200">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-text-disabled uppercase">Gemini Digest Summary</span>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              {summary}
            </p>
          </div>

          {dates_mentioned.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono text-text-disabled uppercase">Dates Mentioned:</span>
              {dates_mentioned.map((date, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 text-[10px] font-mono bg-border/40 text-text-primary px-2 py-0.5 rounded"
                >
                  <Calendar className="w-3 h-3 text-primary" />
                  {date}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
