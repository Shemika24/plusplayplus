
import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import HomeScreen from './components/HomeScreen';
import AuthScreen from './screens/AuthScreen';
import OfflineStatusDetector from './components/OfflineStatusDetector';
import { onAuthStateChangedListener, signOutUser } from './services/authService';
import { getUserProfile } from './services/firestoreService';
import { User } from 'firebase/auth';
import { UserProfile } from './types';

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
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOutUser();
  };
  
  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    setUserProfile(prev => prev ? { ...prev, ...updatedData } : null);
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