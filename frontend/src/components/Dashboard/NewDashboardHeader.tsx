import React from 'react';
import { Moon, Bell, User } from 'lucide-react';

interface NewDashboardHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NewDashboardHeader: React.FC<NewDashboardHeaderProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navigationItems = [
    { label: 'Dashboard', active: true },
    { label: 'Devices', active: false },
    { label: 'Alarms', active: false },
  ];

  // Current time display
  const currentTime = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/[/]/g, '.').replace(',', ':');

  return (
    <header className="w-full h-16 bg-[#2B2D42] px-6 flex items-center justify-between border-b border-gray-700">
      {/* Left side: Logo + Navigation */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-[#2B2D42] font-bold text-sm">S</span>
          </div>
          <span className="text-white font-semibold text-lg">SAHER</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === item.label
                  ? 'bg-[#6366F1] text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right side: Time + Controls */}
      <div className="flex items-center gap-6">
        {/* Time Display */}
        <div className="text-white text-lg font-mono font-bold">
          {currentTime}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <Moon className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <button className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-[#6366F1] rounded-full"></div>
          </button>

          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <User className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default NewDashboardHeader;