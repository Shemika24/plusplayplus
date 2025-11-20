
import { UserProfile, TaskHistory, Withdrawal, Task, RankedUser, Notification } from '../types';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    Timestamp, 
    increment, 
    serverTimestamp, 
    runTransaction,
    writeBatch,
    startAfter,
    deleteDoc,
    QueryDocumentSnapshot,
    DocumentData
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from '../firebase';

// This is the structure of the task object that will be used throughout the new system.
// It includes UI details from the original TaskCategory.
interface UiTask extends Task {
    categoryIcon: string;
    categoryIconBgColor: string;
    categoryIconColor: string;
}

// This is the structure of the daily state document stored in Firestore for each user.
interface UserDailyState {
    lastUpdated: Timestamp;
    completedToday: number;
    totalForDay: number;
    currentBatch: UiTask[];
    remainingTasks: UiTask[];
    isOnBreak: boolean;
    breakEndTime: Timestamp | null;
}

// --- MOCK DATA GENERATION ---

const generateTasks = (count: number, idStartIndex: number, type: 'Interstitial' | 'Pop'): Task[] => {
    const getPoints = (taskType: 'Interstitial' | 'Pop'): number => {
        if (taskType === 'Interstitial') {
            const min = 35; const max = 45;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        } else {
            const min = 45; const max = 55;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };

    const getDuration = (taskType: 'Interstitial' | 'Pop'): number => {
        if (taskType === 'Interstitial') {
            return 15;
        } else { // Pop Ad
            const durations = [10, 15, 20];
            return durations[Math.floor(Math.random() * durations.length)];
        }
    };

    const titlePrefix = type === 'Interstitial' ? 'Inters' : 'Pop';
    const descriptionType = type === 'Interstitial' ? 'inters' : 'pop';

    return Array.from({ length: count }, (_, i) => ({
        id: idStartIndex + i + 1,
        title: `${titlePrefix} Ad #${i + 1}`, // Title number is now sequential from 1 for each type
        description: `Watch this short ${descriptionType} ad to earn points.`,
        duration: getDuration(type),
        points: getPoints(type),
    }));
};

const generateAllDailyTasks = (): UiTask[] => {
    const interstitialTasks: UiTask[] = generateTasks(1400, 0, 'Interstitial').map(task => ({
        ...task,
        categoryIcon: 'fa-solid fa-rectangle-ad', // Reverted to a more appropriate icon
        categoryIconBgColor: 'bg-red-100',
        categoryIconColor: 'text-red-500',
    }));

    // ID start index is kept to ensure unique IDs across all tasks.
    const popTasks: UiTask[] = generateTasks(1100, 1400, 'Pop').map(task => ({
        ...task,
        categoryIcon: 'fa-solid fa-window-restore', // Reverted to a more appropriate icon
        categoryIconBgColor: 'bg-blue-100',
        categoryIconColor: 'text-blue-500',
    }));
    
    const allTasks = [...interstitialTasks, ...popTasks];
    
    // Fisher-Yates (aka Knuth) Shuffle to randomize tasks
    for (let i = allTasks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allTasks[i], allTasks[j]] = [allTasks[j], allTasks[i]];
    }

    return allTasks;
};

// ===================================================================================
// USER PROFILE FUNCTIONS
// ===================================================================================

const generateDyverzeId = (): string => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `DYZ${randomNum}`;
};

export const createUserProfileDocument = async (userAuth: User, additionalData: { fullName: string }): Promise<void> => {
    const userDocRef = doc(db, "users", userAuth.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        const { email, uid } = userAuth;
        const { fullName } = additionalData;
        const username = fullName.split(' ')[0].toLowerCase();

        const newProfile: UserProfile = {
            uid,
            email: email || '',
            fullName,
            username,
            dyverzeId: generateDyverzeId(),
            points: 0,
            avatarUrl: "",
            bio: "",
            dob: "",
            address: "",
            phone: "",
            lastPhoneUpdate: null,
            referralLink: `https://dyverze.ads/ref/${uid}`,
            referrals: {
                count: 0,
                activeCount: 0,
                directEarnings: 0,
                commissionEarnings: 0,
            },
            spinStats: {
                lastDate: "",
                count: 0,
                wins: 0,
                losses: 0
            },
            dailyCheckIn: {
                lastDate: "",
                streak: 0
            },
            taskStats: {
                completed: 0,
            },
            withdrawalStats: {
                pending: 0,
                completed: 0,
                redeemedCount: 0,
            },
        };
        await setDoc(userDocRef, newProfile);
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, "users", uid);
    // @ts-ignore - Compat with partial updates including FieldValues
    await updateDoc(userDocRef, data);
};

