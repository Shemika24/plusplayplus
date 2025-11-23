import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import SplashScreen from './components/SplashScreen';
import OfflineOverlay from './components/OfflineOverlay'; // Importa o componente OfflineOverlay

import DailyCheckinModal from './components/modals/DailyCheckinModal';
import SpinWheelModal from './components/modals/SpinWheelModal';
import ManageCategoriesModal from './components/modals/ManageCategoriesModal';
import AdViewerModal from './components/modals/AdViewerModal';
import TaskCompleteModal from './components/modals/TaskCompleteModal';
import AutoAdSummaryModal from './components/modals/AutoAdSummaryModal';
import SidebarMenu from './components/SidebarMenu'; // Importa o SidebarMenu
import NoAdsAvailableModal from './components/modals/NoAdsAvailableModal';

import { generateAITask } from './services/geminiService';
import {
  Screen,
  Task,
  TaskCategory,
  AdState,
  Transaction,
  TelegramUserWithProfile,
  ProfileEditState,
  ReferredUser,
  ReferralCount,
  ReferralEarnings,
  CheckinState,
  SpinWheelState,
  TelegramUser, // Added missing import for TelegramUser
  WithdrawalAccounts,
} from './types';
import {
  POINTS_PER_DOLLAR,
  INITIAL_CATEGORIES,
  TOTAL_INTERSTITIAL_ADS, INTERSTITIAL_BATCH_SIZE,
  TOTAL_POP_ADS_DAILY, POP_ADS_BATCH_SIZE,
  TOTAL_VISIT_ADS_DAILY, VISIT_ADS_BATCH_SIZE,
  TOTAL_WEBSITE_ADS_DAILY, WEBSITE_ADS_BATCH_SIZE,
  TOTAL_EXTRA_ADS_DAILY, EXTRA_ADS_BATCH_SIZE,
  DAILY_CHECKIN_REWARDS, DAILY_CHECKIN_SURPRISE_BOX_REWARD,
  MAX_SPINS_PER_DAY,
  AUTO_ADS_REWARD_POINTS, AUTO_ADS_DAILY_LIMIT, AUTO_ADS_COOLDOWN_AFTER_CLAIM_MS, AUTO_ADS_INTERVAL_MS
} from './constants';

