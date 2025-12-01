
import { useState, useCallback, useRef, useEffect } from 'react';

declare global {
    interface Window {
        show_10206331: (tag?: string) => Promise<void>;
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
    const isAdActiveRef = useRef(false); 
    const preloadedAdRef = useRef(false);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => clearAllTimers();
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

    const generateTrackingId = useCallback((userId: string | null = null) => {
        if (userId) return `user-${userId}-${Date.now()}`;
        const sessionId = sessionStorage.getItem('session_id') || 
                         `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('session_id', sessionId);
        return `${sessionId}-${Date.now()}`;
    }, []);

    const preloadAd = useCallback(async (userId: string | null = null) => {
        // Mock preload - always succeeds immediately
        if (preloadedAdRef.current) return;
        setIsPreloading(true);
        setTimeout(() => {
            preloadedAdRef.current = true;
            setIsPreloading(false);
        }, 500);
    }, []);

    const showRewardedAd = useCallback(async (userId: string | null = null) => {
        if (isLoading) return;

        setIsLoading(true);
        const trackingId = generateTrackingId(userId);

        // 1. Attempt to show real Ad via SDK
        if (typeof window.show_10206331 === 'function') {
            try {
                // Pass 'pop' argument if adType is Pop, otherwise call without args for Interstitial
                if (adType === 'Pop') {
                    await window.show_10206331('pop');
                } else {
                    await window.show_10206331();
                }
                
                console.log(`Ad SDK called: ${adType}`);
            } catch (e) {
                // Fix for circular JSON error
                const errorMessage = e instanceof Error ? e.message : String(e);
                console.warn("Ad SDK failed/closed, falling back to timer logic.", errorMessage);
                // Fallback to timer logic below
            }
        }
        
        // 2. Timer Logic (Used for UX duration enforcement or fallback)
        setTimeout(() => {
            // Determine duration
            const viewTime = Math.floor(Math.random() * (maxViewTimeSeconds - minViewTimeSeconds + 1)) + minViewTimeSeconds;

            try {
                console.log(`Starting ad timer: ${viewTime}s`);

                // Task "opened"
                setIsAdActive(true);
                isAdActiveRef.current = true;
                
                setTimeLeft(viewTime);
                setIsLoading(false); 

                // Start Countdown
                const startTime = Date.now();
                const endTime = startTime + (viewTime * 1000);

                // Clear any existing interval
                if (countdownRef.current) clearInterval(countdownRef.current);

                countdownRef.current = setInterval(() => {
                    const now = Date.now();
                    const remainingMs = endTime - now;
                    const remainingSeconds = Math.ceil(remainingMs / 1000);

                    setTimeLeft(remainingSeconds > 0 ? remainingSeconds : 0);

                    if (remainingMs <= 0) {
                        // Timer Finished
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        
                        // Success!
                        setIsAdActive(false);
                        isAdActiveRef.current = false;
                        preloadedAdRef.current = false; // Reset preload state
                        onReward({ trackingId, viewTime });
                    }
                }, 200); 

            } catch (error) {
                // Fix for circular JSON error
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Task process error:', errorMessage);
                
                clearAllTimers();
                setIsAdActive(false);
                isAdActiveRef.current = false;
                setIsLoading(false);
                if (onError) onError(new Error(errorMessage));
            }
        }, 500); // Small delay to simulate processing

    }, [isLoading, maxViewTimeSeconds, minViewTimeSeconds, generateTrackingId, onReward, onError, clearAllTimers, adType]);

    const cancelAd = useCallback((isSystemCancellation = false) => {
        if (isAdActiveRef.current) {
            console.log('Task cancelled');
            clearAllTimers();
            setIsAdActive(false);
            isAdActiveRef.current = false;
            setIsLoading(false);
            
            if (onError) {
                 onError(new Error("Task cancelled by user"));
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
    };
};
