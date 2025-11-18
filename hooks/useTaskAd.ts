
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTaskAdOptions {
    onReward: (data: { taskId: number; points: number }) => void;
    onError: (error: any) => void;
}

export const useTaskAd = ({ onReward, onError }: UseTaskAdOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdActive, setIsAdActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [activeTaskInfo, setActiveTaskInfo] = useState<{ id: number; points: number } | null>(null);
    
    const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAdActiveRef = useRef(false);
    const timeLeftRef = useRef(0);
    const hasLeftAppRef = useRef(false);

    // Cleanup
    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    // Visibility Detection (Anti-cheat)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isAdActiveRef.current) {
                hasLeftAppRef.current = true;
            }
            if (!document.hidden && isAdActiveRef.current) {
                // If user returns and time is still > 1s, cancel
                if (timeLeftRef.current > 1) {
                    console.log('User returned too early.');
                    cancelAd(true);
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
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

    const showTaskAd = useCallback(async (taskId: number, points: number, duration: number, type: 'Interstitial' | 'Pop') => {
        if (isLoading) return;
        
        // CORRECTED LOGIC:
        // Interstitial Ads: Strict, require Telegram, use Preloading (Advanced Flow).
        // Pop Ads: Simple, Web-compatible, no strict environment check (Simple Flow).
        
        if (type === 'Interstitial' && !isTelegramWebView()) {
            onError(new Error("Interstitial Tasks must be performed inside the Telegram App for verification."));
            return;
        }

        setIsLoading(true);
        hasLeftAppRef.current = false;
        setActiveTaskInfo({ id: taskId, points });
        
        // Use duration passed from task
        const viewTime = duration;

        try {
             if (typeof window.show_10206331 !== 'function') {
                throw new Error("Ad SDK not initialized.");
            }

            // Generate tracking ID
            const trackingId = `task-${taskId}-${Date.now()}`;

            // Preload Logic (Now applied to Interstitial as the 'Advanced' type)
            if (type === 'Interstitial') {
                 try {
                    console.log("Preloading Interstitial Ad...");
                    await window.show_10206331({ type: 'preload', ymid: trackingId });
                 } catch (e) {
                     console.warn("Preload step failed, continuing...", e);
                 }
            }

            // Show Ad
            console.log(`Opening ${type} Ad...`);
            await window.show_10206331({ 
                type: 'pop', // SDK usually uses 'pop' entry point for both, or assumes based on config
                ymid: trackingId 
            });

            // Ad Opened
            setIsAdActive(true);
            isAdActiveRef.current = true;
            setTimeLeft(viewTime);
            timeLeftRef.current = viewTime;
            setIsLoading(false);

            // Start Timers
            return new Promise<void>((resolve) => {
                countdownRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        const newVal = prev - 1;
                        timeLeftRef.current = newVal;
                        if (newVal <= 0) {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            return 0;
                        }
                        return newVal;
                    });
                }, 1000);

                viewTimerRef.current = setTimeout(() => {
                    // Success
                    const completedTaskId = taskId; 
                    const completedPoints = points;
                    
                    clearAllTimers();
                    setIsAdActive(false);
                    isAdActiveRef.current = false;
                    
                    onReward({ taskId: completedTaskId, points: completedPoints });
                    resolve();
                }, viewTime * 1000);
            });

        } catch (error) {
            console.error("Ad error:", error);
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            setIsLoading(false);
            onError(error);
        }
    }, [isLoading, isTelegramWebView, onReward, onError, clearAllTimers]);

    const cancelAd = useCallback((isSystemCancellation = false) => {
        if (isAdActiveRef.current) {
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            setIsLoading(false);
            
            const msg = isSystemCancellation 
                ? "Verification Failed: You closed the ad window too early." 
                : "Task cancelled.";
            onError(new Error(msg));
        }
    }, [clearAllTimers, onError]);

    return {
        showTaskAd,
        cancelAd,
        isLoading,
        isAdActive,
        timeLeft
    };
};
