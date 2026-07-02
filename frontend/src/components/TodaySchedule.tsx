import React from 'react';
import { CalendarClock } from 'lucide-react';

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  category: 'Class' | 'Lab' | 'Study Block' | string;
}

interface TodayScheduleProps {
  schedule: ScheduleItem[];
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({ schedule }) => {
  
  // Format ISO time to readable HH:MM AM/PM
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Get duration string in hours
  const getDuration = (start: string, end: string) => {
    try {
      const durationMs = new Date(end).getTime() - new Date(start).getTime();
      const hours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    } catch {
      return '';
    }
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Class':
        return {
          bg: 'bg-primary/10 text-primary border-primary/20',
          dot: 'bg-primary',
          border: 'border-l-primary'
        };
      case 'Lab':
        return {
          bg: 'bg-warning/10 text-warning border-warning/20',
          dot: 'bg-warning',
          border: 'border-l-warning'
        };
      case 'Study Block':
        return {
          bg: 'bg-success/10 text-success border-success/20',
          dot: 'bg-success',
          border: 'border-l-success'
        };
      default:
        return {
          bg: 'bg-text-disabled/10 text-text-secondary border-border',
          dot: 'bg-text-secondary',
          border: 'border-l-border'
        };
    }
  };

  return (
    <div className="space-y-4 select-none">
      {schedule.length === 0 ? (
        <div className="text-center py-8 bg-surface/30 border border-dashed border-border rounded-lg space-y-2 text-text-secondary">
          <CalendarClock className="w-8 h-8 mx-auto text-text-disabled" />
          <p className="text-xs">No classes or study blocks scheduled for today.</p>
        </div>
      ) : (
        <div className="relative border-l border-border pl-4 ml-2 space-y-5">
          {schedule.map((item) => {
            const styles = getCategoryStyles(item.category);
            return (
              <div key={item.id} className="relative">
                {/* Timeline node dot */}
                <span className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${styles.dot}`} />
                
                <div className={`p-4 bg-surface border border-border border-l-4 ${styles.border} rounded-r-lg shadow-sm space-y-2 hover:bg-surface/90 transition-colors duration-150`}>
                  {/* Title & Badge */}
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-[13px] font-semibold text-text-primary leading-tight">
                      {item.title}
                    </h3>
                    <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${styles.bg}`}>
                      {item.category}
                    </span>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Time info */}
                  <div className="flex justify-between items-center text-[10px] font-mono text-text-secondary border-t border-border/50 pt-1.5">
                    <span>
                      {formatTime(item.start_time)} – {formatTime(item.end_time)}
                    </span>
                    <span>
                      ({getDuration(item.start_time, item.end_time)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
