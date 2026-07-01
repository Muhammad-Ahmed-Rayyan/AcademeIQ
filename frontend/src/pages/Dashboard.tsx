import React from 'react';
import { Calendar, AlertCircle, Mail, ClipboardList, BookOpen, Clock, ChevronRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Academic Dashboard</h1>
          <p className="text-sm text-text-secondary">Overview of your courses, schedule, and pending action items.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-surface border border-border px-3 py-1.5 rounded text-text-secondary select-none">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Sync: Just now</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Schedule & Actions) - Occupies 2 cols on lg */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Schedule Card */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-text-primary">Today's Schedule</h2>
              </div>
              <span className="text-xs text-text-secondary">Wednesday, July 1</span>
            </div>

            {/* Skeleton Loading Blocks */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-border/20 rounded border border-border/30">
                <div className="w-16 text-xs font-mono text-text-secondary">09:00 AM</div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded animate-shimmer"></div>
                  <div className="h-3 w-24 rounded animate-shimmer"></div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Class</span>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-border/20 rounded border border-border/30">
                <div className="w-16 text-xs font-mono text-text-secondary">02:00 PM</div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded animate-shimmer"></div>
                  <div className="h-3 w-32 rounded animate-shimmer"></div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">Lab</span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-border/20 rounded border border-border/30">
                <div className="w-16 text-xs font-mono text-text-secondary">06:00 PM</div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded animate-shimmer"></div>
                  <div className="h-3 w-20 rounded animate-shimmer"></div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">Study Block</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                'Get Weekly Briefing',
                'Schedule Study Time',
                'Check Deadlines',
              ].map((action, i) => (
                <button
                  key={i}
                  className="p-3 text-left bg-border/10 hover:bg-border/35 border border-border rounded-md text-[13px] font-medium text-text-primary flex items-center justify-between group transition-all duration-150 active:scale-[0.98]"
                >
                  <span>{action}</span>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors duration-150" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Sidebars for Deadlines & Emails) */}
        <div className="space-y-6">

          {/* Upcoming Deadlines Panel */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-warning" />
                <h2 className="text-base font-semibold text-text-primary">Upcoming Deadlines</h2>
              </div>
              <span className="text-xs text-warning font-semibold">Critical (3)</span>
            </div>

            {/* Skeleton Skeletons */}
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-3 bg-border/20 rounded border border-border/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-32 rounded animate-shimmer"></div>
                    <div className="h-4.5 w-14 rounded animate-shimmer"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 rounded animate-shimmer"></div>
                    <div className="h-3 w-16 rounded animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Actions Panel */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-text-primary">Email Digest</h2>
              </div>
              <span className="text-xs text-text-secondary">Unread Prof Emails</span>
            </div>

            {/* Skeleton Skeletons */}
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="p-3 bg-border/20 rounded border border-border/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="h-4 w-28 rounded animate-shimmer"></div>
                    <div className="h-3.5 w-12 rounded animate-shimmer"></div>
                  </div>
                  <div className="h-3.5 w-48 rounded animate-shimmer"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Agent Activity */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono p-2 bg-border/10 rounded">
                <span className="text-text-secondary">14:32:11</span>
                <span className="text-success">✓ CALENDAR_EVENT</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono p-2 bg-border/10 rounded">
                <span className="text-text-secondary">14:28:05</span>
                <span className="text-text-secondary">● READ_GMAIL</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
