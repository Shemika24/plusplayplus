
import React, { useState, useEffect } from 'react';
import { SidebarProps, Screen } from '../types';

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentScreen,
  navigateTo,
  onInviteFriends,
  onHelpCenter,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Set to false to use 24-hour format (0-23)
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const menuItems: { id: Screen; label: string; icon: string }[] = [
    { id: 'Home', label: 'Home', icon: 'fa-solid fa-house' },
    { id: 'Tasks', label: 'Tasks', icon: 'fa-solid fa-list-check' },
    { id: 'Wallet', label: 'Wallet', icon: 'fa-solid fa-wallet' },
    { id: 'Rank', label: 'Rank', icon: 'fa-solid fa-ranking-star' },
    { id: 'Profile', label: 'Profile', icon: 'fa-solid fa-user' },
  ];

  const secondaryMenuItems = [
    { label: 'Referrals', icon: 'fa-solid fa-user-plus', action: onInviteFriends },
    { label: 'Help Center', icon: 'fa-solid fa-circle-info', action: onHelpCenter },
    { label: 'Logout', icon: 'fa-solid fa-right-from-bracket', action: onLogout, isLogout: true },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--bg-card)] shadow-xl z-[95] transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-[var(--primary)] text-white p-6 pb-8 flex items-center gap-4 shadow-md flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-gem text-2xl"></i>
              </div>
              <div className="flex flex-col items-start">
                  <div className="font-bold text-xl leading-tight">DYVERZE ADS</div>
                  <div className="font-mono mt-1 flex items-center text-blue-100 font-medium text-sm">
                      <i className="fa-regular fa-clock mr-2"></i>
                      <span>{currentTime || "--:--:--"}</span>
                  </div>
              </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto bg-[var(--bg-card)]">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center gap-4 w-full p-3 rounded-lg text-left transition-colors hover:bg-[var(--bg-card-hover)]
                  ${currentScreen === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-[var(--primary)] font-bold' : 'text-[var(--dark)]'}`}
                aria-current={currentScreen === item.id ? 'page' : undefined}
              >
                <i className={`${item.icon} text-xl w-6 text-center`}></i>
                <span className="text-base">{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <hr className="my-4 border-[var(--border-color)]" />

            {/* Secondary Actions */}
            {secondaryMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`flex items-center gap-4 w-full p-3 rounded-lg text-left transition-colors hover:bg-[var(--bg-card-hover)]
                  ${item.isLogout ? 'text-[var(--error)] hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-[var(--dark)]'}`}
              >
                <i className={`${item.icon} text-xl w-6 text-center`}></i>
                <span className="text-base">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border-color)] text-center text-[var(--gray)] text-sm flex-shrink-0 bg-[var(--bg-card)]">
            DYVERZE ADS v2.1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;