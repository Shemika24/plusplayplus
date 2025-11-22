
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, Task, UserProfile, TaskHistory } from '../types';
import { getDailyTaskState, completeTask as completeTaskInService } from '../services/firestoreService';
import { useTaskAd } from '../hooks/useTaskAd';
import { playSound, vibrate, SOUNDS } from '../utils/sound';
import InPageBanner from '../components/InPageBanner';

interface TasksScreenProps {
  onNavigate: (screen: Screen) => void;
  onEarnPoints: (points: number, title: string, icon: string, iconColor: string, skipDbSave?: boolean) => void;
  userProfile: UserProfile;
}

interface ShuffledTask extends Task {
    categoryIcon: string;
    categoryIconBgColor: string;
    categoryIconColor: string;
}

interface DailyTaskState {
    tasks: ShuffledTask[];
    isOnBreak: boolean;
    breakEndTime: Date | null;
    completedToday: number;
    totalForDay: number;
    availableInBatch: number;
}

// --- Sub-Components ---
const SkeletonTaskItemCard: React.FC = () => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-md flex items-center p-2.5 border border-[var(--border-color)] animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-input)] mr-3 flex-shrink-0"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-[var(--bg-input)] rounded w-3/4"></div>
            <div className="h-3 bg-[var(--bg-input)] rounded w-1/2"></div>
        </div>
        <div className="h-8 w-24 rounded-full bg-[var(--bg-input)] ml-2 flex-shrink-0"></div>
    </div>
);

const TaskItemCard: React.FC<{ task: ShuffledTask; onStart: (task: ShuffledTask) => void; isActive: boolean; disabled: boolean; }> = ({ task, onStart, isActive, disabled }) => (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-md flex items-center p-2.5 border border-[var(--border-color)] hover:border-[var(--primary)] transition-colors">
        <div className={`w-10 h-10 rounded-lg bg-[var(--bg-input)] flex items-center justify-center mr-3 flex-shrink-0`}>
            <i className={`${task.categoryIcon} ${task.categoryIconColor} text-xl`}></i>
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-sm text-[var(--dark)]">{task.title}</h4>
            <div className="flex items-center text-xs text-[var(--primary)] font-semibold mt-1">
                <i className="fa-regular fa-clock mr-1"></i>
                <span>{task.duration}s</span>
                <span className="mx-1.5 text-[var(--gray)]">|</span>
                <span className="text-green-500 font-bold">+{task.points} points</span>
            </div>
        </div>
        <button
            onClick={() => onStart(task)}
            disabled={disabled}
            className={`font-bold h-8 w-24 rounded-full shadow-md text-sm ml-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center
                ${disabled
                    ? 'bg-[var(--bg-input)] text-[var(--gray)] cursor-wait'
                    : 'bg-gradient-to-r from-amber-600 to-yellow-400 text-white transform hover:scale-105'
                }`}
        >
            {isActive ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    <span>Wait</span>
                </>
            ) : (
                'Start'
            )}
        </button>
    </div>
);

const SuccessModal: React.FC<{ points: number }> = ({ points }) => (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110]">
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative text-center animate-fadeIn border border-[var(--border-color)]">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                <i className="fa-solid fa-check-circle text-green-500 text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Task Complete!</h3>
            <p className="text-[var(--gray)]">
                You earned <span className="font-bold text-[var(--success)]">{points}</span> points!
            </p>
        </div>
        <style>{`
            @keyframes fadeIn { from { opacity: 0; scale: 0.95; } to { opacity: 1; scale: 1; } }
            .animate-fadeIn { animation: fadeIn 0.15s ease-out forwards; }
        `}</style>
    </div>
);

