

import React, { useState, useEffect, useCallback } from 'react';
import BottomNavBar from './BottomNavBar';
import Header from './Header';
import Sidebar from './Sidebar';
import TasksScreen from '../screens/TasksScreen';
import WalletScreen from '../screens/WalletScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EarnScreen from '../screens/EarnScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReferFriendBonusScreen from '../screens/ReferFriendBonusScreen';
import ReferralsScreen from '../screens/ReferralsScreen';
import RankScreen from '../screens/RankScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import WithdrawalHistoryScreen from '../screens/WithdrawalHistoryScreen';
import TaskHistoryScreen from '../screens/TaskHistoryScreen';
import { Screen, TaskHistory, Withdrawal, UserProfile } from '../types';
import { addTaskHistoryItem, addWithdrawalRequest } from '../services/firestoreService';


interface HomeScreenProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onProfileUpdate: (data: Partial<UserProfile>) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ userProfile: initialProfile, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState<Screen>('Home');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [referralsSource, setReferralsSource] = useState<Screen>('ReferBonus');

  useEffect(() => {
    setUserProfile(initialProfile);
  }, [initialProfile]);
  
  const handleNavigation = (screen: Screen) => {
    if (screen === 'Referrals') {
        setReferralsSource(activeTab);
    }
    setActiveTab(screen);
    setSidebarOpen(false);
  };
  
  const handleBackNavigation = () => {
    if (['Withdraw', 'WithdrawalHistory'].includes(activeTab)) {
        setActiveTab('Wallet');
    } else if (['TaskHistory'].includes(activeTab)) {
        setActiveTab('Tasks');
    } else if (activeTab === 'Referrals') {
        setActiveTab(referralsSource);
    } else if (['Notifications', 'Profile', 'ReferBonus'].includes(activeTab)) {
        setActiveTab('Home');
    } else {
        setActiveTab('Home');
    }
  };
  
  const handleEarnPoints = async (points: number, title: string, icon: string, iconColor: string) => {
      const newHistoryItem: Omit<TaskHistory, 'id' | 'timestamp'> = {
          reward: points,
          title: title,
          icon,
          iconColor,
          date: new Date().toLocaleDateString(),
      };
      
      // Optimistic UI update for points and task stats
      setUserProfile(prev => ({
        ...prev,
        points: prev.points + points,
        taskStats: {
          ...prev.taskStats,
          completed: (prev.taskStats?.completed || 0) + 1,
        },
      }));
      
      try {
        await addTaskHistoryItem(userProfile.uid, newHistoryItem);
      } catch (e) {
          console.error("Failed to update points:", e);
          // Revert on failure
           setUserProfile(prev => ({
            ...prev,
            points: prev.points - points,
            taskStats: {
              ...prev.taskStats,
              completed: (prev.taskStats?.completed || 0) - 1,
            },
          }));
          alert("There was an error saving your points. Please try again.");
      }
  };

  const handleNewWithdrawal = async (amount: number, method: string) => {
    const pointsToDeduct = amount * 83500;
    if (userProfile.points < pointsToDeduct) {
        alert("Error: Not enough points.");
        return;
    }

    const newWithdrawalItem: Omit<Withdrawal, 'id' | 'timestamp'> = {
        amount: amount,
        method: method,
        status: 'Pending',
        date: new Date().toLocaleString(),
    };

    // Optimistic UI update for points and withdrawal stats
    setUserProfile(prev => ({
        ...prev,
        points: prev.points - pointsToDeduct,
        withdrawalStats: {
            ...prev.withdrawalStats,
            pending: (prev.withdrawalStats?.pending || 0) + amount,
            redeemedCount: (prev.withdrawalStats?.redeemedCount || 0) + 1,
        },
    }));

    try {
        await addWithdrawalRequest(userProfile.uid, newWithdrawalItem);
    } catch (e) {
        console.error("Failed to request withdrawal:", e);
        // Revert on failure
        setUserProfile(prev => ({
            ...prev,
            points: prev.points + pointsToDeduct,
            withdrawalStats: {
                ...prev.withdrawalStats,
                pending: (prev.withdrawalStats?.pending || 0) - amount,
                redeemedCount: (prev.withdrawalStats?.redeemedCount || 0) - 1,
            },
        }));
        alert("There was an error submitting your withdrawal request. Please try again.");
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'Tasks':
        return <TasksScreen userProfile={userProfile} onNavigate={handleNavigation} onEarnPoints={handleEarnPoints} />;
      case 'Wallet':
        return <WalletScreen userProfile={userProfile} onWithdrawClick={() => handleNavigation('Withdraw')} onHistoryClick={() => handleNavigation('WithdrawalHistory')} />;
      case 'Earn':
        return <EarnScreen onNavigateToReferrals={() => handleNavigation('Referrals')} onEarnPoints={handleEarnPoints}/>;
      case 'Rank':
        return <RankScreen currentUserProfile={userProfile} />;
      case 'Profile':
        return <ProfileScreen userProfile={userProfile} onProfileUpdate={onProfileUpdate} />;
      case 'Notifications':
        return <NotificationsScreen userProfile={userProfile} />;
      case 'ReferBonus':
        return <ReferFriendBonusScreen userProfile={userProfile} onNavigateToReferrals={() => handleNavigation('Referrals')} onEarnPoints={handleEarnPoints} />;
      case 'Referrals':
        return <ReferralsScreen userProfile={userProfile} onBack={() => handleNavigation(referralsSource)} />;
      case 'Withdraw':
        return <WithdrawScreen balance={userProfile.points / 83500} onBack={() => handleNavigation('Wallet')} onNewWithdrawal={handleNewWithdrawal} />;
      case 'WithdrawalHistory':
        return <WithdrawalHistoryScreen userProfile={userProfile} />;
      case 'TaskHistory':
        return <TaskHistoryScreen userProfile={userProfile} />;
      case 'Home':
      default:
        return <MainDashboardScreen userProfile={userProfile} onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="h-screen bg-[var(--gray-light)]">
      <Header 
        userProfile={userProfile} 
        onMenuClick={() => setSidebarOpen(true)}
        onNotificationsClick={() => handleNavigation('Notifications')}
        onProfileClick={() => handleNavigation('Profile')}
        activeScreen={activeTab}
        onBackClick={handleBackNavigation}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentScreen={activeTab}
        navigateTo={handleNavigation}
        onInviteFriends={() => handleNavigation('ReferBonus')}
        onWithdrawalSettings={() => handleNavigation('Withdraw')}
        onHelpCenter={() => alert('Help Center clicked')}
        onLogout={onLogout}
      />
      <main className="pt-16 h-full overflow-y-auto">
        {renderScreen()}
      </main>
      <BottomNavBar activeTab={activeTab} setActiveTab={handleNavigation} />
    </div>
  );
};

