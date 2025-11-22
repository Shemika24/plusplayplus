
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import OfflineStatusDetector from './components/OfflineStatusDetector';
import { onAuthStateChangedListener, signOutUser } from './services/authService';
import { getUserProfile, createUserProfileDocument } from './services/firestoreService';
import { User } from 'firebase/auth';
import { UserProfile } from './types';
import { applyTheme } from './utils/themes';
import { storageService } from './utils/storage';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const App: React.FC = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSplashTimeOver, setIsSplashTimeOver] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // 1. Initialize Theme from LocalStorage on Mount
  useEffect(() => {
    const initTheme = async () => {
      const savedTheme = await storageService.getItem('app_theme');
      if (savedTheme) {
        applyTheme(savedTheme);
      } else {
        applyTheme('light'); // Default
      }
    };
    initTheme();

    const timer = setTimeout(() => {
      setIsSplashTimeOver(true);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  // 2. Real-time User Profile Listener
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChangedListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Initial check to ensure profile exists
        try {
            const profileCheck = await getUserProfile(user);
            if (!profileCheck) {
                // Fallback creation handled in getUserProfile, but double check here
                await createUserProfileDocument(user, { fullName: user.displayName || 'User' });
            }
        } catch (e) {
            console.error("Profile init check failed", e);
        }

        // SET UP REAL-TIME LISTENER
        const userDocRef = doc(db, "users", user.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as UserProfile;
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

  if (!isSplashTimeOver || isAuthLoading) {
    return <SplashScreen />;
  }

  if (!currentUser || !userProfile) {
    return (
      <>
        <OfflineStatusDetector />
        <AuthScreen />
      </>
    );
  }

  return (
    <>
      <OfflineStatusDetector />
      <HomeScreen 
        userProfile={userProfile} 
        onLogout={handleLogout} 
        onProfileUpdate={handleProfileUpdate}
      />
    </>
  );
};

export default App;
