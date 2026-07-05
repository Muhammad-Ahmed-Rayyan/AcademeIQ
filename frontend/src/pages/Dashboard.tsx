import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Mail, ClipboardList, BookOpen, Clock, ChevronRight, Target, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../store/authStore';
import { useAuditStore } from '../store/auditStore';
import { TodaySchedule, ScheduleItem } from '../components/TodaySchedule';
import { DeadlineCard, Deadline } from '../components/DeadlineCard';
import { EmailDigestCard, EmailDigestItem } from '../components/EmailDigestCard';
import { WeeklyBriefingCard } from '../components/WeeklyBriefingCard';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // State definitions
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [digest, setDigest] = useState<EmailDigestItem[]>([]);
  
  // Weekly briefing states
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [exportingBriefing, setExportingBriefing] = useState(false);
  
  const { logs: auditLogs, loading: loadingAudit, fetchLogs } = useAuditStore();

  const handleFetchBriefing = async () => {
    setLoadingBriefing(true);
    setShowBriefingModal(true);
    try {
      const resp = await api.get('/api/briefing');
      setBriefingData(resp.data.briefing);
    } catch (err) {
      console.error('Failed to load briefing:', err);
    } finally {
      setLoadingBriefing(false);
    }
  };

  const handleExportBriefing = async () => {
    if (!briefingData) return;
    setExportingBriefing(true);
    try {
      await api.post('/api/briefing/export', { briefing: briefingData });
      // Redirect to Chat to display confirmation modal immediately
      navigate('/chat');
    } catch (err) {
      console.error('Failed to export briefing:', err);
    } finally {
      setExportingBriefing(false);
      setShowBriefingModal(false);
    }
  };

  // Loading states
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [loadingDigest, setLoadingDigest] = useState(true);

  // Sync state
  const [lastSync, setLastSync] = useState<string>('Never');

  const fetchDashboardData = async (sync: boolean = false) => {
    // Fetch schedule
    setLoadingSchedule(true);
    try {
      const resp = await api.get('/api/schedule/today');
      setSchedule(resp.data.schedule || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
    } finally {
      setLoadingSchedule(false);
    }

    // Fetch deadlines
    setLoadingDeadlines(true);
    try {
      const resp = await api.get(`/api/deadlines?sync=${sync}`);
      setDeadlines(resp.data.deadlines || []);
    } catch (err) {
      console.error('Error fetching deadlines:', err);
    } finally {
      setLoadingDeadlines(false);
    }

    // Fetch email digest
    setLoadingDigest(true);
    try {
      const resp = await api.get(`/api/email-digest?sync=${sync}`);
      setDigest(resp.data.digest || []);
    } catch (err) {
      console.error('Error fetching email digest:', err);
    } finally {
      setLoadingDigest(false);
    }

    // Fetch audit logs
    try {
      await fetchLogs();
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }

    setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  const handleQuickAction = (message: string) => {
    // Navigate to chat and prefill/submit
    navigate('/chat', { state: { initialMessage: message } });
  };

  return (
    <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Academic Dashboard</h1>
          <p className="text-sm text-text-secondary">Overview of your courses, schedule, and pending action items.</p>
        </div>
        
        <button
          onClick={() => fetchDashboardData(true)}
          className="flex items-center gap-2 text-xs font-mono bg-surface hover:bg-border/30 border border-border px-3 py-1.5 rounded text-text-secondary select-none transition-colors duration-150 active:scale-95"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Last Sync: {lastSync}</span>
        </button>
      </div>

      {/* Monday Briefing Alert */}
      {new Date().getDay() === 1 && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex items-center justify-between gap-4 select-none animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Monday Academic Briefing Ready</h4>
              <p className="text-xs text-text-secondary leading-normal">AcademeIQ has compiled your weekly schedule, upcoming deadlines, and unread professor action items.</p>
            </div>
          </div>
          <button
            onClick={handleFetchBriefing}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white font-semibold text-xs rounded transition-colors duration-120 active:scale-95 flex-shrink-0"
          >
            View Briefing
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Schedule & Quick Actions) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Schedule Card */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-text-primary">Today's Schedule</h2>
              </div>
              <span className="text-xs text-text-secondary font-mono">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {loadingSchedule ? (
              // Skeleton loading for timeline
              <div className="space-y-4 pr-2">
                {[1, 2].map((n) => (
                  <div key={n} className="flex gap-4 items-start p-3 bg-border/10 rounded border border-border/20">
                    <div className="w-16 h-4 bg-border rounded animate-shimmer"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-border rounded animate-shimmer"></div>
                      <div className="h-3 w-60 bg-border rounded animate-shimmer"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <TodaySchedule schedule={schedule} />
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4 select-none">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Quick Actions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Get Weekly Briefing', action: () => handleFetchBriefing() },
                { label: 'Schedule Study Time', action: () => handleQuickAction('Help me find study time this week') },
                { label: 'Check Deadlines', action: () => handleQuickAction('List all my upcoming academic deadlines') },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.action}
                  className="p-3 text-left bg-border/10 hover:bg-border/35 border border-border rounded-md text-[13px] font-medium text-text-primary flex items-center justify-between group transition-all duration-150 active:scale-[0.98]"
                >
                  <span>{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors duration-150" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (Deadlines & Emails Sidebar) */}
        <div className="space-y-6">

          {/* Upcoming Deadlines Panel */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-warning" />
                <h2 className="text-base font-semibold text-text-primary">Upcoming Deadlines</h2>
              </div>
              {!loadingDeadlines && deadlines.length > 0 && (
                <span className="text-[10px] font-mono bg-danger/10 text-danger border border-danger/25 px-2 py-0.5 rounded">
                  {deadlines.filter(d => d.urgency === 'critical').length} Urgent
                </span>
              )}
            </div>

            {loadingDeadlines ? (
              // Skeleton loaders
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-3 bg-border/10 rounded border border-border/20 space-y-2">
                    <div className="h-4 w-32 bg-border rounded animate-shimmer"></div>
                    <div className="h-3 w-20 bg-border rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {deadlines.map((dl) => (
                  <DeadlineCard key={dl.id} deadline={dl} />
                ))}
                {deadlines.length === 0 && (
                  <div className="text-center py-6 text-xs text-text-secondary border border-dashed border-border rounded">
                    No upcoming deadlines found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Digest Panel */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-text-primary">Email Triage</h2>
              </div>
              {!loadingDigest && digest.length > 0 && (
                <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded">
                  {digest.length} New
                </span>
              )}
            </div>

            {loadingDigest ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="p-3 bg-border/10 rounded border border-border/20 space-y-2">
                    <div className="h-4 w-28 bg-border rounded animate-shimmer"></div>
                    <div className="h-3 w-40 bg-border rounded animate-shimmer"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {digest.map((item) => (
                  <EmailDigestCard key={item.id} item={item} />
                ))}
                {digest.length === 0 && (
                  <div className="text-center py-6 text-xs text-text-secondary border border-dashed border-border rounded">
                    No academic emails in unread logs.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Agent Activity */}
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4 select-none">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-text-primary">Audit Activity</h2>
            </div>
            
            <div className="space-y-2 font-mono text-[11px]">
              {loadingAudit ? (
                <div className="space-y-2">
                  <div className="h-6 bg-border/20 rounded animate-shimmer"></div>
                  <div className="h-6 bg-border/20 rounded animate-shimmer"></div>
                </div>
              ) : (
                auditLogs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2 bg-background border border-border rounded">
                    <span className="text-text-secondary">{log.timestamp.split(" ")[1] || log.timestamp}</span>
                    <span className={log.status === 'rejected' ? 'text-danger' : log.category === 'write' ? 'text-success' : 'text-primary'}>
                      {log.status === 'rejected' ? '✕' : '●'} {log.action_type}
                    </span>
                  </div>
                ))
              )}
              {!loadingAudit && auditLogs.length === 0 && (
                <div className="text-center py-4 text-xs text-text-secondary border border-dashed border-border rounded">
                  No activity logged in session.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Weekly Briefing Modal Overlay */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Close Button */}
            <button
              onClick={() => setShowBriefingModal(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-background/80 border border-border text-text-secondary hover:text-text-primary hover:bg-border/30 transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
            
            {loadingBriefing ? (
              <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-xs text-text-secondary font-mono animate-pulse">ACADEMEIQ GENERATING YOUR BRIEFING...</p>
              </div>
            ) : briefingData ? (
              <WeeklyBriefingCard
                briefing={briefingData}
                onExport={handleExportBriefing}
                exporting={exportingBriefing}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-20 space-y-4 text-center">
                <AlertCircle className="w-10 h-10 text-danger" />
                <p className="text-sm font-semibold text-text-primary">Failed to load weekly briefing</p>
                <button
                  onClick={handleFetchBriefing}
                  className="px-4 py-2 bg-primary text-white font-semibold text-xs rounded hover:bg-primary-hover transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
