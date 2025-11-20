
import React from 'react';
import { Screen } from '../types';

interface NavItemProps {
  label: Screen;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

interface BottomNavBarProps {
  activeTab: Screen;
  setActiveTab: (tab: Screen) => void;
}

// Reusable Nav Item Component
const NavItem: React.FC<NavItemProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm transition-colors duration-300 active:scale-95 ${isActive ? 'text-[#00d2d3]' : 'text-[#a8b8ff] hover:text-[#f5f6fa]'}`}
  >
    {icon}
    <span className="text-[10px] md:text-xs mt-0.5 scale-90 md:scale-100 origin-top">{label}</span>
  </button>
);

// Main Component
const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { label: Screen, icon: React.ReactNode }[] = [
    { label: 'Home', icon: <i className="fa-solid fa-house text-xl mb-1"></i> },
    { label: 'Tasks', icon: <i className="fa-solid fa-list-check text-xl mb-1"></i> },
    { label: 'Wallet', icon: <i className="fa-solid fa-wallet text-xl mb-1"></i> },
    { label: 'Rank', icon: <i className="fa-solid fa-ranking-star text-xl mb-1"></i> },
  ];

  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#4a6bff] bg-opacity-95 backdrop-blur-md border-t border-[#5a7bff] border-opacity-30 shadow-2xl z-20 pb-safe" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      <div className="flex h-16 items-center">
        <div className="w-2/5 flex justify-around items-center h-full">
          {leftItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.label}
              onClick={() => setActiveTab(item.label)}
            />
          ))}
        </div>
        <div className="w-1/5 relative h-full" /> {/* Spacer for the central button */}
        <div className="w-2/5 flex justify-around items-center h-full">
          {rightItems.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              isActive={activeTab === item.label}
              onClick={() => setActiveTab(item.label)}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Button - Positioned relative to nav container to handle safe area */}
      <div className="absolute left-1/2 -top-6 transform -translate-x-1/2">
        <button
          onClick={() => setActiveTab('Earn')}
          aria-label="Earn"
          className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-lg border-4 border-[#4a6bff]
            ${activeTab === 'Earn' ? 'bg-[#ff9f43] text-white scale-110' : 'bg-white text-[var(--primary)]'}
            hover:bg-[#ff9f43] hover:text-white transform active:scale-95`}
        >
          <i className="fa-solid fa-bolt text-xl md:text-2xl"></i>
          <span className="text-[10px] font-bold mt-0.5 md:mt-1">Earn</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavBar;