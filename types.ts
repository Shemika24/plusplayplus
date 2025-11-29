
// Add Telegram Types
declare global {
    interface Window {
        Telegram: {
            WebApp: {
                ready: () => void;
                expand: () => void;
                close: () => void;
                openTelegramLink: (url: string) => void;
                initData: string; // Encoded data for backend validation
                initDataUnsafe: {
                    user?: {
                        id: number;
                        first_name: string;
                        last_name?: string;
                        username?: string;
                        language_code?: string;
                        photo_url?: string;
                        is_premium?: boolean;
                    };
                    auth_date?: string;
                    hash?: string; // Hash for validation
                    start_param?: string;
                };
                colorScheme: 'light' | 'dark';
                themeParams: any;
                isExpanded: boolean;
                viewportHeight: number;
                viewportStableHeight: number;
                platform: string;
                version: string;
            }
        }
    }
}

export interface SpinWheelState {
    spinsToday: number;
    winsToday: number;
    lossesToday: number;
}

export type Screen = 'Home' | 'Tasks' | 'Earn' | 'Wallet' | 'Profile' | 'Notifications' | 'ReferBonus' | 'Referrals' | 'Rank' | 'Withdraw' | 'WithdrawalHistory' | 'TaskHistory' | 'WatchVideos' | 'SpecialOffers' | 'About' | 'HelpCenter';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  onInviteFriends: () => void;
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

export interface NotificationPreferences {
    withdrawals: boolean;     // Payment updates
    dailyCheckIn: boolean;    // Reminders to check in
    luckyWheel: boolean;      // When spins reset
    referrals: boolean;       // New signups/commissions
    announcements: boolean;   // App updates/News
}

export interface PrivacySettings {
    showInRanking: boolean;       // Show profile in RankScreen
    allowPersonalizedAds: boolean; // Allow data usage for ads
    visibleToReferrals: boolean;  // Show real name to downline
    showOnlineStatus: boolean;    // Show active status
}

export interface PaymentDetails {
    method: 'PayPal' | 'Payeer' | 'Payoneer' | 'Airtm' | 'Crypto';
    detail: string; // Email or Wallet Address
    cryptoName?: string; // e.g., 'Tron (TRX)'
}

export interface UserProfile {
    uid: string;
    dyverzeId: string;
    points: number;
    theme?: string; // 'light' | 'dark'
    telegramId?: string; // Added for Telegram Integration Check
    
    // User Info
    fullName: string;
    username: string;
    avatarUrl: string;
    lastAvatarUpdate?: any; // Timestamp for 3-month validation
    email: string;
    bio: string;
    dob: string; // ISO string 'YYYY-MM-DD'
    address: string;
    phone: string;
    lastPhoneUpdate?: any; // For Firestore Timestamp
    
    // Device Info
    deviceInfo?: string; // Stores navigator.userAgent

    // Settings
    notificationPreferences: NotificationPreferences;
    privacySettings: PrivacySettings;
    savedPaymentMethods: PaymentDetails[]; // Changed from single object to array

    // Referral Info
    referralLink: string;
    referredBy?: string; // ID of the user who referred this user
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