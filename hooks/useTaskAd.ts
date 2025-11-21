
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTaskAdOptions {
    onReward: (data: { taskId: number; points: number }) => void;
    onError: (error: any) => void;
}

export const useTaskAd = ({ onReward, onError }: UseTaskAdOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdActive, setIsAdActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAdActiveRef = useRef(false);
    const timeLeftRef = useRef(0);
    const hasLeftAppRef = useRef(false);
    const currentTaskIdRef = useRef<number | null>(null);

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
                // This enforces staying on the ad/page for the duration
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

    const showTaskAd = useCallback(async (taskId: number, points: number, duration: number, type: 'Interstitial' | 'Pop') => {
        if (isLoading) return;
        
        setIsLoading(true);
        hasLeftAppRef.current = false;
        currentTaskIdRef.current = taskId;
        
        // Ensure SDK is available
        const showAdFn = (window as any).show_10206331;
        if (typeof showAdFn !== 'function') {
            setIsLoading(false);
            onError(new Error("Ad SDK not initialized."));
            return;
        }

        try {
            // 1. Trigger Ad based on type
            if (type === 'Interstitial') {
                console.log("Opening Interstitial Ad...");
                // Fire and forget the ad call, we rely on our own timer for the reward logic
                showAdFn().catch((err: any) => {
                    console.warn("Interstitial Ad failed/closed:", err);
                    // We continue with the timer even if ad fails or is closed, 
                    // to match the behavior of "Requires X seconds"
                });
            } else {
                // Pop Ad Logic
                const trackingId = `task-${taskId}-${Date.now()}`;
                console.log(`Opening ${type} Ad (Pop mode)...`);
                await showAdFn({ 
                    type: 'pop', 
                    ymid: trackingId 
                });
            }

            // 2. Start Unified Timer Logic
            setIsAdActive(true);
            isAdActiveRef.current = true;
            setTimeLeft(duration);
            timeLeftRef.current = duration;
            setIsLoading(false);

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
                    // Success Logic
                    clearAllTimers();
                    setIsAdActive(false);
                    isAdActiveRef.current = false;
                    currentTaskIdRef.current = null;
                    
                    onReward({ taskId, points });
                    resolve();
                }, duration * 1000);
            });

        } catch (error) {
            console.error("Ad error:", error);
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            currentTaskIdRef.current = null;
            setIsLoading(false);
            onError(error);
        }
    }, [isLoading, onReward, onError, clearAllTimers]);

    const cancelAd = useCallback((isSystemCancellation = false) => {
        if (isAdActiveRef.current) {
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            currentTaskIdRef.current = null;
            setIsLoading(false);
            
            const msg = isSystemCancellation 
                ? "Verification Failed: You must wait for the timer to finish." 
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
