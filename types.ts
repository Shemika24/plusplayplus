
export interface SpinWheelState {
    spinsToday: number;
    winsToday: number;
    lossesToday: number;
}

export type Screen = 'Home' | 'Tasks' | 'Earn' | 'Wallet' | 'Profile' | 'Notifications' | 'ReferBonus' | 'Referrals' | 'Rank' | 'Withdraw' | 'WithdrawalHistory' | 'TaskHistory' | 'WatchVideos';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  onInviteFriends: () => void;
  onWithdrawalSettings: () => void;
  onHelpCenter: () => void;
  onLogout: () => void;
}


export interface TaskHistory {
    id: number | string;
    icon: string;
    iconColor: string;
    title: string;
    reward: number;
    date: string;
    timestamp?: any; // For Firestore server-side ordering
}

export interface Withdrawal {
    id: number | string;
    status: 'Completed' | 'Pending' | 'Failed';
    amount: number;
    method: string;
    date: string;
    timestamp?: any; // For Firestore server-side ordering
}

export interface UserProfile {
    uid: string;
    dyverzeId: string;
    points: number;
    
    // User Info
    fullName: string;
    username: string;
    avatarUrl: string;
    email: string;
    bio: string;
    dob: string; // ISO string 'YYYY-MM-DD'
    address: string;
    phone: string;
    lastPhoneUpdate?: any; // For Firestore Timestamp

    // Referral Info
    referralLink: string;
    referrals: {
        count: number;
        activeCount: number;
        directEarnings: number;
        commissionEarnings: number;
    };

    // Daily Limits & Stats
    spinStats?: {
        lastDate: string; // "YYYY-MM-DD" based on user locale
        count: number;
        wins: number;
        losses: number;
    };
    
    dailyCheckIn?: {
        lastDate: string; // "YYYY-MM-DD"
        streak: number;
    };

    // Aggregate stats for performance
    taskStats: {
        completed: number;
    };
    withdrawalStats: {
        pending: number;
        completed: number;
        redeemedCount: number;
    };
}


// Add types for RankScreen
export interface RankedUser {
    uid: string;
    rank: number;
    name: string;
    avatar: string;
    points: number;
    isCurrentUser?: boolean;
}

// Add type for NotificationScreen
export interface Notification {
    id: string; // Use string for Firestore IDs
    icon: string;
    iconColor: string;
    title: string;
    description: string;
    time: string; // Or Date
    isRead: boolean;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    duration: number; // in seconds
    points: number;
}