export const getUserProfile = async (user: User): Promise<UserProfile | null> => {
    const userDocRef = doc(db, "users", user.uid);
    let userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        const data = userDocSnap.data() as any; // Use any for migration
        let needsUpdate = false;

        // For backward compatibility, ensure new stats objects exist
        if (!data.withdrawalStats) {
            data.withdrawalStats = { pending: 0, completed: 0, redeemedCount: 0 };
            needsUpdate = true;
        }
        if (!data.taskStats) {
            data.taskStats = { completed: 0 };
            needsUpdate = true;
        }
        if (!data.dyverzeId) {
            data.dyverzeId = generateDyverzeId();
            needsUpdate = true;
        }
        // Spin Stats Migration
        if (!data.spinStats) {
            data.spinStats = { lastDate: "", count: 0, wins: 0, losses: 0 };
            needsUpdate = true;
        }
        
        // Daily Check-In Migration
        if (!data.dailyCheckIn) {
            data.dailyCheckIn = { lastDate: "", streak: 0 };
            needsUpdate = true;
        }

        // Migration from firstName/lastName to fullName
        if (!data.fullName && (data.firstName || data.lastName)) {
            data.fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            delete data.firstName;
            delete data.lastName;
            needsUpdate = true;
        }
        if (data.lastPhoneUpdate === undefined) {
            data.lastPhoneUpdate = null;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            await updateDoc(userDocRef, data);
        }

        return data as UserProfile;
    } else {
       console.warn(`No profile found for user ${user.uid}. Creating a fallback profile.`);
       try {
            const fullName = user.displayName || user.email?.split('@')[0] || 'User';
            await createUserProfileDocument(user, { fullName });
            
            const newDocSnap = await getDoc(userDocRef);
            if (newDocSnap.exists()) {
                return newDocSnap.data() as UserProfile;
            } else {
                console.error('Failed to fetch newly created profile.');
                return null;
            }
       } catch (error) {
           console.error('Error creating fallback profile:', error);
           return null;
       }
    }
};

export const addTaskHistoryItem = async (uid: string, taskItem: Omit<TaskHistory, 'id' | 'timestamp'>): Promise<void> => {
    const userDocRef = doc(db, "users", uid);
    const historyCollectionRef = collection(db, "users", uid, "taskHistory");
    const newHistoryDocRef = doc(historyCollectionRef);

    const batch = writeBatch(db);
    batch.update(userDocRef, { 
        points: increment(taskItem.reward),
        'taskStats.completed': increment(1)
    });
    batch.set(newHistoryDocRef, { ...taskItem, timestamp: serverTimestamp() });
    await batch.commit();
};

export const addWithdrawalRequest = async (uid: string, withdrawalItem: Omit<Withdrawal, 'id' | 'timestamp'>): Promise<void> => {
    const userDocRef = doc(db, "users", uid);
    const historyCollectionRef = collection(db, "users", uid, "withdrawalHistory");
    const newHistoryDocRef = doc(historyCollectionRef);

    const pointsToDeduct = withdrawalItem.amount * 83500;

    const userDoc = await getDoc(userDocRef);
    const currentPoints = userDoc.data()?.points || 0;
    if (currentPoints < pointsToDeduct) {
        throw new Error("Insufficient points for this withdrawal.");
    }

    const batch = writeBatch(db);
    batch.update(userDocRef, { 
        points: increment(-pointsToDeduct),
        'withdrawalStats.pending': increment(withdrawalItem.amount),
        'withdrawalStats.redeemedCount': increment(1)
    });
    batch.set(newHistoryDocRef, { ...withdrawalItem, timestamp: serverTimestamp() });
    await batch.commit();
};