const BreakTimer: React.FC<{ endTime: Date; onBreakEnd: () => void }> = ({ endTime, onBreakEnd }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = endTime.getTime() - now.getTime();

            if (difference <= 0) {
                setTimeLeft('00:00:00');
                onBreakEnd();
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);
            const pad = (num: number) => num.toString().padStart(2, '0');
            setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [endTime, onBreakEnd]);

    return (
        <div className="text-center p-6 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)]">
            <i className="fa-solid fa-mug-hot text-5xl text-sky-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-[var(--dark)]">Time for a break!</h3>
            <p className="text-[var(--gray)] mt-2">
                Great job! Your next set of tasks will be available in:
            </p>
            <p className="font-mono text-4xl font-bold text-[var(--dark)] my-4 bg-[var(--bg-input)] p-3 rounded-lg tracking-wider inline-block">
                {timeLeft}
            </p>
        </div>
    );
};


const TasksScreen: React.FC<TasksScreenProps> = ({ onNavigate, onEarnPoints, userProfile }) => {
    const [dailyState, setDailyState] = useState<DailyTaskState | null>(null);
    const [isLoadingState, setIsLoadingState] = useState(true);
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [successInfo, setSuccessInfo] = useState<{ points: number } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    const fetchAndProcessTasks = useCallback(async () => {
        setIsLoadingState(true);
        try {
            const state = await getDailyTaskState(userProfile.uid);
            setDailyState(state);
        } catch (error) {
            console.error("Failed to fetch task state:", error);
        } finally {
            setIsLoadingState(false);
        }
    }, [userProfile.uid]);

    useEffect(() => {
        fetchAndProcessTasks();
    }, [fetchAndProcessTasks]);

    const handleTaskSuccess = useCallback(async ({ taskId, points }: { taskId: number; points: number }) => {
        if (!dailyState) return;
        
        // --- CRITICAL UPDATE: Immediate Feedback & Removal ---
        // 1. Play sound/vibrate immediately
        playSound(SOUNDS.SUCCESS, 1.0);
        vibrate(500); // Single strong vibration for completion

        // 2. Optimistic UI Update: Remove task INSTANTLY from the list
        // Capture task details for history before removing
        const completedTask = dailyState.tasks.find(t => t.id === taskId);
        
        setDailyState(prev => {
             if (!prev) return null;
             const updatedTasks = prev.tasks.filter(t => t.id !== taskId);
             return {
                 ...prev,
                 tasks: updatedTasks,
                 completedToday: prev.completedToday + 1,
             };
        });

        setActiveTaskId(null);

        if (!completedTask) return;

        try {
            // 3. Async Database Operations
            // Create history item object to pass to service
            const historyItem: Omit<TaskHistory, 'id' | 'timestamp'> = {
                reward: points,
                title: completedTask.title,
                icon: completedTask.categoryIcon,
                iconColor: completedTask.categoryIconColor,
                date: new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" }),
            };

            await completeTaskInService(userProfile.uid, taskId, points, historyItem);
            
            // 4. Update User Points Locally (skip DB save in onEarnPoints since we did it above)
            onEarnPoints(points, completedTask.title, completedTask.categoryIcon, completedTask.categoryIconColor, true);
            
            // 5. Show Reward Modal
            setSuccessInfo({ points });
            setTimeout(() => setSuccessInfo(null), 3000);
            
            // 6. Fetch latest state to ensure sync (silently update state to catch any server-side changes like breaks)
            const latestState = await getDailyTaskState(userProfile.uid);
            setDailyState(latestState);

        } catch (error: any) {
            console.error("Sync error:", error);
            setErrorMessage("Network error. Points were not saved. Please try again.");
            setTimeout(() => setErrorMessage(null), 4000);
        }
    }, [dailyState, userProfile.uid, onEarnPoints]);

    const { showTaskAd, cancelAd, isAdActive, timeLeft, isLoading: isAdLoading } = useTaskAd({
        onReward: handleTaskSuccess,
        onError: (err) => {
            console.error("Ad failed:", err instanceof Error ? err.message : String(err));
            setErrorMessage(err.message || "Task failed. Please try again.");
            setTimeout(() => setErrorMessage(null), 3000);
            setActiveTaskId(null);
        }
    });

    const handleStartTask = async (task: ShuffledTask) => {
        if (activeTaskId !== null || isAdActive || isAdLoading) return;
        
        setActiveTaskId(task.id);
        setErrorMessage(null);

        const isInterstitial = task.categoryIcon.includes('fa-rectangle-ad');
        const type = isInterstitial ? 'Interstitial' : 'Pop';
        
        const duration = isInterstitial ? 16 : task.duration + 1;
        
        showTaskAd(task.id, task.points, duration, type);
    };
    
    const progressPercentage = dailyState && dailyState.totalForDay > 0 
        ? (dailyState.completedToday / dailyState.totalForDay) * 100 : 0;

    const renderContent = () => {
        if (isLoadingState) {
            return (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <SkeletonTaskItemCard key={i} />)}
                </div>
            );
        }

        if (dailyState?.isOnBreak && dailyState.breakEndTime) {
            return <BreakTimer endTime={dailyState.breakEndTime} onBreakEnd={fetchAndProcessTasks} />;
        }

        if (dailyState && dailyState.tasks.length > 0) {
             return (
                 <div className="space-y-3">
                    {dailyState.tasks.map(task => (
                        <TaskItemCard
                            key={task.id}
                            task={task}
                            onStart={handleStartTask}
                            isActive={activeTaskId === task.id}
                            disabled={activeTaskId !== null && activeTaskId !== task.id}
                        />
                    ))}
                </div>
             );
        }
        
        return (
            <div className="text-center p-6 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)]">
                <i className="fa-solid fa-party-horn text-5xl text-green-500 mb-4"></i>
                <h3 className="text-2xl font-bold text-[var(--dark)]">All Done!</h3>
                <p className="text-[var(--gray)] mt-2">
                    You've completed all available tasks for today. Come back tomorrow for more!
                </p>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 pb-24 text-[var(--dark)] min-h-full relative">
            {successInfo && <SuccessModal points={successInfo.points} />}
            
            {errorMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[120] w-11/12 max-w-md bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slideInUp flex items-center">
                    <i className="fa-solid fa-triangle-exclamation mr-3 text-xl"></i>
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}

            {(isAdActive || isAdLoading) && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fadeIn select-none">
                    <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <svg className="animate-spin h-full w-full text-white/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isAdActive && <span className="absolute font-bold text-2xl text-white">{timeLeft}</span>}
                    </div>
                    
                    <p className="text-white/90 font-medium text-lg animate-pulse">
                        {isAdLoading ? "Opening..." : "Verifying..."}
                    </p>

                    <button 
                        onClick={() => cancelAd(false)}
                        className="mt-12 px-6 py-2 rounded-full border border-white/20 text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm"
                    >
                        Cancel
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
                @keyframes slideInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                .animate-slideInUp { animation: slideInUp 0.3s ease-out forwards; }
            `}</style>
            
            <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-4 mb-6 border-l-4 border-[var(--primary)] transition-colors">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-lg text-[var(--dark)]">Tasks</h3>
                     <button onClick={() => onNavigate('TaskHistory')} className="text-[var(--gray)] hover:text-[var(--dark)] transition-colors">
                        <i className="fa-solid fa-clock-rotate-left text-xl"></i>
                    </button>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                            <i className="fa-solid fa-list-check text-[var(--primary)] text-3xl"></i>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--gray)]">Completed</p>
                            <p className="font-bold text-2xl text-[var(--dark)]">{dailyState?.completedToday || 0}</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                         <div className="text-sm text-[var(--gray)] mb-1">
                            Daily: <span className="font-bold text-[var(--dark)]">{dailyState?.totalForDay || 0}</span>
                         </div>
                         <div className="text-sm text-[var(--gray)]">
                            Available: <span className="font-bold text-[var(--primary)]">{dailyState?.availableInBatch || 0}</span>
                         </div>
                    </div>
                </div>
                <div className="w-full bg-[var(--bg-input)] rounded-full h-2.5">
                    <div className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            {/* IN-PAGE BANNER AD */}
            <InPageBanner />

            {renderContent()}
        </div>
    );
};

export default TasksScreen;
