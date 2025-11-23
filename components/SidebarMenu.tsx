import React from 'react';
import { SidebarMenuProps, Screen, TelegramUserWithProfile } from '../types';

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  onClose,
  user,
  currentScreen,
  navigateTo,
  onEditProfile,
  onInviteFriends,
  onWithdrawalSettings,
  onHelpCenter,
  onLogout,
}) => {
  const menuItems = [
    { id: 'home' as Screen, label: 'Home', icon: 'fa-solid fa-house' },
    { id: 'tasks' as Screen, label: 'Tasks', icon: 'fa-solid fa-list-check' },
    { id: 'wallet' as Screen, label: 'Wallet', icon: 'fa-solid fa-wallet' },
    { id: 'profile' as Screen, label: 'Profile', icon: 'fa-solid fa-user' },
  ];

  const secondaryMenuItems = [
    { label: 'Referrals', icon: 'fa-solid fa-user-plus', action: onInviteFriends },
    { label: 'Withdrawal Settings', icon: 'fa-solid fa-money-bill-transfer', action: onWithdrawalSettings },
    { label: 'Help Center', icon: 'fa-solid fa-circle-info', action: onHelpCenter },
    { label: 'Logout', icon: 'fa-solid fa-right-from-bracket', action: onLogout, isLogout: true },
  ];

  const userPhoto = (user as TelegramUserWithProfile)?.local_photo_url || user?.photo_url;

  return (
    <>
      {/* Overlay de fundo */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        ></div>
      )}

      {/* Menu Lateral */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-[95] transform transition-transform duration-300 ease-in-out dark:bg-dark dark:text-light
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
      >
        <div className="flex flex-col h-full">
          {/* Header do Menu */}
          <div className="bg-primary text-white p-6 pb-8 flex items-center gap-4 shadow-md flex-shrink-0">
            {userPhoto ? (
              <img src={userPhoto} alt="Profile" className="w-12 h-12 rounded-full object-cover border-2 border-white/50" />
            ) : user?.first_name ? (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-xl">
                {user.first_name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20"></div>
            )}
            <div className="flex flex-col">
                <span className="font-bold text-lg">{user?.first_name || 'Guest'}</span>
                {user?.username && <span className="text-sm text-white/80">@{user.username}</span>}
            </div>
          </div>

          {/* Itens de Navegação Principal */}
          <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center gap-4 w-full p-3 rounded-lg text-left transition-colors hover:bg-gray-light dark:hover:bg-gray/20
                  ${currentScreen === item.id ? 'bg-primary/10 text-primary font-bold dark:bg-primary/20 dark:text-primary-light' : 'text-dark dark:text-light'}`}
                aria-current={currentScreen === item.id ? 'page' : undefined}
              >
                <i className={`${item.icon} text-xl w-6 text-center`}></i>
                <span className="text-base">{item.label}</span>
              </button>
            ))}

            {/* Divisor */}
            <hr className="my-4 border-gray-medium dark:border-gray/50" />

            {/* Itens de Navegação Secundária/Ações */}
            {secondaryMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`flex items-center gap-4 w-full p-3 rounded-lg text-left transition-colors hover:bg-gray-light dark:hover:bg-gray/20
                  ${item.isLogout ? 'text-error dark:text-red-400 hover:bg-error/10 dark:hover:bg-error/20' : 'text-dark dark:text-light'}`}
              >
                <i className={`${item.icon} text-xl w-6 text-center`}></i>
                <span className="text-base">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer do Menu (opcional, pode ter versão do app, etc.) */}
          <div className="p-4 border-t border-gray-light text-center text-gray text-sm flex-shrink-0 dark:border-gray/50">
            Shemi-Kash v1.0
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;