import React from 'react';
import { Calendar, Mail, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

export interface Deadline {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  urgency: 'critical' | 'upcoming' | 'later';
  source: 'calendar' | 'gmail';
  source_id: string;
}

interface DeadlineCardProps {
  deadline: Deadline;
}

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ deadline }) => {
  const { title, subject, due_date, urgency, source } = deadline;

  // Format date and compute remaining time
  const dueDateObj = new Date(due_date);
  const now = new Date();
  const diffTime = dueDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine relative day label
  let relativeLabel = '';
  if (diffDays < 0) {
    relativeLabel = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    relativeLabel = 'Due Today';
  } else if (diffDays === 1) {
    relativeLabel = 'Due Tomorrow';
  } else {
    relativeLabel = `Due in ${diffDays} days`;
  }

  // Set colors based on urgency
  let borderStyle = 'border-border';
  let badgeStyle = 'bg-text-disabled text-text-secondary';
  let textStyle = 'text-text-primary';
  let Icon = Clock;

  if (diffDays < 0 || urgency === 'critical') {
    borderStyle = 'border-danger/30 hover:border-danger/60';
    badgeStyle = 'bg-danger/10 text-danger border border-danger/20';
    textStyle = 'text-danger';
    Icon = AlertTriangle;
  } else if (urgency === 'upcoming') {
    borderStyle = 'border-warning/30 hover:border-warning/60';
    badgeStyle = 'bg-warning/10 text-warning border border-warning/20';
    textStyle = 'text-warning';
    Icon = AlertCircle;
  } else {
    borderStyle = 'border-primary/20 hover:border-primary/50';
    badgeStyle = 'bg-primary/10 text-primary border border-primary/20';
  }

  return (
    <div className={`bg-surface border ${borderStyle} rounded-lg p-4 transition-all duration-150 flex flex-col justify-between gap-3 shadow-sm select-none`}>
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-secondary">
            {subject}
          </span>
          <h3 className="text-[13px] font-semibold text-text-primary leading-snug">
            {title}
          </h3>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium shrink-0 capitalize ${badgeStyle}`}>
          {urgency}
        </span>
      </div>

      <div className="flex justify-between items-center text-xs text-text-secondary">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Icon className={`w-3.5 h-3.5 ${textStyle}`} />
          <span className={diffDays < 0 ? 'text-danger font-semibold' : 'text-text-primary'}>
            {relativeLabel}
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] bg-background/50 px-2 py-0.5 rounded border border-border">
          {source === 'gmail' ? (
            <>
              <Mail className="w-3 h-3 text-primary" />
              <span>Gmail Announcement</span>
            </>
          ) : (
            <>
              <Calendar className="w-3 h-3 text-primary" />
              <span>Calendar Event</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
