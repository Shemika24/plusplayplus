
import React, { useState, useEffect, useCallback } from 'react';
import { Screen, Task, UserProfile } from '../types';
import { getDailyTaskState, completeTask as completeTaskInService } from '../services/firestoreService';
import { useTaskAd } from '../hooks/useTaskAd';
import { playSound, vibrate, SOUNDS } from '../utils/sound';

interface TasksScreenProps {
  onNavigate: (screen: Screen) => void;
  onEarnPoints: (points: number, title: string, icon: string, iconColor: string) => void;
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
    <div className="bg-white rounded-xl shadow-md flex items-center p-2.5 border border-gray-200 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-gray-200 mr-3 flex-shrink-0"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-8 w-24 rounded-full bg-gray-200 ml-2 flex-shrink-0"></div>
    </div>
);

const TaskItemCard: React.FC<{ task: ShuffledTask; onStart: (task: ShuffledTask) => void; isActive: boolean; disabled: boolean; }> = ({ task, onStart, isActive, disabled }) => (
    <div className="bg-white rounded-xl shadow-md flex items-center p-2.5 border border-gray-200">
        <div className={`w-10 h-10 rounded-lg ${task.categoryIconBgColor} flex items-center justify-center mr-3 flex-shrink-0`}>
            <i className={`${task.categoryIcon} ${task.categoryIconColor} text-xl`}></i>
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-sm text-[var(--dark)]">{task.title}</h4>
            <div className="flex items-center text-xs text-[var(--primary)] font-semibold mt-1">
                <i className="fa-regular fa-clock mr-1"></i>
                <span>{task.duration}s</span>
                <span className="mx-1.5 text-gray-300">|</span>
                <span className="text-green-500 font-bold">+{task.points} points</span>
            </div>
        </div>
        <button
            onClick={() => onStart(task)}
            disabled={disabled}
            className={`font-bold h-8 w-24 rounded-full shadow-md text-sm ml-2 flex-shrink-0 transition-all duration-300 flex items-center justify-center
                ${disabled
                    ? 'bg-gray-400 text-white cursor-wait'
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
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[110] animate-fadeIn">
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xs w-11/12 relative animate-slideInUp text-center">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4 border-4 border-green-200">
                <i className="fa-solid fa-check-circle text-green-500 text-4xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[var(--dark)] mb-2">Task Complete!</h3>
            <p className="text-[var(--gray)]">
                You earned <span className="font-bold text-[var(--success)]">{points}</span> points!
            </p>
        </div>
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
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <i className="fa-solid fa-mug-hot text-5xl text-sky-500 mb-4"></i>
            <h3 className="text-2xl font-bold text-[var(--dark)]">Time for a break!</h3>
            <p className="text-gray-600 mt-2">
                Great job! Your next set of tasks will be available in:
            </p>
            <p className="font-mono text-4xl font-bold text-[var(--dark)] my-4 bg-sky-100 p-3 rounded-lg tracking-wider">
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

    // --- Hook Integration ---
    const handleTaskSuccess = useCallback(async ({ taskId, points }: { taskId: number; points: number }) => {
        if (!dailyState) return;

        const completedTask = dailyState.tasks.find(t => t.id === taskId);
        if (!completedTask) return;

        try {
            // Trigger Reward Sound & Vibration
            playSound(SOUNDS.SUCCESS, 0.8);
            vibrate([100, 50, 100]);

            // Optimistic UI Update
            onEarnPoints(points, completedTask.title, completedTask.categoryIcon, completedTask.categoryIconColor);
            setSuccessInfo({ points });
            setTimeout(() => setSuccessInfo(null), 1000);
            
            setDailyState(prevState => {
                if (!prevState) return null;
                return {
                    ...prevState,
                    tasks: prevState.tasks.filter(t => t.id !== taskId),
                    completedToday: prevState.completedToday + 1,
                    availableInBatch: Math.max(0, prevState.availableInBatch - 1),
                };
            });

            // Backend Sync
            await completeTaskInService(userProfile.uid, taskId);
            
            // Silent refresh to ensure sync
            const latestState = await getDailyTaskState(userProfile.uid);
            setDailyState(latestState);

        } catch (error: any) {
            console.error("Sync error:", error);
            setErrorMessage("Error saving progress. Refreshing...");
            await fetchAndProcessTasks();
        } finally {
            setActiveTaskId(null);
        }
    }, [dailyState, userProfile.uid, onEarnPoints, fetchAndProcessTasks]);

    const { showTaskAd, cancelAd, isAdActive, timeLeft, isLoading: isAdLoading } = useTaskAd({
        onReward: handleTaskSuccess,
        onError: (err) => {
            console.error("Ad failed:", err);
            setErrorMessage(err.message || "Task failed. Please try again.");
            setTimeout(() => setErrorMessage(null), 3000);
            setActiveTaskId(null);
        }
    });

    const handleStartTask = async (task: ShuffledTask) => {
        if (activeTaskId !== null || isAdActive || isAdLoading) return;
        
        setActiveTaskId(task.id);
        setErrorMessage(null);

        // Determine type based on icon
        // fa-rectangle-ad = Interstitial (Strict, Telegram Required, Preload)
        // fa-window-restore = Pop (Simple, No Strict Check)
        const isInterstitial = task.categoryIcon.includes('fa-rectangle-ad');
        const type = isInterstitial ? 'Interstitial' : 'Pop';

        // Interstitial enforces 15s
        // Pop uses task duration (variable)
        const duration = isInterstitial ? 15 : task.duration;

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
        
        // All tasks for the day are done
        return (
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <i className="fa-solid fa-party-horn text-5xl text-green-500 mb-4"></i>
                <h3 className="text-2xl font-bold text-[var(--dark)]">All Done!</h3>
                <p className="text-gray-600 mt-2">
                    You've completed all available tasks for today. Come back tomorrow for more!
                </p>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 pb-24 text-[var(--dark)] min-h-full relative">
            {/* Success Modal */}
            {successInfo && <SuccessModal points={successInfo.points} />}
            
            {/* Error Toast */}
            {errorMessage && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[120] w-11/12 max-w-md bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg animate-slideInUp flex items-center">
                    <i className="fa-solid fa-triangle-exclamation mr-3 text-xl"></i>
                    <span className="text-sm font-medium">{errorMessage}</span>
                </div>
            )}

            {/* Ad Overlay */}
            {isAdActive && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 animate-fadeIn">
                    <div className="w-20 h-20 mb-6 relative flex items-center justify-center">
                        <svg className="animate-spin h-full w-full text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="absolute font-bold text-2xl text-[var(--dark)]">{timeLeft}</span>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-[var(--dark)] mb-2">Checking Ad...</h2>
                    <p className="text-center text-gray-600 mb-8 max-w-xs">
                        Please verify the ad content. Do not close the window until the timer finishes.
                    </p>

                    <div className="w-full max-w-xs bg-gray-200 rounded-full h-3 mb-8">
                        <div 
                            className="bg-[var(--primary)] h-3 rounded-full transition-all duration-1000 linear" 
                            style={{ width: `${timeLeft > 0 ? 100 : 0}%`, transitionDuration: `${timeLeft}s` }}
                        ></div>
                        {/* Note: CSS transition for width might need exact calculation logic for smooth bar, but simplified here */}
                    </div>

                    <button 
                        onClick={() => cancelAd(false)}
                        className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold hover:bg-red-50 hover:text-red-500 transition-colors flex items-center"
                    >
                        <i className="fa-solid fa-xmark mr-2"></i>
                        Cancel Task
                    </button>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
                @keyframes slideInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                .animate-slideInUp { animation: slideInUp 0.3s ease-out forwards; }
            `}</style>
            
            <div className="bg-white rounded-xl shadow-lg p-4 mb-3 border-l-4 border-[var(--primary)]">
                <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-4">
                        <i className="fa-solid fa-list-check text-[var(--primary)] text-3xl"></i>
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-[var(--dark)]">Tasks</h3>
                        <div className="flex items-center text-sm text-[var(--gray)] space-x-4 mt-1">
                            <span>Completed: <span className="font-bold text-[var(--dark)]">{dailyState?.completedToday || 0}</span></span>
                            <span>Tasks for today: <span className="font-bold text-[var(--dark)]">{dailyState?.totalForDay || 0}</span></span>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('TaskHistory')} className="text-[var(--gray)] hover:text-[var(--dark)] transition-colors text-2xl">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                    </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-3 mb-6 text-center">
                <p className="font-bold text-md text-[var(--dark)]">
                    Available Tasks: <span className="text-[var(--primary)]">{dailyState?.availableInBatch || 0}</span>
                </p>
            </div>
            
            {renderContent()}
        </div>
    );
};

export default TasksScreen;
