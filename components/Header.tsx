

import React from 'react';
import { Screen, UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile | null;
  onMenuClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  activeScreen: Screen;
  onBackClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userProfile, onMenuClick, onNotificationsClick, onProfileClick, activeScreen, onBackClick }) => {
  const isSubScreen = ['Notifications', 'ReferBonus', 'Referrals', 'Profile', 'Withdraw', 'WithdrawalHistory', 'TaskHistory'].includes(activeScreen);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#4a6bff] text-white flex items-center justify-between px-4 shadow-lg z-20">
      <div className="flex items-center space-x-4">
        {isSubScreen ? (
           <button onClick={onBackClick} className="text-[#f5f6fa] hover:text-[#00d2d3] transition-colors w-6 h-6 flex items-center justify-center text-xl">
              <i className="fa-solid fa-arrow-left"></i>
           </button>
        ) : (
          <button onClick={onMenuClick} className="text-[#f5f6fa] hover:text-[#00d2d3] transition-colors w-6 h-6 flex items-center justify-center text-xl">
              <i className="fa-solid fa-bars"></i>
          </button>
        )}
        <h1 className="text-xl font-bold text-white">DYVERZE ADS</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button onClick={onNotificationsClick} className="text-[#f5f6fa] hover:text-[#00d2d3] transition-colors relative w-6 h-6 flex items-center justify-center text-xl">
            <i className="fa-solid fa-bell"></i>
            {/* This can be made dynamic later */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#ff6b9d] ring-2 ring-[#4a6bff]"></span>
        </button>
        <button onClick={onProfileClick} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#4a6bff] focus:ring-white rounded-full">
            {userProfile?.avatarUrl ? (
              <img
                src={userProfile.avatarUrl}
                alt="User Avatar"
                className="w-9 h-9 rounded-full border-2 border-[#00d2d3] bg-gray-300 object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-[#00d2d3] bg-gray-500 flex items-center justify-center">
                  <i className="fa-solid fa-user text-lg text-white"></i>
              </div>
            )}
        </button>
      </div>
    </header>
  );
};

export default Header;