// Lazy-loaded screen components
const HomeScreen = lazy(() => import('./screens/HomeScreen'));
const TasksScreen = lazy(() => import('./screens/TasksScreen'));
const WalletScreen = lazy(() => import('./screens/WalletScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));
const ReferralsScreen = lazy(() => import('./screens/ReferralsScreen'));
const EditProfileScreen = lazy(() => import('./screens/EditProfileScreen'));
const TransactionHistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const WithdrawalHistoryScreen = lazy(() => import('./screens/WithdrawalHistoryScreen'));
const WithdrawalSettingsScreen = lazy(() => import('./screens/WithdrawalSettingsScreen'));


const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-full w-full py-20">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
  </div>
);


const SECONDS_IN_DAY = 24 * 60 * 60;

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<TelegramUserWithProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [balance, setBalance] = useState<number>(0); // in USD
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>(INITIAL_CATEGORIES);
  const [profileEditState, setProfileEditState] = useState<ProfileEditState>({ lastNameUpdate: 0, lastEmailUpdate: 0 });

  // Modals visibility
  const [showDailyCheckinModal, setShowDailyCheckinModal] = useState(false);
  const [showSpinWheelModal, setShowSpinWheelModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showAdViewerModal, setShowAdViewerModal] = useState(false);
  const [currentViewingTask, setCurrentViewingTask] = useState<Task | null>(null);
  const [showTaskCompleteModal, setShowTaskCompleteModal] = useState(false);
  const [taskCompletionDetails, setTaskCompletionDetails] = useState<{ taskName: string; reward: number | string } | null>(null);
  const [showNoAdsModal, setShowNoAdsModal] = useState(false);

  // Referral System
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [referralCount, setReferralCount] = useState<ReferralCount>({ total: 0, today: 0 });
  const [referralEarnings, setReferralEarnings] = useState<ReferralEarnings>({ direct: 0, commission: 0 });

  // Ad States for TasksScreen
  const [interstitialState, setInterstitialState] = useState<AdState>({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [popAdState, setPopAdState] = useState<AdState>({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [visitAdState, setVisitAdState] = useState<AdState>({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [websiteAdState, setWebsiteAdState] = useState<AdState>({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [extraAdState, setExtraAdState] = useState<AdState>({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });

  // Daily Check-in State
  const [checkinState, setCheckinState] = useState<CheckinState>({ lastCheckinDate: '', claimedDays: 0 });

  // Spin Wheel State
  const [spinWheelState, setSpinWheelState] = useState<SpinWheelState>({ lastSpinTime: 0, spinsToday: 0, winsToday: 0, lossesToday: 0, cooldownUntil: 0 });

  // Auto Ads State
  const [isAutoAdsRunning, setIsAutoAdsRunning] = useState(false);
  // Fix: Use 'number' for browser's setInterval return type instead of 'NodeJS.Timeout'.
  const autoAdIntervalRef = useRef<number | null>(null);
  const watchAdCallbackRef = useRef<() => void>();
  const [autoAdDailyCount, setAutoAdDailyCount] = useState(0);
  const [isAutoAdsDisabled, setIsAutoAdsDisabled] = useState(false);
  const [autoAdsCooldownUntil, setAutoAdsCooldownUntil] = useState(0);
  const [showAutoAdSummaryModal, setShowAutoAdSummaryModal] = useState(false);
  const [autoAdSessionSummary, setAutoAdSessionSummary] = useState<{ completed: number; points: number } | null>(null);

  // Connectivity state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- Persistence Hooks ---
  const useLocalStorage = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
      try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) : defaultValue;
      } catch (error) {
        console.error(`Error reading localStorage key "${key}":`, error);
        return defaultValue;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error writing localStorage key "${key}":`, error);
      }
    }, [key, state]);

    return [state, setState];
  };

  const [persistentBalance, setPersistentBalance] = useLocalStorage<number>('userBalance', 0);
  const [persistentTransactions, setPersistentTransactions] = useLocalStorage<Transaction[]>('userTransactions', []);
  const [persistentCategories, setPersistentCategories] = useLocalStorage<TaskCategory[]>('taskCategories', INITIAL_CATEGORIES);
  const [persistentProfileEditState, setPersistentProfileEditState] = useLocalStorage<ProfileEditState>('profileEditState', { lastNameUpdate: 0, lastEmailUpdate: 0 });
  const [persistentReferredUsers, setPersistentReferredUsers] = useLocalStorage<ReferredUser[]>('referredUsers', []);
  const [persistentReferralCount, setPersistentReferralCount] = useLocalStorage<ReferralCount>('referralCount', { total: 0, today: 0 });
  const [persistentReferralEarnings, setPersistentReferralEarnings] = useLocalStorage<ReferralEarnings>('referralEarnings', { direct: 0, commission: 0 });
  const [persistentInterstitialState, setPersistentInterstitialState] = useLocalStorage<AdState>('interstitialAdState', { completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [persistentPopAdState, setPersistentPopAdState] = useLocalStorage<AdState>('popAdState', { completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [persistentVisitAdState, setPersistentVisitAdState] = useLocalStorage<AdState>('visitAdState', { completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [persistentWebsiteAdState, setPersistentWebsiteAdState] = useLocalStorage<AdState>('websiteAdState', { completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [persistentExtraAdState, setPersistentExtraAdState] = useLocalStorage<AdState>('extraAdState', { completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
  const [persistentCheckinState, setPersistentCheckinState] = useLocalStorage<CheckinState>('checkinState', { lastCheckinDate: '', claimedDays: 0 });
  const [persistentSpinWheelState, setPersistentSpinWheelState] = useLocalStorage<SpinWheelState>('spinWheelState', { lastSpinTime: 0, spinsToday: 0, winsToday: 0, lossesToday: 0, cooldownUntil: 0 });
  const [withdrawalAccounts, setWithdrawalAccounts] = useLocalStorage<WithdrawalAccounts>('withdrawalAccounts', {});

  const [persistentAutoAdsCooldownUntil, setPersistentAutoAdsCooldownUntil] = useLocalStorage<number>('autoAdsCooldownUntil', 0);
  const [persistentAutoAdDailyCount, setPersistentAutoAdDailyCount] = useLocalStorage<number>('autoAdDailyCount', 0);

  // --- Transaction Management ---
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = { ...transaction, id: uuidv4(), timestamp: Date.now() };
    setTransactions(prev => [newTransaction, ...prev]);
    const amountValue = parseFloat(transaction.amount.replace('+', '').replace('-', '').replace(' points', '').replace('$', ''));
    if (transaction.type === 'withdrawal') {
      setBalance(prev => prev - amountValue);
    } else if (transaction.type === 'referral_bonus' || transaction.type === 'referral_commission') {
      setBalance(prev => prev + amountValue);
    } else {
      setBalance(prev => prev + (amountValue / POINTS_PER_DOLLAR));
    }
  }, []);

  const showTaskCompletion = useCallback((taskName: string, reward: number | string) => {
    setTaskCompletionDetails({ taskName, reward });
    setShowTaskCompleteModal(true);
  }, []);

  // --- Initial Load & Telegram WebApp Integration ---
  useEffect(() => {
    const initApp = async () => {
      // Load user data from Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe) {
        const telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
        const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;

        if(telegramUser){
            const storedEmail = localStorage.getItem(`userEmail_${telegramUser.id}`) || undefined;
            const storedDob = localStorage.getItem(`userDob_${telegramUser.id}`) || undefined;
            const storedPhoto = localStorage.getItem(`userPhoto_${telegramUser.id}`) || undefined;
            setUser({ ...telegramUser, email: storedEmail, dob: storedDob, local_photo_url: storedPhoto });
        }
        
        // Handle referral bonus for new user
        const referralBonusClaimed = localStorage.getItem('referralBonusClaimed');
        if (startParam && !referralBonusClaimed) {
            const bonusPoints = 100_000;
            addTransaction({
                type: 'task',
                description: 'Sign-up Bonus!',
                amount: `+${bonusPoints} points`,
                isDebit: false,
                iconClass: 'fa-solid fa-gift'
            });
            showTaskCompletion('Sign-up Bonus', bonusPoints);
            localStorage.setItem('referralBonusClaimed', 'true');
        }

        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }

      // Load persistent states
      setBalance(persistentBalance);
      setTransactions(persistentTransactions);
      setCategories(persistentCategories);
      setProfileEditState(persistentProfileEditState);
      setReferredUsers(persistentReferredUsers);
      setReferralCount(persistentReferralCount);
      setReferralEarnings(persistentReferralEarnings);
      setInterstitialState(persistentInterstitialState);
      setPopAdState(persistentPopAdState);
      setVisitAdState(persistentVisitAdState);
      setWebsiteAdState(persistentWebsiteAdState);
      setExtraAdState(persistentExtraAdState);
      setCheckinState(persistentCheckinState);
      setSpinWheelState(persistentSpinWheelState);
      setAutoAdsCooldownUntil(persistentAutoAdsCooldownUntil);
      setAutoAdDailyCount(persistentAutoAdDailyCount);

      setLoading(false);
    };

    initApp();
  }, [addTransaction, showTaskCompletion]); // Empty dependency array means this runs once on mount

  // --- Sync persistent states ---
  useEffect(() => { setPersistentBalance(balance); }, [balance, setPersistentBalance]);
  useEffect(() => { setPersistentTransactions(transactions); }, [transactions, setPersistentTransactions]);
  useEffect(() => { setPersistentCategories(categories); }, [categories, setPersistentCategories]);
  useEffect(() => { setPersistentProfileEditState(profileEditState); }, [profileEditState, setPersistentProfileEditState]);
  useEffect(() => { setPersistentReferredUsers(referredUsers); }, [referredUsers, setPersistentReferredUsers]);
  useEffect(() => { setPersistentReferralCount(referralCount); }, [referralCount, setPersistentReferralCount]);
  useEffect(() => { setPersistentReferralEarnings(referralEarnings); }, [referralEarnings, setPersistentReferralEarnings]);
  useEffect(() => { setPersistentInterstitialState(interstitialState); }, [interstitialState, setPersistentInterstitialState]);
  useEffect(() => { setPersistentPopAdState(popAdState); }, [popAdState, setPersistentPopAdState]);
  useEffect(() => { setPersistentVisitAdState(visitAdState); }, [visitAdState, setPersistentVisitAdState]);
  useEffect(() => { setPersistentWebsiteAdState(websiteAdState); }, [websiteAdState, setPersistentWebsiteAdState]);
  useEffect(() => { setPersistentExtraAdState(extraAdState); }, [extraAdState, setPersistentExtraAdState]);
  useEffect(() => { setPersistentCheckinState(checkinState); }, [checkinState, setPersistentCheckinState]);
  useEffect(() => { setPersistentSpinWheelState(spinWheelState); }, [spinWheelState, setPersistentSpinWheelState]);
  useEffect(() => { setPersistentAutoAdsCooldownUntil(autoAdsCooldownUntil); }, [autoAdsCooldownUntil, setPersistentAutoAdsCooldownUntil]);
  useEffect(() => { setPersistentAutoAdDailyCount(autoAdDailyCount); }, [autoAdDailyCount, setPersistentAutoAdDailyCount]);


  // --- Connectivity Listener ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Sidebar Logic ---
  const toggleSidebar = useCallback(() => { setIsSidebarOpen(prev => !prev); }, []);
  const closeSidebar = useCallback(() => { setIsSidebarOpen(false); }, []);

  // --- Navigation Handlers ---
  const navigateTo = useCallback((screen: Screen) => {
    setActiveScreen(screen);
    closeSidebar(); // Close sidebar on navigation
  }, [closeSidebar]);

  const navigateToProfile = useCallback(() => { navigateTo('profile'); }, [navigateTo]);
  const navigateToEditProfile = useCallback(() => { navigateTo('editProfile'); }, [navigateTo]);
  const navigateToWallet = useCallback(() => { navigateTo('wallet'); }, [navigateTo]);
  const navigateToReferrals = useCallback(() => { navigateTo('referrals'); }, [navigateTo]);
  const navigateToHistory = useCallback(() => { navigateTo('history'); }, [navigateTo]);
  const navigateToWithdrawalHistory = useCallback(() => { navigateTo('withdrawalHistory'); }, [navigateTo]);
  const navigateToWithdrawalSettings = useCallback(() => { navigateTo('withdrawalSettings'); }, [navigateTo]);

  
  // --- Ad State Management Helper ---
  const updateAdStateAfterClaim = useCallback((task: Task) => {
      const adType = task.id.split('-')[0];
      const now = Date.now();
      if (adType === 'inter') {
        setInterstitialState(prev => {
          const newCompletedToday = prev.completedTodayCount + 1;
          const newCurrentBatchCompleted = prev.currentBatchCompletedCount + 1;
          if (newCurrentBatchCompleted >= INTERSTITIAL_BATCH_SIZE) {
            return { completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, nextBatchAvailableAt: now + (6 * 60 * 1000), cooldownUntil: 0 };
          }
          return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: newCurrentBatchCompleted };
        });
      } else if (adType === 'pop') {
        setPopAdState(prev => {
          const newCompletedToday = prev.completedTodayCount + 1;
          const newCurrentBatchCompleted = prev.currentBatchCompletedCount + 1;
          if (newCompletedToday >= TOTAL_POP_ADS_DAILY) {
            return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (24 * 60 * 60 * 1000) };
          }
          if (newCurrentBatchCompleted >= POP_ADS_BATCH_SIZE) {
            return { completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: now + (5 * 60 * 1000) };
          }
          return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: newCurrentBatchCompleted };
        });
      } else if (adType === 'visit') {
          setVisitAdState(prev => {
              const newCompletedToday = prev.completedTodayCount + 1;
              if (newCompletedToday >= TOTAL_VISIT_ADS_DAILY) {
                  return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (24 * 60 * 60 * 1000) };
              }
              return { ...prev, completedTodayCount: newCompletedToday };
          });
      } else if (adType === 'website') {
          setWebsiteAdState(prev => {
              const newCompletedToday = prev.completedTodayCount + 1;
              if (newCompletedToday >= TOTAL_WEBSITE_ADS_DAILY) {
                  return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (24 * 60 * 60 * 1000) };
              }
              const newCurrentBatchCompleted = prev.currentBatchCompletedCount + 1;
              if (newCurrentBatchCompleted >= WEBSITE_ADS_BATCH_SIZE) {
                  return { completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (7 * 60 * 1000), nextBatchAvailableAt: 0 };
              }
              return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: newCurrentBatchCompleted };
          });
      } else if (adType === 'extra') {
          setExtraAdState(prev => {
              const newCompletedToday = prev.completedTodayCount + 1;
              if (newCompletedToday >= TOTAL_EXTRA_ADS_DAILY) {
                  return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (24 * 60 * 60 * 1000) };
              }
              const newCurrentBatchCompleted = prev.currentBatchCompletedCount + 1;
              if (newCurrentBatchCompleted >= EXTRA_ADS_BATCH_SIZE) {
                  return { completedTodayCount: newCompletedToday, currentBatchCompletedCount: 0, cooldownUntil: now + (10 * 60 * 1000), nextBatchAvailableAt: 0 };
              }
              return { ...prev, completedTodayCount: newCompletedToday, currentBatchCompletedCount: newCurrentBatchCompleted };
          });
      }
  }, []);

  // --- Task Completion / Ad Handling ---
  const handleTaskComplete = useCallback((task: Task) => {
    setCategories(prevCategories =>
      prevCategories.map(cat =>
        cat.id === task.id.split('-')[0] ? { ...cat, tasks: cat.tasks.map(t => t.id === task.id ? { ...t, status: 'completed' } : t) } : cat
      )
    );
    addTransaction({
      type: 'task',
      description: task.name,
      amount: `+${task.reward} points`,
      isDebit: false,
      iconClass: "fa-solid fa-square-check",
    });
    showTaskCompletion(task.name, task.reward);
  }, [addTransaction, showTaskCompletion]);

  const handleStartAd = useCallback((task: Task) => {
    const adType = task.id.split('-')[0];
    const adProvider = window.show_9735571;

    const completeAdTask = (taskToComplete: Task) => {
      handleTaskComplete(taskToComplete);
      updateAdStateAfterClaim(taskToComplete);
    };

    if (!adProvider) {
      console.warn('Ad service not available.');
      setShowNoAdsModal(true);
      return;
    }

    // Explicitly handle 'interstitial' ads as requested by the user's snippet
    if (adType === 'inter') {
      adProvider().then(() => {
        completeAdTask(task);
      }).catch(e => {
        console.error(`Interstitial ad error:`, e);
        alert('Failed to load ad. Please check your internet connection and try again.');
      });
    // Explicitly handle 'pop' ads as requested by the user's snippet
    } else if (adType === 'pop') {
      adProvider('pop').then(() => {
        completeAdTask(task);
      }).catch(e => {
        // Per the user's snippet, do nothing on error for pop ads, just log it.
        console.error(`Pop ad error:`, e);
      });
    // Handle other ad types that take an argument
    } else if (['visit', 'website', 'extra'].includes(adType)) {
      adProvider(adType).then(() => {
        completeAdTask(task);
      }).catch(e => {
        console.error(`${adType} ad error:`, e);
        alert('Failed to load ad. Please check your internet connection and try again.');
      });
    } else {
      console.warn(`Ad type "${adType}" is not configured for the ad provider.`);
      setShowNoAdsModal(true);
    }
  }, [handleTaskComplete, updateAdStateAfterClaim]);

  const handleAdClaim = useCallback(() => {
    if (currentViewingTask) {
      handleTaskComplete(currentViewingTask);
      updateAdStateAfterClaim(currentViewingTask);
      setShowAdViewerModal(false);
    }
  }, [currentViewingTask, handleTaskComplete, updateAdStateAfterClaim]);

  // --- Daily Check-in Logic ---
  const canClaimToday = useMemo(() => new Date().toDateString() !== checkinState.lastCheckinDate, [checkinState.lastCheckinDate]);

  const handleCheckin = useCallback((isSurpriseBoxClaim: boolean) => {
    if (!canClaimToday) return;

    const grantReward = () => {
        const today = new Date().toDateString();
        let rewardPoints = 0;
        let newClaimedDays = checkinState.claimedDays + 1;

        if (isSurpriseBoxClaim && newClaimedDays === 7) {
            rewardPoints = DAILY_CHECKIN_SURPRISE_BOX_REWARD;
            newClaimedDays = 0; // Reset for the next cycle
        } else if (!isSurpriseBoxClaim && newClaimedDays <= DAILY_CHECKIN_REWARDS.length) {
            rewardPoints = DAILY_CHECKIN_REWARDS[newClaimedDays - 1];
        } else {
            // Fallback for unexpected state, reset to day 1
            rewardPoints = DAILY_CHECKIN_REWARDS[0];
            newClaimedDays = 1;
        }

        setCheckinState({ lastCheckinDate: today, claimedDays: newClaimedDays });
        
        addTransaction({
            type: 'daily_checkin',
            description: isSurpriseBoxClaim ? 'Daily Check-in (Surprise Box)' : `Daily Check-in Day ${newClaimedDays > 6 ? 1 : newClaimedDays}`,
            amount: `+${rewardPoints} points`,
            isDebit: false,
            iconClass: "fa-solid fa-calendar-check",
        });
        
        setShowDailyCheckinModal(false);
        showTaskCompletion(isSurpriseBoxClaim ? 'Daily Check-in (Surprise Box)' : 'Daily Check-in', rewardPoints);
    };

    if (window.show_9735571) {
        window.show_9735571('pop').then(() => {
            grantReward();
        }).catch(e => {
            console.error("Daily check-in pop ad error:", e);
            grantReward();
        });
    } else {
        console.warn('Ad service not available for daily check-in.');
        setShowNoAdsModal(true);
    }
  }, [checkinState, canClaimToday, addTransaction, showTaskCompletion]);

  // --- Spin Wheel Logic ---
  const handleSpinComplete = useCallback((prize: number | string) => {
    const now = Date.now();
    let updatedSpinsToday = spinWheelState.spinsToday + 1;
    let updatedWinsToday = spinWheelState.winsToday;
    let updatedLossesToday = spinWheelState.lossesToday;
    if (typeof prize === 'number') {
      updatedWinsToday++;
      addTransaction({
        type: 'spin_wheel',
        description: 'Lucky Wheel Win',
        amount: `+${prize} points`,
        isDebit: false,
        iconClass: "fa-solid fa-trophy",
      });
      showTaskCompletion('Lucky Wheel', prize);
    } else {
      updatedLossesToday++;
    }
    setSpinWheelState(prev => ({ ...prev, lastSpinTime: now, spinsToday: updatedSpinsToday, winsToday: updatedWinsToday, lossesToday: updatedLossesToday, cooldownUntil: updatedSpinsToday < MAX_SPINS_PER_DAY ? now + 15000 : now + 86400000 }));
  }, [addTransaction, spinWheelState, showTaskCompletion]);

  // --- Auto Ads Logic ---
  const stopAutoAds = useCallback(() => {
    if (autoAdIntervalRef.current) {
        clearInterval(autoAdIntervalRef.current);
        autoAdIntervalRef.current = null;
    }
    setIsAutoAdsRunning(false);
  }, []);

  useEffect(() => {
    watchAdCallbackRef.current = async () => {
        if (autoAdDailyCount >= AUTO_ADS_DAILY_LIMIT) {
            stopAutoAds();
            alert("Daily limit for video ads reached. The session has been stopped.");
            return;
        }

        const adProvider = window.show_9735571;

        if (!adProvider) {
            console.warn('Ad service not available for auto ads. Stopping session.');
            stopAutoAds();
            setShowNoAdsModal(true);
            return;
        }
        
        const rewardAndCount = () => {
            const newCount = autoAdDailyCount + 1;
            setAutoAdDailyCount(newCount);
            addTransaction({
                type: 'auto_ad',
                description: `Watched Video Ad ${newCount}`,
                amount: `+${AUTO_ADS_REWARD_POINTS} points`,
                isDebit: false,
                iconClass: "fa-solid fa-play-circle",
            });
            showTaskCompletion('Watched Video Ad', AUTO_ADS_REWARD_POINTS);
            if (newCount >= AUTO_ADS_DAILY_LIMIT) {
                setIsAutoAdsDisabled(true);
                setAutoAdsCooldownUntil(Date.now() + AUTO_ADS_COOLDOWN_AFTER_CLAIM_MS);
                stopAutoAds();
            }
        };

        try {
            await adProvider();
            rewardAndCount();
        } catch (error) {
            console.error("Auto Ad error:", error);
            rewardAndCount(); // Reward even on error for good faith
        }
    };
  }, [autoAdDailyCount, addTransaction, showTaskCompletion, stopAutoAds]);

  const startAutoAds = useCallback(() => {
    if (isAutoAdsRunning || isAutoAdsDisabled || !isOnline) return;

    setIsAutoAdsRunning(true);
    
    // Call immediately once
    watchAdCallbackRef.current?.();

    // Then set interval
    autoAdIntervalRef.current = window.setInterval(() => {
        watchAdCallbackRef.current?.();
    }, AUTO_ADS_INTERVAL_MS);
  }, [isAutoAdsRunning, isAutoAdsDisabled, isOnline]);

  useEffect(() => {
    const resetDailyStates = () => {
      const today = new Date().toDateString();
      const lastResetDate = localStorage.getItem('lastResetDate');
      if (lastResetDate !== today) {
        setInterstitialState({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
        setPopAdState({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
        setVisitAdState({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
        setWebsiteAdState({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
        setExtraAdState({ completedTodayCount: 0, currentBatchCompletedCount: 0, nextBatchAvailableAt: 0, cooldownUntil: 0 });
        setReferralCount(prev => ({ ...prev, today: 0 }));
        setSpinWheelState(prev => ({ ...prev, spinsToday: 0, winsToday: 0, lossesToday: 0, cooldownUntil: 0 }));
        setIsAutoAdsDisabled(false);
        setAutoAdsCooldownUntil(0);
        setAutoAdDailyCount(0);
        localStorage.setItem('lastResetDate', today);
      }
    };
    resetDailyStates();
    const interval = setInterval(resetDailyStates, SECONDS_IN_DAY * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (autoAdsCooldownUntil > now) {
      setIsAutoAdsDisabled(true);
    } else if (autoAdDailyCount < AUTO_ADS_DAILY_LIMIT) {
      setIsAutoAdsDisabled(false);
    }
  }, [autoAdsCooldownUntil, autoAdDailyCount]);
  
  // Cleanup effect for interval on component unmount
  useEffect(() => {
    return () => {
        if (autoAdIntervalRef.current) {
            clearInterval(autoAdIntervalRef.current);
        }
    };
  }, []);

  const handleProfileSave = useCallback((updatedFields: Partial<TelegramUserWithProfile>) => {
    if (user) {
      const now = Date.now();
      const newProfileEditState: ProfileEditState = { ...profileEditState };
      if (updatedFields.last_name !== user.last_name) newProfileEditState.lastNameUpdate = now;
      if (updatedFields.email !== user.email) newProfileEditState.lastEmailUpdate = now;
      if (updatedFields.local_photo_url) {
          localStorage.setItem(`userPhoto_${user.id}`, updatedFields.local_photo_url);
      }
      setUser(prev => ({ ...prev!, ...updatedFields }));
      setProfileEditState(newProfileEditState);
      if (updatedFields.email !== undefined) localStorage.setItem(`userEmail_${user.id}`, updatedFields.email);
      if (updatedFields.dob !== undefined) localStorage.setItem(`userDob_${user.id}`, updatedFields.dob);
    }
    navigateTo('profile');
  }, [user, profileEditState, navigateTo]);

  const handleLogout = useCallback(() => {
    const confirmLogout = window.confirm("Are you sure you want to log out? All your local data will be reset.");
    if (confirmLogout) {
        // Clear all stored data
        localStorage.clear();
        // Close the Telegram Web App
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.close();
        } else {
            // Fallback for non-telegram environment
            alert("You have been logged out. Please close this window.");
            // Reload the page to a clean state.
            window.location.reload();
        }
    }
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  const commonProps = {
    user, balance, transactions, categories, setCategories, addTransaction, showTaskCompletion, navigateToWallet,
    navigateToReferrals, onOpenHistory: () => navigateTo('history'), profileEditState, onSave: handleProfileSave,
    referralCount, referralEarnings, invitedFriends: referredUsers, isOnline,
    onEditProfile: navigateToEditProfile,
  };

  const pendingWithdrawals = 0;
  const totalWithdrawn = 0;

  const homeScreenProps = {
    ...commonProps,
    onOpenCheckin: () => setShowDailyCheckinModal(true),
    onOpenSpinWheel: () => setShowSpinWheelModal(true),
    startAutoAds,
    stopAutoAds,
    isAutoAdsRunning,
    isAutoAdsDisabled,
  };

  const ScreenContent = () => (
    <Suspense fallback={<LoadingSpinner />}>
        {activeScreen === 'home' && <HomeScreen {...homeScreenProps} />}
        {activeScreen === 'tasks' && <TasksScreen {...commonProps} interstitialState={interstitialState} popAdState={popAdState} visitAdState={visitAdState} websiteAdState={websiteAdState} extraAdState={extraAdState} onStartAd={handleStartAd} />}
        {activeScreen === 'wallet' && <WalletScreen {...commonProps} onOpenWithdrawalHistory={navigateToWithdrawalHistory} pendingWithdrawals={pendingWithdrawals} totalWithdrawn={totalWithdrawn} />}
        {activeScreen === 'profile' && <ProfileScreen {...commonProps} />}
        {activeScreen === 'referrals' && <ReferralsScreen {...commonProps} onBack={() => navigateTo('home')} />}
        {activeScreen === 'editProfile' && <EditProfileScreen {...commonProps} onBack={() => navigateTo('profile')} />}
        {activeScreen === 'history' && <TransactionHistoryScreen 
            transactions={transactions.filter(t => !t.isDebit)}
            onBack={() => navigateTo('tasks')} 
        />}
        {activeScreen === 'withdrawalHistory' && <WithdrawalHistoryScreen 
          transactions={transactions.filter(t => t.type === 'withdrawal')}
          onBack={() => navigateTo('wallet')} 
        />}
        {activeScreen === 'withdrawalSettings' && <WithdrawalSettingsScreen 
          onBack={() => navigateTo('wallet')} 
          withdrawalAccounts={withdrawalAccounts}
          setWithdrawalAccounts={setWithdrawalAccounts}
        />}
    </Suspense>
  );

  return (
    <div className={`flex flex-col min-h-screen bg-light dark:bg-dark text-dark dark:text-light transition-colors duration-200 ${isSidebarOpen ? 'overflow-hidden' : ''}`}>
      <Header user={user} onMenuClick={toggleSidebar} />
      
      {isOnline ? (
        <main className="flex-grow p-4 pb-20 overflow-y-auto">
          <ScreenContent />
        </main>
      ) : (
        <div className="flex-grow p-4 pb-20 overflow-y-auto relative">
          <ScreenContent />
          <OfflineOverlay />
        </div>
      )}

      <BottomNav activeTab={activeScreen} setActiveTab={navigateTo} />

      <DailyCheckinModal isOpen={showDailyCheckinModal} onClose={() => setShowDailyCheckinModal(false)} onCheckinAction={handleCheckin} checkinState={checkinState} canClaimToday={canClaimToday} isOnline={isOnline} />
      <SpinWheelModal isOpen={showSpinWheelModal} onClose={() => setShowSpinWheelModal(false)} spinWheelState={spinWheelState} onSpinComplete={handleSpinComplete} isOnline={isOnline} />
      <ManageCategoriesModal isOpen={showManageCategoriesModal} onClose={() => setShowManageCategoriesModal(false)} categories={categories} setCategories={setCategories} />
      {showAdViewerModal && currentViewingTask && <AdViewerModal isOpen={showAdViewerModal} onClose={() => setShowAdViewerModal(false)} task={currentViewingTask} onClaim={handleAdClaim} />}
      <TaskCompleteModal isOpen={showTaskCompleteModal} onClose={() => setShowTaskCompleteModal(false)} reward={taskCompletionDetails?.reward || 0} taskName={taskCompletionDetails?.taskName || ''} />
      <AutoAdSummaryModal isOpen={showAutoAdSummaryModal} onClose={() => setShowAutoAdSummaryModal(false)} totalAdsCompleted={autoAdSessionSummary?.completed || 0} totalPointsEarned={autoAdSessionSummary?.points || 0} />
      <NoAdsAvailableModal isOpen={showNoAdsModal} onClose={() => setShowNoAdsModal(false)} />

      <SidebarMenu isOpen={isSidebarOpen} onClose={closeSidebar} user={user} currentScreen={activeScreen} navigateTo={navigateTo} onEditProfile={navigateToEditProfile} onInviteFriends={navigateToReferrals} onWithdrawalSettings={navigateToWithdrawalSettings} onHelpCenter={() => alert('Help Center Clicked!')} onLogout={handleLogout} />
    </div>
  );
};

export default App;