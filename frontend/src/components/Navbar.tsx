import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, MessageSquare, ClipboardList, Settings, LogOut, Shield } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, mode } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Chat', path: '/chat', icon: MessageSquare },
    { name: 'Audit Log', path: '/audit', icon: ClipboardList },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full h-[56px] bg-background border-b border-border z-50 flex items-center justify-between px-6 select-none">
      {/* Left Section: Logo & Name */}
      <NavLink to="/dashboard" className="flex items-center gap-3 group">
        <div className="w-6 h-6 transition-transform duration-300 group-hover:scale-105">
          <svg viewBox="0 0 24 24" fill="none" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            <path d="M2 10L12 5L22 10L12 15L2 10Z" />
            <path d="M6 12.5V16C6 17.5 8.5 19 12 19C15.5 19 18 17.5 18 16V12.5" />
            <circle cx="12" cy="12" r="1.5" fill="#4F8EF7" />
            <circle cx="8" cy="10" r="1" fill="#4F8EF7" />
            <circle cx="16" cy="10" r="1" fill="#4F8EF7" />
            <circle cx="12" cy="16.5" r="1" fill="#4F8EF7" />
            <path d="M12 12L8 10" strokeWidth="0.8" opacity="0.8" />
            <path d="M12 12L16 10" strokeWidth="0.8" opacity="0.8" />
            <path d="M12 12L12 16.5" strokeWidth="0.8" opacity="0.8" />
            <path d="M22 10v6" />
            <circle cx="22" cy="16.5" r="0.8" fill="#4F8EF7" />
          </svg>
        </div>
        <span className="font-sans font-semibold text-[16px] text-text-primary tracking-wide">
          AcademeIQ
        </span>
        {mode === 'mock' && (
          <span className="text-[10px] font-mono bg-border text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
            <Shield className="w-2.5 h-2.5" /> DEV MODE
          </span>
        )}
      </NavLink>

      {/* Center Section: Navigation Links */}
      <div className="flex items-center h-full gap-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2 text-[13px] font-medium transition-all duration-150 relative h-[56px] px-1 ${
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Right Section: User Info and Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 focus:outline-none group py-1.5 px-2 rounded-md hover:bg-surface transition-colors duration-150"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=96&h=96'}
            alt="User Profile"
            className="w-8 h-8 rounded-full object-cover border border-border group-hover:border-primary transition-colors duration-150"
          />
          <span className="hidden sm:inline text-[13px] font-medium text-text-primary group-hover:text-primary transition-colors duration-150">
            {user?.name || 'Guest User'}
          </span>
        </button>

        {dropdownOpen && (
          <>
            {/* Click-away backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            ></div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-xs text-text-secondary font-mono truncate">Signed in as</p>
                <p className="text-sm text-text-primary font-medium truncate">{user?.email || 'guest@academeiq.dev'}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-border/30 flex items-center gap-2.5 transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
