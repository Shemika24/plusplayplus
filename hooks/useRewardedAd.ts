
import { useState, useCallback, useRef, useEffect } from 'react';

// Define global types for the external script and Telegram
declare global {
    interface Window {
        show_10206331?: (options?: { type?: string; ymid?: string }) => Promise<void>;
    }
}

interface UseRewardedAdOptions {
    minViewTimeSeconds?: number;
    maxViewTimeSeconds?: number;
    onReward: (data: { trackingId: string; viewTime: number }) => void;
    onError?: (error: any) => void;
    adType?: 'Interstitial' | 'Pop';
}

export const useRewardedAd = ({ 
    minViewTimeSeconds = 20, 
    maxViewTimeSeconds = 30,
    onReward, 
    onError,
    adType = 'Pop' 
}: UseRewardedAdOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPreloading, setIsPreloading] = useState(false);
    const [isAdActive, setIsAdActive] = useState(false); // popupOpened
    const [timeLeft, setTimeLeft] = useState(0);
    
    const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAdActiveRef = useRef(false); // Ref to track active state inside event listeners
    const timeLeftRef = useRef(0); // Ref to track time inside event listeners
    const preloadedAdRef = useRef(false);
    const hasLeftAppRef = useRef(false); // Track if the user actually left the app

    // Cleanup timers on unmount
    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    // --- VISIBILITY DETECTION LOGIC ---
    useEffect(() => {
        const handleVisibilityChange = () => {
            // If the app becomes hidden (user went to ad), mark as left
            // This logic generally applies to Pop ads where we monitor active time
            if (document.hidden && isAdActiveRef.current) {
                hasLeftAppRef.current = true;
            }

            // If app becomes visible (user came back)
            if (!document.hidden && isAdActiveRef.current) {
                // If they came back and time is still remaining (with 1s buffer)
                if (timeLeftRef.current > 1) {
                    console.log('User returned too early. Ad verification failed.');
                    cancelAd(true); // true = isSystemCancellation
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clearAllTimers = useCallback(() => {
        if (viewTimerRef.current) {
            clearTimeout(viewTimerRef.current);
            viewTimerRef.current = null;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    const isTelegramWebView = useCallback(() => {
        return typeof window !== 'undefined' && 
               !!window.Telegram && 
               !!window.Telegram.WebApp &&
               window.Telegram.WebApp.platform !== 'unknown';
    }, []);

    const generateTrackingId = useCallback((userId: string | null = null) => {
        if (userId) return `user-${userId}-${Date.now()}`;
        const sessionId = sessionStorage.getItem('tg_session_id') || 
                         `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('tg_session_id', sessionId);
        return `${sessionId}-${Date.now()}`;
    }, []);

    const preloadAd = useCallback(async (userId: string | null = null) => {
        if (preloadedAdRef.current) return;

        const trackingId = generateTrackingId(userId);
        
        if (typeof window.show_10206331 !== 'function') {
            console.warn("Monetag SDK not loaded.");
            return;
        }

        try {
            setIsPreloading(true);
            // Assuming the SDK supports 'preload' type as per request
            await window.show_10206331({ type: 'preload', ymid: trackingId });
            preloadedAdRef.current = true;
            console.log('Ad preloaded successfully');
        } catch (error) {
            console.warn('Preload failed:', error);
        } finally {
            setIsPreloading(false);
        }
    }, [generateTrackingId]);

    const showRewardedAd = useCallback(async (userId: string | null = null) => {
        if (isLoading) return;

        setIsLoading(true);
        hasLeftAppRef.current = false; // Reset exit tracking
        const trackingId = generateTrackingId(userId);
        
        if (typeof window.show_10206331 !== 'function') {
            setIsLoading(false);
            if (onError) onError(new Error("Ad SDK not ready."));
            return;
        }

        // Interstitial Logic
        if (adType === 'Interstitial') {
            console.log("Opening Interstitial Ad...");
            window.show_10206331().then(() => {
                setIsLoading(false);
                // For interstitials, we don't track specific view time in the same way
                onReward({ trackingId, viewTime: 0 });
            }).catch((err: any) => {
                console.warn("Interstitial Ad failed:", err);
                setIsLoading(false);
                if (onError) onError(err);
            });
            return;
        }

        // Pop Logic
        const viewTime = Math.floor(Math.random() * (maxViewTimeSeconds - minViewTimeSeconds + 1)) + minViewTimeSeconds;

        try {
            console.log(`Opening pop ad popup, required view time: ${viewTime}s`);
            
            await window.show_10206331({ 
                type: 'pop', 
                ymid: trackingId 
            });

            // Ad opened successfully
            setIsAdActive(true);
            isAdActiveRef.current = true;
            
            setTimeLeft(viewTime);
            timeLeftRef.current = viewTime;
            
            setIsLoading(false); // Stop loading spinner, show countdown overlay

            // Start Countdown
            return new Promise<void>((resolve, reject) => {
                countdownRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        const newVal = prev - 1;
                        timeLeftRef.current = newVal; // Sync ref for event listener

                        if (newVal <= 0) {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            return 0;
                        }
                        return newVal;
                    });
                }, 1000);

                viewTimerRef.current = setTimeout(() => {
                    // Success!
                    clearAllTimers();
                    setIsAdActive(false);
                    isAdActiveRef.current = false;
                    preloadedAdRef.current = false; // Reset preload state
                    onReward({ trackingId, viewTime });
                    resolve();
                }, viewTime * 1000);
            });

        } catch (error) {
            console.error('Ad process error:', error);
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            setIsLoading(false);
            if (onError) onError(error);
        }
    }, [isLoading, maxViewTimeSeconds, minViewTimeSeconds, generateTrackingId, onReward, onError, clearAllTimers, adType]);

    const cancelAd = useCallback((isSystemCancellation = false) => {
        if (isAdActiveRef.current) {
            console.log('Ad view cancelled');
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            
            if (onError) {
                if (isSystemCancellation) {
                    onError(new Error("Verification Failed: Ad window was closed or minimized before time expired."));
                } else {
                    onError(new Error("View cancelled by user"));
                }
            }
        }
    }, [clearAllTimers, onError]);

    return {
        showRewardedAd,
        cancelAd,
        preloadAd,
        isLoading,
        isPreloading,
        isAdActive,
        timeLeft,
        isTelegramWebView: isTelegramWebView()
    };
};
