

import React from 'react';
import { TelegramUser } from '../types';

interface HeaderProps {
  user: TelegramUser | null;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuClick }) => (
  <header className="relative flex justify-center items-center px-6 h-16 bg-primary text-white shadow-md flex-shrink-0 sticky top-0 z-50">
    <button
      onClick={onMenuClick}
      className="absolute left-4 top-1/2 -translate-y-1/2 p-2"
      aria-label="Open menu"
    >
      <i className="fa-solid fa-bars text-2xl"></i>
    </button>
    <h1 className="text-xl font-bold tracking-wide">Shemi-Kash</h1>
  </header>
);

export default React.memo(Header);
