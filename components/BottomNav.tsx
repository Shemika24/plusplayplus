import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  activeTab: Screen;
  setActiveTab: (tab: Screen) => void;
}

const navItems = [
  { id: 'home' as Screen, label: 'Home', icon: <i className="fa-solid fa-house"></i> },
  { id: 'tasks' as Screen, label: 'Tasks', icon: <i className="fa-solid fa-list-check"></i> },
  { id: 'wallet' as Screen, label: 'Wallet', icon: <i className="fa-solid fa-wallet"></i> },
  { id: 'profile' as Screen, label: 'Profile', icon: <i className="fa-solid fa-user"></i> },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-primary shadow-[0_-2px_10px_rgba(0,0,0,0.15)] flex justify-around items-center z-50 pb-safe" aria-label="Main Navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`flex flex-col items-center justify-center h-full flex-grow transition-colors duration-200 ease-in-out ${activeTab === item.id ? 'text-white' : 'text-white/60 hover:text-white'}`}
          onClick={() => setActiveTab(item.id)}
          aria-current={activeTab === item.id ? 'page' : undefined}
        >
          {React.cloneElement(item.icon, { className: `${item.icon.props.className} text-2xl mb-1` })}
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default React.memo(BottomNav);
