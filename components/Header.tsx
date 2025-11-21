
import React from 'react';
import { Screen, UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile | null;
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  activeScreen: Screen;
  onBackClick: () => void;
  onThemeCycle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, onMenuClick, onNotificationsClick, onProfileClick, activeScreen, onBackClick, onThemeCycle }) => {
  const isSubScreen = ['Notifications', 'ReferBonus', 'Referrals', 'Profile', 'Withdraw', 'WithdrawalHistory', 'TaskHistory', 'SpecialOffers'].includes(activeScreen);
  const isDarkMode = userProfile?.theme === 'dark';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[var(--primary)] text-white flex items-center justify-between px-4 shadow-lg z-20 transition-colors duration-300">
      <div className="flex items-center space-x-4">
        {isSubScreen ? (
           <button onClick={onBackClick} className="text-white/90 hover:text-white transition-colors w-6 h-6 flex items-center justify-center text-xl">
              <i className="fa-solid fa-arrow-left"></i>
           </button>
        ) : (
          <button onClick={onMenuClick} className="text-white/90 hover:text-white transition-colors w-6 h-6 flex items-center justify-center text-xl">
              <i className="fa-solid fa-bars"></i>
          </button>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight">DYVERZE ADS</h1>
      </div>
      <div className="flex items-center space-x-3">
        {onThemeCycle && (
            <button 
                onClick={onThemeCycle} 
                className="text-white/90 hover:text-yellow-300 transition-colors w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Toggle Theme"
            >
                {/* If Dark, show Sun to switch to Light. If Light, show Moon to switch to Dark. */}
                {isDarkMode ? (
                    <i className="fa-solid fa-sun text-lg"></i>
                ) : (
                    <i className="fa-solid fa-moon text-lg"></i>
                )}
            </button>
        )}
        <button onClick={onNotificationsClick} className="text-white/90 hover:text-white transition-colors relative w-9 h-9 flex items-center justify-center text-xl hover:bg-white/10 rounded-full">
            <i className="fa-solid fa-bell"></i>
            <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-[var(--accent-secondary)] ring-2 ring-[var(--primary)]"></span>
        </button>
        <button onClick={onProfileClick} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--primary)] focus:ring-white rounded-full ml-1">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="User Avatar"
                className="w-9 h-9 rounded-full border-2 border-white/50 bg-gray-300 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center">
                  <i className="fa-solid fa-user text-lg text-white"></i>
              </div>
            )}
        </button>
      </div>
    </header>
  );
};

export default Header;
