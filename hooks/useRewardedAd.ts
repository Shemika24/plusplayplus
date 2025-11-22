
import { useState, useCallback, useRef, useEffect } from 'react';

// Define global types for the external script
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
            console.warn('Preload failed:', error instanceof Error ? error.message : String(error));
        } finally {
            setIsPreloading(false);
        }
    }, [generateTrackingId]);

    const showRewardedAd = useCallback(async (userId: string | null = null) => {
        if (isLoading) return;

        setIsLoading(true);
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
                console.warn("Interstitial Ad failed:", err instanceof Error ? err.message : String(err));
                setIsLoading(false);
                if (onError) onError(err);
            });
            return;
        }

        // Pop Logic
        const viewTime = Math.floor(Math.random() * (maxViewTimeSeconds - minViewTimeSeconds + 1)) + minViewTimeSeconds;

        try {
            console.log(`Opening pop ad popup, required view time: ${viewTime}s`);
            
            // Fire the ad call - we don't await strict completion to ensure timer starts immediately
            window.show_10206331({ 
                type: 'pop', 
                ymid: trackingId 
            }).catch(e => console.log("Ad window likely blocked or closed", e));

            // Ad opened successfully (or process started)
            setIsAdActive(true);
            isAdActiveRef.current = true;
            
            setTimeLeft(viewTime);
            
            setIsLoading(false); 

            // Start Robust Countdown (Date-based for background accuracy)
            const startTime = Date.now();
            const endTime = startTime + (viewTime * 1000);

            return new Promise<void>((resolve, reject) => {
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
                        resolve();
                    }
                }, 200); // Check frequently, but rely on Date.now() for accuracy
            });

        } catch (error) {
            console.error('Ad process error:', error instanceof Error ? error.message : String(error));
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
    };
};
