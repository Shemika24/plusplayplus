
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import OfflineStatusDetector from './components/OfflineStatusDetector';
import SecurityCheck from './components/SecurityCheck';
import { onAuthStateChangedListener, signOutUser } from './services/authService';
import { getUserProfile, createUserProfileDocument } from './services/firestoreService';
import { User } from 'firebase/auth';
import { UserProfile } from './types';
import { applyTheme } from './utils/themes';
import { storageService } from './utils/storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { verifyTelegramData } from './utils/telegramUtils';

const App: React.FC = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSplashTimeOver, setIsSplashTimeOver] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 1. Initialize Theme from LocalStorage on Mount AND Telegram Web App Init
  useEffect(() => {
    const initApp = async () => {
        // --- Telegram Integration Start ---
        let startParam: string | undefined = undefined;

        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            try {
                tg.ready();
                tg.expand();
                
                // Capture Referral Param
                if (tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
                    startParam = tg.initDataUnsafe.start_param;
                    console.log("Ref code found:", startParam);
                }
                
                // Security & Validation Check
                const { isAuthentic } = verifyTelegramData();
                if (isAuthentic) {
                    console.log("Telegram integrity check passed (Client).");
                }

                // Optional: Sync theme with Telegram if available
                if (tg.colorScheme) {
                    applyTheme(tg.colorScheme);
                    await storageService.setItem('app_theme', tg.colorScheme);
                }
            } catch (e) {
                console.warn("Telegram Web App init failed:", e);
            }
        }
        // --- Telegram Integration End ---

        const savedTheme = await storageService.getItem('app_theme');
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Default to light if no storage and no Telegram theme override
            if (!window.Telegram?.WebApp?.colorScheme) {
                applyTheme('light'); 
            }
        }
        
        // Store startParam temporarily in window or local variable to be accessible by auth listener
        // However, since auth listener runs independently, we handle it inside the listener if possible.
        // NOTE: State update here won't be instant for the auth listener.
        // We will trust that the auth listener below will grab this param if needed, 
        // OR we modify the listener to use this captured param. 
        // A cleaner way is to store it in a ref or module-level variable if the listener is defined outside.
        // But since listener is inside component, we can use a ref.
        if (startParam) {
             window.sessionStorage.setItem('telegram_ref_code', startParam);
        }
    };
    initApp();

    const timer = setTimeout(() => {
      setIsSplashTimeOver(true);
    }, 2500); // Reduced from 6000ms to 2500ms for better UX

    return () => clearTimeout(timer);
  }, []);

  // 2. Real-time User Profile Listener
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChangedListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Retrieve referral code captured during init
        const refCode = window.sessionStorage.getItem('telegram_ref_code') || undefined;

        // Initial check to ensure profile exists
        try {
            // Pass refCode to getUserProfile. It will handle passing it to createUserProfileDocument if needed.
            const profileCheck = await getUserProfile(user, refCode);
            
            if (!profileCheck) {
                // Fallback creation handled in getUserProfile, but double check here
                // If getUserProfile returned null (error), force create with refCode
                await createUserProfileDocument(user, { fullName: user.displayName || 'User' }, refCode);
            }
        } catch (e) {
            console.error("Profile init check failed", e);
        }

        // SET UP REAL-TIME LISTENER
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
                
                // --- SECURITY CHECK: DEVICE SHARING / MULTI-ACCOUNT SUPPORT ---
                // If we are in Telegram, ensure the current Firebase User matches the Telegram User.
                // If not, it means a different Telegram user is opening the app on a device where
                // another user was logged in. We must logout to allow the new user to auth.
                if (window.Telegram?.WebApp?.initDataUnsafe?.user && data.telegramId) {
                    const currentTgId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
                    if (data.telegramId !== currentTgId) {
                        console.warn("Telegram ID mismatch (Shared Device Detected). Logging out...");
                        signOutUser().then(() => {
                            // Reload to clear state and show AuthScreen for new user
                            window.location.reload();
                        });
                        return;
                    }
                }
                // -----------------------------------------------------------------

                // Apply theme if changed from another device
                if (data.theme) applyTheme(data.theme);
                setUserProfile(data);
            }
        }, (error) => {
            console.error("Real-time profile error:", error);
        });

      } else {
        setCurrentUser(null);
        setUserProfile(null);
        if (unsubscribeSnapshot) unsubscribeSnapshot();
      }
      setIsAuthLoading(false);
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const handleProfileUpdate = (data: Partial<UserProfile>) => {
      // Optimistic update for immediate UI response
      // The real-time listener will overwrite this shortly after with server data
      if (userProfile) {
        const updatedProfile = { ...userProfile, ...data };
        setUserProfile(updatedProfile);
        
        if (data.theme) {
            applyTheme(data.theme);
            storageService.setItem('app_theme', data.theme);
        }
      }
  };

  return (
    <SecurityCheck>
      {(!isSplashTimeOver || isAuthLoading) ? (
        <SplashScreen />
      ) : (!currentUser || !userProfile) ? (
        <>
          <OfflineStatusDetector />
          <AuthScreen />
        </>
      ) : (
        <>
          <OfflineStatusDetector />
          <HomeScreen 
            userProfile={userProfile} 
            onLogout={handleLogout} 
            onProfileUpdate={handleProfileUpdate}
          />
        </>
      )}
    </SecurityCheck>
  );
};

export default App;
