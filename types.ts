import React from 'react';

// Fix: Add the missing TelegramUser interface
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_bot?: boolean;
  is_premium?: boolean;
}

// Interfaces for Telegram Web App
export interface TelegramWebAppInterface {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    receiver?: TelegramUser;
    chat?: any; // Consider defining a more specific Chat interface if needed
    start_param?: string;
    auth_date: number;
    hash: string;
  };
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  themeParams: {
    bg_color: string;
    text_color: string;
    hint_color: string;
    link_color: string;
    button_color: string;
    button_text_color: string;
    secondary_bg_color: string;
  };
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_visible?: boolean;
      is_active?: boolean;
    }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => void;
    getItem: (key: string, callback?: (error: string | null, value: string | null) => void) => void;
    getItems: (keys: string[], callback?: (error: string | null, result: { [key: string]: string | null }) => void) => void;
    removeItem: (key: string, callback?: (error: string | null, success: boolean) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => void;
    getKeys: (callback?: (error: string | null, keys: string[]) => void) => void;
  };
  isVersionAtLeast: (version: string) => void;
  sendData: (data: string) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
  onEvent: (eventType: string, callback: (...args: any[]) => any) => void;
  offEvent: (eventType: string, callback: (...args: any[]) => any) => void;
  requestWriteAccess: (callback?: (allowed: boolean) => void) => void;
  requestContact: (callback?: (allowed: boolean) => void) => void;
  switchInlineQuery: (query: string, chooseChatTypes?: ('users' | 'bots' | 'groups' | 'channels')[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  showPopup: (params: any, callback?: (id?: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: { // Telegram itself is an object that contains WebApp
      WebApp?: TelegramWebAppInterface; // WebApp is the actual API object
    };
    // Fix: Remove redundant declaration for `aistudio` to avoid type conflicts.
    // Assuming `aistudio` is globally declared elsewhere (e.g., in a .d.ts file from the environment).
    // aistudio?: {
    //   hasSelectedApiKey: () => Promise<boolean>;
    //   openSelectKey: () => Promise<void>;
    // };
    show_9735571?: (type?: string) => Promise<void>;
    a3klsam?: any; // Define the new ad provider's global object
  }
}

// Global App Types
export type Screen = 'home' | 'tasks' | 'wallet' | 'profile' | 'referrals' | 'editProfile' | 'history' | 'withdrawalHistory' | 'withdrawalSettings';

export interface Task {
  id: string;
  name: string;
  description: string;
  time: number; // in seconds
  reward: number; // in points
  status: 'pending' | 'completed';
  image?: string; // Optional image URL for AI tasks
}

export interface TaskCategory {
  id: string;
  title: string;
  color: string; // Tailwind CSS class for color, e.g., 'bg-primary'
  tasks: Task[];
}

export interface AdState {
  completedTodayCount: number;
  currentBatchCompletedCount: number;
  nextBatchAvailableAt: number; // timestamp
  cooldownUntil: number; // timestamp
}

export interface Transaction {
  id: string;
  type: 'task' | 'daily_checkin' | 'spin_wheel' | 'referral_bonus' | 'referral_commission' | 'withdrawal' | 'auto_ad';
  description: string;
  amount: string; // Can be "+100 points" or "-$5.00"
  timestamp: number;
  isDebit: boolean; // true for withdrawals, false for earnings
  iconClass: string; // FontAwesome icon class name
}

export interface TelegramUserWithProfile extends TelegramUser {
  email?: string;
  dob?: string;
  local_photo_url?: string;
}

export interface ProfileEditState {
  lastNameUpdate: number; // timestamp of last update
  lastEmailUpdate: number; // timestamp of last update
}

export interface ReferredUser {
  telegramId: number;
  username: string;
  photo_url?: string;
  joinDate: number;
}

export interface ReferralCount {
  total: number;
  today: number;
}

export interface ReferralEarnings {
  direct: number;
  commission: number;
}

export interface DailyReward {
  day: number;
  points: number;
  claimed: boolean;
}

export interface CheckinState {
  lastCheckinDate: string; // YYYY-MM-DD
  claimedDays: number; // Consecutive days
}

export interface SpinWheelState {
  lastSpinTime: number; // timestamp
  spinsToday: number;
  winsToday: number;
  lossesToday: number;
  cooldownUntil: number; // timestamp
}

// New type for withdrawal accounts
export interface WithdrawalAccounts {
  [methodId: string]: string;
}

// Prop Interfaces for Screens
export interface HomeScreenProps {
  balance: number;
  onOpenCheckin: () => void;
  onOpenSpinWheel: () => void;
  navigateToWallet: () => void;
  navigateToReferrals: () => void;
  user: TelegramUser | null;
  startAutoAds: () => void;
  stopAutoAds: () => void;
  isAutoAdsRunning: boolean;
  isAutoAdsDisabled: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  showTaskCompletion: (taskName: string, reward: number | string) => void;
  isOnline: boolean;
}

export interface TasksScreenProps {
  categories: TaskCategory[];
  setCategories: React.Dispatch<React.SetStateAction<TaskCategory[]>>;
  interstitialState: AdState;
  popAdState: AdState;
  visitAdState: AdState;
  websiteAdState: AdState;
  extraAdState: AdState;
  onStartAd: (task: Task) => void;
  onOpenHistory: () => void;
  referralCount: ReferralCount;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void; // Added for DailyProgress
}

export interface WalletScreenProps {
  balance: number;
  transactions: Transaction[];
  referralEarnings: ReferralEarnings;
  onOpenHistory: () => void;
  onOpenWithdrawalHistory: () => void;
  pendingWithdrawals: number;
  totalWithdrawn: number;
}

export interface ProfileScreenProps {
  user: TelegramUserWithProfile | null;
  onEditProfile: () => void;
}

export interface ReferralsScreenProps {
  onBack: () => void;
  referralCount: ReferralCount;
  referralEarnings: ReferralEarnings;
  user: TelegramUser | null;
  invitedFriends: ReferredUser[];
}

export interface EditProfileScreenProps {
  user: TelegramUserWithProfile | null;
  profileEditState: ProfileEditState;
  onBack: () => void;
  onSave: (updatedFields: Partial<TelegramUserWithProfile>) => void;
}

export interface TransactionHistoryScreenProps {
  transactions: Transaction[];
  onBack: () => void;
}

export interface WithdrawalHistoryScreenProps {
  transactions: Transaction[];
  onBack: () => void;
}


// New props for withdrawal settings screen
export interface WithdrawalSettingsScreenProps {
  onBack: () => void;
  withdrawalAccounts: WithdrawalAccounts;
  setWithdrawalAccounts: React.Dispatch<React.SetStateAction<WithdrawalAccounts>>;
}

export interface DailyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckinAction: (isSurpriseBoxClaim: boolean) => void;
  checkinState: CheckinState;
  canClaimToday: boolean;
  isOnline: boolean;
}

export interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinWheelState: SpinWheelState;
  onSpinComplete: (prize: number | string) => void;
  isOnline: boolean;
}

export interface AutoAdSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAdsCompleted: number;
  totalPointsEarned: number;
}

export interface AdBannerProps {
  // No props needed anymore as the ad is self-contained
}

export interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: TelegramUserWithProfile | null;
  currentScreen: Screen;
  navigateTo: (screen: Screen) => void;
  onEditProfile: () => void;
  onInviteFriends: () => void;
  onWithdrawalSettings: () => void;
  onHelpCenter: () => void;
  onLogout: () => void;
}