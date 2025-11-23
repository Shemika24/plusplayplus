
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
    DocumentData,
    where,
    getCountFromServer
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

const POINTS_PER_DOLLAR = 100000;

// --- MOCK DATA GENERATION ---

const generateTasks = (count: number, idStartIndex: number, type: 'Interstitial' | 'Pop'): Task[] => {
    const getPoints = (taskType: 'Interstitial' | 'Pop'): number => {
        const pointsOptions = [75, 100];
        const randomIndex = Math.floor(Math.random() * pointsOptions.length);
        return pointsOptions[randomIndex];
    };

    const getDuration = (taskType: 'Interstitial' | 'Pop'): number => {
        if (taskType === 'Interstitial') {
            return 15; // Set to 15s
        } else { // Pop Ad
            return 20; // Set to 20s
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
    const TOTAL_TASKS = 1750;
    
    // Ensure a mix: Minimum 100 of each type, randomize the rest
    const minCount = 100;
    const availableRandomSlots = TOTAL_TASKS - (minCount * 2);
    
    // Randomly determine Interstitial count
    const randomAddition = Math.floor(Math.random() * (availableRandomSlots + 1));
    const interstitialCount = minCount + randomAddition;
    
    // The rest are Pop ads
    const popCount = TOTAL_TASKS - interstitialCount;

    // Generate Interstitial Tasks (IDs 1 to interstitialCount)
    const interstitialTasks: UiTask[] = generateTasks(interstitialCount, 0, 'Interstitial').map(task => ({
        ...task,
        categoryIcon: 'fa-solid fa-rectangle-ad', 
        categoryIconBgColor: 'bg-red-100',
        categoryIconColor: 'text-red-500',
    }));

    // Generate Pop Tasks (IDs interstitialCount+1 to 1750)
    const popTasks: UiTask[] = generateTasks(popCount, interstitialCount, 'Pop').map(task => ({
        ...task,
        categoryIcon: 'fa-solid fa-window-restore', 
        categoryIconBgColor: 'bg-blue-100',
        categoryIconColor: 'text-blue-500',
    }));
    
    const allTasks = [...interstitialTasks, ...popTasks];
    
    // Fisher-Yates (aka Knuth) Shuffle to randomize tasks order
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

interface CreateProfileOptions {
    fullName: string;
    avatarUrl?: string;
}

export const createUserProfileDocument = async (userAuth: User, additionalData: CreateProfileOptions): Promise<void> => {
    const userDocRef = doc(db, "users", userAuth.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        const { email, uid } = userAuth;
        const { fullName, avatarUrl } = additionalData;
        
        let finalUsername = fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let finalAvatarUrl = avatarUrl || "";
        let finalDeviceInfo = navigator.userAgent;
        let finalFullName = fullName;

        // --- TELEGRAM DATA INTEGRATION ---
        // If app is running in Telegram, use available data to populate profile
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            const tgUser = tg.initDataUnsafe?.user;

            if (tgUser) {
                // 1. Username: Prefer Telegram username if set
                if (tgUser.username) {
                    finalUsername = tgUser.username;
                }

                // 2. Avatar: Use Telegram photo if user didn't explicitly provide one during signup
                // (Note: `avatarUrl` from additionalData comes from the camera input in signup, which doesn't exist yet in the current flow)
                if (!finalAvatarUrl && tgUser.photo_url) {
                    finalAvatarUrl = tgUser.photo_url;
                }
                
                // 3. Device Info: Add Platform
                if (tg.platform) {
                    finalDeviceInfo = `${finalDeviceInfo} [Telegram: ${tg.platform} v${tg.version}]`;
                }
            }
        }
        // ---------------------------------
        
        const refCode = uid;
        const referralLink = `${window.location.origin}?ref=${refCode}`;

        const newProfile: UserProfile = {
            uid,
            email: email || '',
            fullName: finalFullName,
            username: finalUsername,
            dyverzeId: generateDyverzeId(),
            points: 0,
            theme: 'light',
            avatarUrl: finalAvatarUrl,
            bio: "",
            dob: "",
            address: "",
            phone: "",
            lastPhoneUpdate: null,
            deviceInfo: finalDeviceInfo, 
            notificationPreferences: {
                withdrawals: true,
                dailyCheckIn: true,
                luckyWheel: true,
                referrals: true,
                announcements: true
            },
            privacySettings: {
                showInRanking: true,
                allowPersonalizedAds: true,
                visibleToReferrals: true,
                showOnlineStatus: true
            },
            savedPaymentMethods: [],
            referralLink,
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

        // Theme Migration
        if (!data.theme) {
            data.theme = 'light';
            needsUpdate = true;
        }
        
        // Remove Language if exists
        if (data.language) {
            delete data.language;
            needsUpdate = true;
        }

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

        // Notification Preferences Migration
        if (!data.notificationPreferences) {
            data.notificationPreferences = {
                withdrawals: true,
                dailyCheckIn: true,
                luckyWheel: true,
                referrals: true,
                announcements: true
            };
            needsUpdate = true;
        }

        // Privacy Settings Migration
        if (!data.privacySettings) {
            data.privacySettings = {
                showInRanking: true,
                allowPersonalizedAds: true,
                visibleToReferrals: true,
                showOnlineStatus: true
            };
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

        // Migration for Payment Details (Single Object -> Array)
        if (!data.savedPaymentMethods) {
            if (data.paymentDetails) {
                // Migrate existing single method to array
                data.savedPaymentMethods = [data.paymentDetails];
                delete data.paymentDetails; // Optional: clean up old field
            } else {
                data.savedPaymentMethods = [];
            }
            needsUpdate = true;
        }

        // Update Device Info if changed
        if (data.deviceInfo !== navigator.userAgent) {
             data.deviceInfo = navigator.userAgent;
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

    const pointsToDeduct = withdrawalItem.amount * POINTS_PER_DOLLAR;

    const userDoc = await getDoc(userDocRef);
    const currentPoints = (userDoc.data() as UserProfile)?.points || 0;
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

        // Strict server-side check
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
    try {
        // 1. Delete Subcollections (Recursively delete in batches)
        const subcollections = ["taskHistory", "withdrawalHistory", "notifications"];
        
        for (const subCol of subcollections) {
            const subColRef = collection(db, "users", uid, subCol);
            
            while (true) {
                // Get batch of 500 documents
                const q = query(subColRef, limit(500));
                const snapshot = await getDocs(q);
                
                if (snapshot.empty) break;

                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
        }

        // 2. Delete Main Documents
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
const PAGINATION_LIMIT = 100;

export const getTaskHistoryPaginated = async (
    uid: string, 
    startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    startDate?: Date,
    endDate?: Date
) => {
    const historyCollectionRef = collection(db, "users", uid, "taskHistory");
    
    // Build constraints array
    const constraints: any[] = [orderBy('timestamp', 'desc')];

    if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }
    
    constraints.push(limit(PAGINATION_LIMIT));

    const q = query(historyCollectionRef, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as DocumentData) } as TaskHistory));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { history, lastVisible };
};

// NEW: Count Function
export const getTaskHistoryCount = async (uid: string, startDate?: Date, endDate?: Date): Promise<number> => {
    const historyCollectionRef = collection(db, "users", uid, "taskHistory");
    const constraints: any[] = [];

    if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(historyCollectionRef, ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
};

export const getWithdrawalHistoryPaginated = async (
    uid: string, 
    startAfterDoc: QueryDocumentSnapshot<DocumentData> | null = null,
    startDate?: Date,
    endDate?: Date
) => {
    const historyCollectionRef = collection(db, "users", uid, "withdrawalHistory");
    
    const constraints: any[] = [orderBy('timestamp', 'desc')];

    if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }
    
    if (startAfterDoc) {
        constraints.push(startAfter(startAfterDoc));
    }
    
    constraints.push(limit(PAGINATION_LIMIT));
    
    const q = query(historyCollectionRef, ...constraints);
    
    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as DocumentData) } as Withdrawal));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return { history, lastVisible };
};

export const getWithdrawalHistoryCount = async (uid: string, startDate?: Date, endDate?: Date): Promise<number> => {
    const historyCollectionRef = collection(db, "users", uid, "withdrawalHistory");
    const constraints: any[] = [];

    if (startDate) {
        constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
        constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(historyCollectionRef, ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
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

    // Use New York time for date comparison
    const getTargetDate = (date: Date) => {
        const dateString = date.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
        return dateString; // Returns YYYY-MM-DD in New York time
    };

    const currentTargetDateStr = getTargetDate(new Date());
    const lastUpdatedTargetDateStr = stateDoc.exists() ? getTargetDate((stateDoc.data() as UserDailyState).lastUpdated.toDate()) : '';

    if (!stateDoc.exists() || lastUpdatedTargetDateStr !== currentTargetDateStr) {
        // If no state exists or it's from a previous day (New York time), create a new one.
        state = await createNewDailyState(uid);
    } else {
        state = stateDoc.data() as UserDailyState;
        
        // DATA MIGRATION FIX:
        // If user has existing tasks in their DB, force upgrade their duration and points
        let dataModified = false;
        const sanitizeTask = (t: UiTask) => {
            const isInterstitial = t.categoryIcon.includes('fa-rectangle-ad');
            const targetDuration = isInterstitial ? 15 : 20; // 15s for Inters, 20s for Pop
            
            if (t.duration !== targetDuration) {
                t.duration = targetDuration;
                dataModified = true;
            }
            
            // Migrate points to be 75 or 100 if they aren't already (e.g., if they are 50)
            const validPoints = [75, 100];
            if (!validPoints.includes(t.points)) {
                const randomIndex = Math.floor(Math.random() * validPoints.length);
                t.points = validPoints[randomIndex];
                dataModified = true;
            }
            
            return t;
        };

        state.currentBatch = state.currentBatch.map(sanitizeTask);
        state.remainingTasks = state.remainingTasks.map(sanitizeTask);

        if (dataModified) {
            // Persist the migrated data so we don't have to do it again
            // Using updateDoc with the specific fields to avoid overwriting other state changes if any
            await updateDoc(taskDocRef, {
                currentBatch: state.currentBatch,
                remainingTasks: state.remainingTasks
            });
        }

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

// CRITICAL UPDATE: Atomic Transaction for Task Completion + Point Increment
export const completeTask = async (uid: string, taskId: number, points: number, historyItem: Omit<TaskHistory, 'id' | 'timestamp'>): Promise<void> => {
    const taskDocRef = getTaskStateDocRef(uid);
    const userDocRef = doc(db, "users", uid);
    const historyCollectionRef = collection(db, "users", uid, "taskHistory");
    const newHistoryDocRef = doc(historyCollectionRef);

    await runTransaction(db, async (transaction) => {
        const stateDoc = await transaction.get(taskDocRef);
        const userDoc = await transaction.get(userDocRef);

        if (!stateDoc.exists()) {
            throw new Error("Daily task state not found. Please refresh.");
        }
        if (!userDoc.exists()) {
             throw new Error("User Profile not found.");
        }
        
        const state = stateDoc.data() as UserDailyState;
        
        // 1. Verify Task is in Current Batch
        const taskToComplete = state.currentBatch.find(task => task.id === taskId);
        const newBatch = state.currentBatch.filter(task => task.id !== taskId);
        
        // If task is found and removed successfully
        if (newBatch.length < state.currentBatch.length && taskToComplete) {
            const updatedState: Partial<UserDailyState> = {
                completedToday: state.completedToday + 1,
                currentBatch: newBatch,
                lastUpdated: Timestamp.now(),
            };
            
            // Check if the batch is now empty to trigger a break
            if (newBatch.length === 0) {
                updatedState.isOnBreak = true;
                let breakMinutes: number;

                if (state.remainingTasks.length > 0) {
                    // Standard break: 30 to 60 minutes (reduced from 90-120)
                    breakMinutes = Math.floor(Math.random() * (60 - 30 + 1)) + 30;
                } else {
                    // Last break (Tasks done): 12 hours (720 minutes)
                    breakMinutes = 12 * 60;
                }
                
                const breakEndTime = new Date(Date.now() + breakMinutes * 60 * 1000);
                updatedState.breakEndTime = Timestamp.fromDate(breakEndTime);
            }
            
            // 2. Perform All Writes Atomically
            transaction.update(taskDocRef, updatedState);
            
            transaction.update(userDocRef, {
                points: increment(points),
                'taskStats.completed': increment(1)
            });

            transaction.set(newHistoryDocRef, {
                ...historyItem,
                timestamp: serverTimestamp()
            });

        } else {
             console.warn(`Task with ID ${taskId} not found in current batch. Might be a refresh mismatch.`);
             // We do NOT throw here to avoid crashing the UI if user doubled clicked, but we don't award points either.
        }
    });
};

export const getNotifications = async (uid: string): Promise<Notification[]> => {
    const notificationsRef = collection(db, "users", uid, "notifications");
    // Assuming a 'createdAt' or 'date' field for sorting
    const q = query(notificationsRef, orderBy('date', 'desc'), limit(20));

    try {
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data() as any;
            let timeStr = '';
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                timeStr = data.timestamp.toDate().toLocaleString("en-US", { timeZone: "America/New_York" });
            } else if (data.date) {
                 timeStr = data.date;
            }

            return {
                id: doc.id,
                icon: data.icon || 'fa-solid fa-bell',
                iconColor: data.iconColor || 'text-blue-500',
                title: data.title || 'Notification',
                description: data.description || '',
                time: timeStr,
                isRead: data.isRead || false
            } as Notification;
        });
    } catch (error) {
        console.warn("Error fetching notifications:", error);
        return [];
    }
};

export const getRankings = async (currentUserUid: string): Promise<RankedUser[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("points", "desc"), limit(50));

    try {
        const querySnapshot = await getDocs(q);
        const rankings: RankedUser[] = [];
        let rank = 1;

        querySnapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            rankings.push({
                uid: doc.id,
                rank: rank++,
                name: data.fullName || data.username || "User",
                avatar: data.avatarUrl || "",
                points: data.points || 0,
                isCurrentUser: doc.id === currentUserUid
            });
        });

        return rankings;
    } catch (error) {
        console.error("Error fetching rankings:", error);
        return [];
    }
};