export const claimDailyCheckIn = async (uid: string, reward: number, todayStr: string, newStreak: number): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", uid);

    await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        if (!userDoc.exists()) {
            throw new Error("User does not exist!");
        }

        const data = userDoc.data() as UserProfile;
        const currentCheckIn = data.dailyCheckIn || { lastDate: '', streak: 0 };

        if (currentCheckIn.lastDate === todayStr) {
             throw new Error("Already checked in today");
        }

        transaction.update(userDocRef, {
            points: increment(reward),
            dailyCheckIn: {
                lastDate: todayStr,
                streak: newStreak
            }
        });
    });

    const updatedSnapshot = await getDoc(userDocRef);
    return updatedSnapshot.data() as UserProfile;
};

// --- NEW: Spin Wheel Transaction ---
export const saveSpinResult = async (uid: string, pointsWon: number, currentDateStr: string): Promise<UserProfile> => {
    const userDocRef = doc(db, "users", uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("User does not exist!");
            }

            const data = userDoc.data() as UserProfile;
            const currentStats = data.spinStats || { lastDate: '', count: 0, wins: 0, losses: 0 };

            // Check date logic
            let newCount = currentStats.count;
            let newWins = currentStats.wins;
            let newLosses = currentStats.losses;

            if (currentStats.lastDate !== currentDateStr) {
                // New Day
                newCount = 1;
                newWins = pointsWon > 0 ? 1 : 0;
                newLosses = pointsWon === 0 ? 1 : 0;
            } else {
                // Same Day
                if (newCount >= 10) {
                    throw new Error("Daily spin limit (10) reached.");
                }
                newCount += 1;
                if (pointsWon > 0) newWins += 1;
                else newLosses += 1;
            }

            // Update User
            transaction.update(userDocRef, {
                points: increment(pointsWon),
                spinStats: {
                    lastDate: currentDateStr,
                    count: newCount,
                    wins: newWins,
                    losses: newLosses
                }
            });
        });

        // Return fresh data
        const updatedSnapshot = await getDoc(userDocRef);
        return updatedSnapshot.data() as UserProfile;

    } catch (e) {
        console.error("Spin transaction failed:", e);
        throw e;
    }
};

export const deleteUserData = async (uid: string): Promise<void> => {
    // This function deletes the user's main document and their daily state.
    // Deleting subcollections on the client is not recommended for production apps without recursion.
    // Here we simplify by deleting the main docs.
    try {
        const userDocRef = doc(db, "users", uid);
        const dailyStateDocRef = doc(db, "user_daily_states", uid);

        const batch = writeBatch(db);
        batch.delete(userDocRef);
        batch.delete(dailyStateDocRef);

        await batch.commit();
    } catch (error) {
        console.error("Error deleting user data:", error);
        throw new Error("Could not delete user data from the database.");
    }
};


// ===================================================================================
// PAGINATED HISTORY FUNCTIONS
// ===================================================================================
const PAGINATION_LIMIT = 15;

export const getTaskHistoryPaginated = async (uid: string, startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    const historyCollectionRef = collection(db, "users", uid, "taskHistory");
    let q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(PAGINATION_LIMIT));
    
    if (startAfterDoc) {
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), startAfter(startAfterDoc), limit(PAGINATION_LIMIT));
    }
    
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskHistory));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { history, lastVisible };
};

export const getWithdrawalHistoryPaginated = async (uid: string, startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    const historyCollectionRef = collection(db, "users", uid, "withdrawalHistory");
    let q = query(historyCollectionRef, orderBy('timestamp', 'desc'), limit(PAGINATION_LIMIT));
    
    if (startAfterDoc) {
        q = query(historyCollectionRef, orderBy('timestamp', 'desc'), startAfter(startAfterDoc), limit(PAGINATION_LIMIT));
    }
    
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { history, lastVisible };
};


// ===================================================================================
// NEW TASK BATCHING & PAUSE SYSTEM
// ===================================================================================

const getTaskStateDocRef = (uid: string) => doc(db, "user_daily_states", uid);

const createNewDailyState = async (uid: string): Promise<UserDailyState> => {
    const allTasks = generateAllDailyTasks();
    const batchSize = Math.floor(Math.random() * (420 - 180 + 1)) + 180; // Random batch size between 180-420
    
    const newState: UserDailyState = {
        lastUpdated: Timestamp.now(),
        completedToday: 0,
        totalForDay: allTasks.length,
        currentBatch: allTasks.slice(0, batchSize),
        remainingTasks: allTasks.slice(batchSize),
        isOnBreak: false,
        breakEndTime: null,
    };
    
    await setDoc(getTaskStateDocRef(uid), newState);
    return newState;
};

