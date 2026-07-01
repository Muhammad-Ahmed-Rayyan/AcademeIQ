import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Shield, User, Mail, Calendar, FolderOpen, LogOut, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, mode, logout } = useAuthStore();

  const scopes = [
    { name: 'Google Calendar API', desc: 'Used to fetch your classes, schedules, and auto-create study blocks.', icon: Calendar, active: true },
    { name: 'Gmail API', desc: 'Used to fetch announcements and professor updates, and draft academic emails.', icon: Mail, active: true },
    { name: 'Google Drive API', desc: 'Used to upload weekly briefings or academic outline summaries.', icon: FolderOpen, active: true },
  ];

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6 select-none">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary tracking-tight">System Settings</h1>
        <p className="text-sm text-text-secondary">Manage your integrations, security permissions, and session profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4 md:col-span-1 h-fit">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Profile Session</h2>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=96&h=96'}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
            <div>
              <p className="text-sm font-semibold text-text-primary">{user?.name || 'Guest User'}</p>
              <p className="text-xs text-text-secondary font-mono mt-0.5">{user?.email || 'guest@academeiq.dev'}</p>
            </div>
            <span className="text-[10px] font-mono uppercase bg-border px-2 py-0.5 rounded text-primary border border-primary/10">
              Auth Mode: {mode === 'mock' ? 'MOCK / DEV' : 'REAL GOOGLE'}
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-danger/10 hover:bg-danger/25 text-danger border border-danger/20 font-medium py-2 rounded-md transition-colors duration-150 text-xs active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session (Sign Out)</span>
          </button>
        </div>

        {/* Permissions & Scopes */}
        <div className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 border-b border-border pb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-text-primary">Connected Google Scopes</h2>
          </div>

          <p className="text-[13px] text-text-secondary leading-relaxed">
            AcademeIQ connects to your Google Account. For your privacy, the app operates **statelessly** (it stores zero student data on servers). All reads are processed in memory and write actions are explicitly blocked until you confirm them.
          </p>

          <div className="space-y-3 pt-2">
            {scopes.map((scope, i) => {
              const Icon = scope.icon;
              return (
                <div key={i} className="flex gap-4 p-3 bg-border/20 rounded border border-border/30">
                  <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-text-primary">{scope.name}</span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-success">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-normal">{scope.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
