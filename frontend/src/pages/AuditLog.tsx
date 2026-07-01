import React, { useState } from 'react';
import { Shield, ClipboardList, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action_type: string;
  description: string;
  status: 'approved' | 'rejected' | 'auto';
  category: 'read' | 'write';
  details: string;
}

export const AuditLog: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'read' | 'write' | 'rejected'>('all');

  const logs: AuditLogEntry[] = [
    {
      id: 'aud_1',
      timestamp: '2026-07-01 22:30:15',
      action_type: 'READ_GMAIL_INBOX',
      description: 'Scanned inbox for university domain announcements',
      status: 'auto',
      category: 'read',
      details: 'Query: from:(*.edu OR *university*) — Found 4 matching messages.'
    },
    {
      id: 'aud_2',
      timestamp: '2026-07-01 22:32:01',
      action_type: 'CREATE_CALENDAR_EVENTS',
      description: 'Created study blocks for Networks Exam',
      status: 'approved',
      category: 'write',
      details: 'Created 3 events: [AcademeIQ] Study Block — Networks (July 2-4)'
    },
    {
      id: 'aud_3',
      timestamp: '2026-07-01 22:35:10',
      action_type: 'SEND_GMAIL_MESSAGE',
      description: 'Drafted extension request to Dr. Ahmed',
      status: 'rejected',
      category: 'write',
      details: 'User rejected draft. Reason: Decided to submit assignment on time.'
    }
  ];

  const filteredLogs = logs.filter(log => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'read') return log.category === 'read';
    if (activeFilter === 'write') return log.category === 'write';
    if (activeFilter === 'rejected') return log.status === 'rejected';
    return true;
  });

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Security Audit Log</h1>
            <p className="text-sm text-text-secondary">Audit history of all read/write activities performed by AcademeIQ.</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-surface/50 border border-border p-1 rounded-md w-fit">
        {(['all', 'read', 'write', 'rejected'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-sm text-[12px] font-medium transition-all duration-150 capitalize ${
              activeFilter === filter
                ? 'bg-border text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {filter} Actions
          </button>
        ))}
      </div>

      {/* Log Entries */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-surface border border-border rounded-lg p-4 space-y-3 hover:border-primary/20 transition-all duration-150">
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-text-secondary">{log.timestamp}</span>
                <span className="font-mono px-2 py-0.5 bg-border text-text-primary rounded text-[10px]">
                  {log.action_type}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {log.status === 'approved' && (
                  <span className="flex items-center gap-1 text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded text-[10px] font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                )}
                {log.status === 'auto' && (
                  <span className="flex items-center gap-1 text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-[10px] font-mono">
                    <ClipboardList className="w-3 h-3" /> Auto (Read)
                  </span>
                )}
                {log.status === 'rejected' && (
                  <span className="flex items-center gap-1 text-danger bg-danger/10 border border-danger/20 px-2 py-0.5 rounded text-[10px] font-mono">
                    <AlertTriangle className="w-3 h-3" /> Rejected
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-[13px] font-medium text-text-primary">{log.description}</p>

            {/* Details Box (Monospace) */}
            <div className="p-3 bg-background border border-border/50 rounded font-mono text-[11px] text-text-secondary flex items-start gap-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-text-disabled flex-shrink-0 mt-0.5" />
              <span className="break-all">{log.details}</span>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-surface/50 border border-border rounded-lg space-y-2 text-text-secondary">
            <ClipboardList className="w-8 h-8 mx-auto text-text-disabled" />
            <p className="text-[13px]">No audit entries match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