export const getDailyTaskState = async (uid: string) => {
    const taskDocRef = getTaskStateDocRef(uid);
    let stateDoc = await getDoc(taskDocRef);
    let state: UserDailyState;

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    if (!stateDoc.exists() || !isSameDay(stateDoc.data()!.lastUpdated.toDate(), new Date())) {
        // If no state exists or it's from a previous day, create a new one.
        state = await createNewDailyState(uid);
    } else {
        state = stateDoc.data() as UserDailyState;
        
        // Check if the user is on a break and if the break time has ended.
        if (state.isOnBreak && state.breakEndTime && state.breakEndTime.toDate() <= new Date()) {
            // Break is over. Load the next batch of tasks.
            const batchSize = Math.floor(Math.random() * (420 - 180 + 1)) + 180;
            const newBatch = state.remainingTasks.slice(0, batchSize);
            const newRemaining = state.remainingTasks.slice(batchSize);

            state.currentBatch = newBatch;
            state.remainingTasks = newRemaining;
            state.isOnBreak = false;
            state.breakEndTime = null;
            state.lastUpdated = Timestamp.now();
            
            // Update the state in Firestore.
            await setDoc(taskDocRef, state);
        }
    }
    
    return {
        tasks: state.currentBatch,
        isOnBreak: state.isOnBreak,
        breakEndTime: state.breakEndTime ? state.breakEndTime.toDate() : null,
        completedToday: state.completedToday,
        totalForDay: state.totalForDay,
        availableInBatch: state.currentBatch.length
    };
};

export const completeTask = async (uid: string, taskId: number): Promise<void> => {
    const taskDocRef = getTaskStateDocRef(uid);

    await runTransaction(db, async (transaction) => {
        const stateDoc = await transaction.get(taskDocRef);
        if (!stateDoc.exists()) {
            throw new Error("Daily task state not found. Please refresh.");
        }
        
        const state = stateDoc.data() as UserDailyState;
        
        const taskToComplete = state.currentBatch.find(task => task.id === taskId);
        const newBatch = state.currentBatch.filter(task => task.id !== taskId);
        
        if (newBatch.length < state.currentBatch.length && taskToComplete) {
            const updatedState: Partial<UserDailyState> = {
                completedToday: state.completedToday + 1,
                currentBatch: newBatch,
                lastUpdated: Timestamp.now(),
            };
            
            // Check if the batch is now empty to trigger a break
            if (newBatch.length === 0 && state.remainingTasks.length > 0) {
                updatedState.isOnBreak = true;
                const breakMinutes = Math.floor(Math.random() * (120 - 90 + 1)) + 90; // 90-120 mins
                const breakEndTime = new Date(Date.now() + breakMinutes * 60 * 1000);
                updatedState.breakEndTime = Timestamp.fromDate(breakEndTime);
            }
            
            transaction.update(taskDocRef, updatedState);

        } else {
             console.warn(`Task with ID ${taskId} not found in current batch. Might be a refresh mismatch.`);
        }
    });
};


// ===================================================================================
// RANKING FUNCTIONS
// ===================================================================================
export const getRankings = async (currentUid: string): Promise<RankedUser[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy('points', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    const rankings: RankedUser[] = [];
    querySnapshot.docs.forEach((doc, index) => {
        const userData = doc.data() as UserProfile & { firstName?: string; lastName?: string };
        rankings.push({
            uid: userData.uid,
            rank: index + 1,
            name: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            avatar: userData.avatarUrl,
            points: userData.points,
            isCurrentUser: userData.uid === currentUid
        });
    });
    return rankings;
};

// ===================================================================================
// NOTIFICATION FUNCTIONS
// ===================================================================================
export const getNotifications = async (uid: string): Promise<Notification[]> => {
    const notificationsRef = collection(db, "users", uid, "notifications");
    const q = query(notificationsRef, orderBy('time', 'desc'), limit(20));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return []; // Return empty array if no notifications exist
    }

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const timeSince = (date: Date): string => {
            const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + "y ago";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + "mo ago";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d ago";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h ago";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + "m ago";
            return Math.floor(seconds) + "s ago";
        }
        
        const notificationDate = data.time instanceof Timestamp ? data.time.toDate() : new Date();

        return { 
            id: doc.id,
             ...data,
             time: timeSince(notificationDate),
        } as Notification;
    });
};
