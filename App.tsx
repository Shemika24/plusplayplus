
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import OfflineStatusDetector from './components/OfflineStatusDetector';
import { onAuthStateChangedListener, signOutUser } from './services/authService';
import { getUserProfile } from './services/firestoreService';
import { User } from 'firebase/auth';
import { UserProfile } from './types';
import { applyTheme } from './utils/themes';

const App: React.FC = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSplashTimeOver, setIsSplashTimeOver] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashTimeOver(true);
    }, 6000); // Minimum 6 seconds splash screen

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await getUserProfile(user);
        setUserProfile(profile);
        if (profile?.theme) {
            applyTheme(profile.theme);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        applyTheme('light'); // Default to light on logout
      }
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOutUser();
  };
  
  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setUserProfile(prev => {
        if (!prev) return null;
        const newProfile = { ...prev, ...updatedData };
        if (updatedData.theme) {
            applyTheme(updatedData.theme);
        }
        return newProfile;
    });
  };

  const showSplashScreen = isAuthLoading || !isSplashTimeOver;

  return (
    <>
      <OfflineStatusDetector />
      {showSplashScreen ? (
        <SplashScreen />
      ) : !currentUser || !userProfile ? (
        <AuthScreen />
      ) : (
        <HomeScreen userProfile={userProfile} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
      )}
    </>
  );
};

export default App;
