
import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTaskAdOptions {
    onReward: (data: { taskId: number; points: number }) => void;
    onError: (error: any) => void;
}

export const useTaskAd = ({ onReward, onError }: UseTaskAdOptions) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdActive, setIsAdActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isAdActiveRef = useRef(false);
    const currentTaskIdRef = useRef<number | null>(null);

    // Cleanup
    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    const clearAllTimers = useCallback(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
    }, []);

    const showTaskAd = useCallback(async (taskId: number, points: number, duration: number, type: 'Interstitial' | 'Pop') => {
        if (isLoading) return;
        
        setIsLoading(true);
        currentTaskIdRef.current = taskId;
        
        const showAdFn = (window as any).show_10206331;
        if (typeof showAdFn !== 'function') {
            setIsLoading(false);
            onError(new Error("Ad SDK not initialized."));
            return;
        }

        // 1. Start Unified Timer Logic (Robust Date-based) FIRST
        // This ensures the task can be completed even if the ad script throws a verification error
        setIsAdActive(true);
        isAdActiveRef.current = true;
        setTimeLeft(duration);
        setIsLoading(false);

        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);

        if (countdownRef.current) clearInterval(countdownRef.current);

        countdownRef.current = setInterval(() => {
            const now = Date.now();
            const remainingMs = endTime - now;
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            
            if (remainingSeconds <= 0) {
                // Success Logic
                if (countdownRef.current) clearInterval(countdownRef.current);
                setTimeLeft(0);
                
                clearAllTimers();
                setIsAdActive(false);
                isAdActiveRef.current = false;
                currentTaskIdRef.current = null;
                
                onReward({ taskId, points });
            } else {
                setTimeLeft(remainingSeconds);
            }
        }, 200);

        // 2. Attempt to Show Ad (Swallow errors to prevent breaking the flow)
        try {
            if (type === 'Interstitial') {
                console.log("Opening Interstitial Ad...");
                showAdFn().catch((err: any) => {
                    console.warn("Interstitial suppressed:", err instanceof Error ? err.message : String(err));
                });
            } else {
                const trackingId = `task-${taskId}-${Date.now()}`;
                console.log(`Opening ${type} Ad (Pop mode)...`);
                showAdFn({ 
                    type: 'pop', 
                    ymid: trackingId 
                }).catch((err: any) => {
                    console.warn("Pop verification warning suppressed:", err instanceof Error ? err.message : String(err));
                });
            }
        } catch (error) {
            // Catch synchronous errors from the SDK
            console.warn("Ad sync error suppressed:", error);
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
                ? "Verification Failed: Ad window was closed or minimized before time expired." 
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