// Helper component for the restored Home screen dashboard
const MainDashboardScreen: React.FC<{ userProfile: UserProfile; onNavigate: (screen: Screen) => void; }> = ({ userProfile, onNavigate }) => {
    const balance = userProfile.points / 83500;
    const withdrawalTiers = [5, 10, 25, 50, 100];

    const getCurrentWithdrawalGoal = (currentBalance: number): number => {
        for (const tier of withdrawalTiers) {
            if (currentBalance < tier) return tier;
        }
        return withdrawalTiers[withdrawalTiers.length - 1];
    };
    
    const minWithdrawal = getCurrentWithdrawalGoal(balance);
    const progressPercentage = Math.min((balance / minWithdrawal) * 100, 100);

    const totalEarnings = userProfile.withdrawalStats.completed;
    const surveysCompleted = userProfile.taskStats.completed;
    const rewardsRedeemed = userProfile.withdrawalStats.redeemedCount;

    return (
        <div className="p-4 md:p-6 pb-24 text-[var(--dark)]">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-2xl shadow-xl p-5 mb-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm opacity-80">Balance:</p>
                        <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
                    </div>
                    <div className="text-right w-2/5">
                        <div className="w-full bg-white/25 rounded-full h-2 mb-1.5">
                            <div className="bg-[var(--secondary)] h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <p className="text-xs font-medium">${balance.toFixed(2)} / ${minWithdrawal.toFixed(2)}</p>
                        <p className="text-sm opacity-80 mt-1">{userProfile.points.toLocaleString()} Points</p>
                    </div>
                </div>
                <button 
                    onClick={() => onNavigate('Withdraw')}
                    className="mt-4 w-full flex items-center justify-center py-2 bg-white text-[var(--primary)] font-bold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02]">
                    <i className="fa-solid fa-money-bill-transfer mr-2"></i>
                    <span>Cashout</span>
                </button>
            </div>

            {/* Account Statistics */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                <h2 className="text-lg font-bold text-[var(--dark)] mb-2 px-2">Account statistics</h2>
                <ListItem icon={<i className="fa-solid fa-wallet text-green-500 text-xl"></i>} title={`$${totalEarnings.toFixed(2)} USD`} subtitle="Total earnings" />
                <ListItem icon={<i className="fa-solid fa-clipboard-check text-green-500 text-xl"></i>} title={surveysCompleted.toLocaleString()} subtitle="Tasks Completed" />
                <ListItem icon={<i className="fa-solid fa-award text-blue-500 text-xl"></i>} title={rewardsRedeemed.toLocaleString()} subtitle="Rewards Redeemed" />
                <ListItem icon={<i className="fa-solid fa-gamepad text-yellow-500 text-xl"></i>} title="Games Activities" />
            </div>

             {/* Bonus */}
             <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
                <h2 className="text-lg font-bold text-[var(--dark)] mb-2 px-2">Bonus</h2>
                <ListItem icon={<i className="fa-solid fa-rocket text-purple-500 text-xl"></i>} title="Refer a Friend" onClick={() => onNavigate('ReferBonus')} />
                <ListItem icon={<i className="fa-solid fa-ticket text-pink-500 text-xl"></i>} title="Redeem Bonus Code" />
            </div>
        </div>
    );
};

// Helper component for dashboard list items
interface ListItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick?: () => void;
}
const ListItem: React.FC<ListItemProps> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className="w-full flex items-center justify-between py-3.5 border-b border-[var(--gray-medium)] last:border-b-0 hover:bg-gray-50 transition-colors duration-200 rounded-lg disabled:cursor-default disabled:hover:bg-transparent">
        <div className="flex items-center">
            <div className="w-11 h-11 rounded-full bg-[var(--gray-light)] flex items-center justify-center mr-4">
                {icon}
            </div>
            <div>
                <p className="font-semibold text-left text-[var(--dark)]">{title}</p>
                {subtitle && <p className="text-sm text-left text-[var(--gray)]">{subtitle}</p>}
            </div>
        </div>
        {onClick && <i className="fa-solid fa-chevron-right text-[var(--gray)]"></i>}
    </button>
);


export default HomeScreen;